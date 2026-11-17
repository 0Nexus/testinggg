import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fetchSecretFromGCP } from './airwallexServer.js';

const DEV_SECRET_FILE = path.join(process.cwd(), '.env.jwt.local');
const PASSWORD_CIPHER_PREFIX = 'jwt_enc_v1';
const BCRYPT_ROUNDS = 10;

let resolvedJwtSecretCache: string | null = null;

function readOrCreateDevJwtSecret(): string {
  try {
    if (fs.existsSync(DEV_SECRET_FILE)) {
      const existing = fs.readFileSync(DEV_SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) {
        return existing;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(DEV_SECRET_FILE, generated + '\n', { mode: 0o600 });
    return generated;
  } catch {
    return crypto.randomBytes(32).toString('hex');
  }
}

/**
 * Resolves the JWT_SECRET used both for JWT session signing and
 * AES-256-GCM / HMAC-SHA256 password encryption.
 *
 * Resolution priority:
 * 1. process.env.JWT_SECRET
 * 2. Google Secret Manager secret 'JWT_SECRET'
 * 3. In development: persistent local key file (.env.jwt.local, gitignored)
 * 4. In production: throws fatal security error if neither env nor Secret Manager provides JWT_SECRET
 */
export async function resolveJwtSecretAsync(): Promise<string> {
  if (resolvedJwtSecretCache) {
    return resolvedJwtSecretCache;
  }

  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret) {
    resolvedJwtSecretCache = envSecret;
    return resolvedJwtSecretCache;
  }

  try {
    const gcpSecret = await fetchSecretFromGCP('JWT_SECRET', { optional: true });
    if (gcpSecret.value && gcpSecret.value.trim()) {
      resolvedJwtSecretCache = gcpSecret.value.trim();
      return resolvedJwtSecretCache;
    }
  } catch {
    // Optional GCP secret lookup fallback
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET environment variable or GCP Secret Manager secret must be set in production.'
    );
  }

  console.warn(
    '[SECURITY] JWT_SECRET not set in environment or Secret Manager. Using persistent local development key (.env.jwt.local) for JWT sessions and password encryption.'
  );
  resolvedJwtSecretCache = readOrCreateDevJwtSecret();
  return resolvedJwtSecretCache;
}

/**
 * Synchronous accessor for the resolved JWT_SECRET after server startup.
 */
export function getJwtSecretSync(): string {
  if (resolvedJwtSecretCache) {
    return resolvedJwtSecretCache;
  }
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret) {
    resolvedJwtSecretCache = envSecret;
    return resolvedJwtSecretCache;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET must be initialized before synchronous access in production.'
    );
  }
  resolvedJwtSecretCache = readOrCreateDevJwtSecret();
  return resolvedJwtSecretCache;
}

function derivePasswordKeys(jwtSecret: string): { hmacKey: Buffer; aesKey: Buffer } {
  const hmacKey = crypto
    .createHmac('sha256', jwtSecret)
    .update('tidycorp:password-hmac-pepper:v1')
    .digest();

  const aesKey = crypto
    .createHmac('sha256', jwtSecret)
    .update('tidycorp:password-aes256gcm-key:v1')
    .digest();

  return { hmacKey, aesKey };
}

function computeKeyedDigest(plainPassword: string, hmacKey: Buffer): string {
  return crypto.createHmac('sha256', hmacKey).update(plainPassword, 'utf8').digest('hex');
}

/**
 * Hashes a plaintext password keyed with JWT_SECRET (HMAC-SHA256 pepper + bcrypt)
 * and encrypts the resulting hash at rest using AES-256-GCM derived from JWT_SECRET.
 */
export async function encryptAndHashPassword(plainPassword: string): Promise<string> {
  const jwtSecret = await resolveJwtSecretAsync();
  const { hmacKey, aesKey } = derivePasswordKeys(jwtSecret);

  const keyedDigest = computeKeyedDigest(plainPassword, hmacKey);
  const bcryptHash = await bcrypt.hash(keyedDigest, BCRYPT_ROUNDS);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(bcryptHash, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PASSWORD_CIPHER_PREFIX}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export interface PasswordVerificationResult {
  valid: boolean;
  needsReencryption: boolean;
}

/**
 * Verifies a plaintext password against a JWT-encrypted stored password hash
 * (`jwt_enc_v1:...`), while maintaining seamless migration support for any
 * pre-existing legacy bcrypt hashes (`$2a$` / `$2b$` / `$2y$`).
 */
export async function verifyEncryptedPassword(
  plainPassword: string,
  storedValue: string
): Promise<PasswordVerificationResult> {
  if (!plainPassword || !storedValue) {
    return { valid: false, needsReencryption: false };
  }

  if (storedValue.startsWith(`${PASSWORD_CIPHER_PREFIX}:`)) {
    const parts = storedValue.split(':');
    if (parts.length !== 4) {
      return { valid: false, needsReencryption: false };
    }

    const [, ivHex, authTagHex, cipherHex] = parts;
    try {
      const jwtSecret = await resolveJwtSecretAsync();
      const { hmacKey, aesKey } = derivePasswordKeys(jwtSecret);

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(cipherHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
      decipher.setAuthTag(authTag);
      const decryptedBcryptHash = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]).toString('utf8');

      const keyedDigest = computeKeyedDigest(plainPassword, hmacKey);
      const valid = await bcrypt.compare(keyedDigest, decryptedBcryptHash);
      return { valid, needsReencryption: false };
    } catch {
      return { valid: false, needsReencryption: false };
    }
  }

  // Legacy bcrypt hash fallback (transparently triggers upgrade on login)
  if (storedValue.startsWith('$2')) {
    const valid = await bcrypt.compare(plainPassword, storedValue);
    return { valid, needsReencryption: valid };
  }

  return { valid: false, needsReencryption: false };
}
