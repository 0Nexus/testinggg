import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

describe('Security Infrastructure', () => {
  const TEST_SECRET = 'test_jwt_secret_key_32_chars_long!!';

  describe('JWT Authentication & Token Security', () => {
    it('should generate and correctly verify valid JWT tokens', () => {
      const payload = { userId: 'usr-1', email: 'test@tidycorp.co.uk', role: 'contractor' };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '24h' });

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, TEST_SECRET) as jwt.JwtPayload;
      expect(decoded.userId).toBe('usr-1');
      expect(decoded.email).toBe('test@tidycorp.co.uk');
      expect(decoded.role).toBe('contractor');
    });

    it('should reject tokens signed with an invalid secret', () => {
      const payload = { userId: 'usr-1', role: 'contractor' };
      const token = jwt.sign(payload, 'secret-a', { expiresIn: '1h' });

      expect(() => {
        jwt.verify(token, 'secret-b');
      }).toThrow();
    });

    it('should reject expired tokens', async () => {
      const payload = { userId: 'usr-1' };
      const expiredToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });

      expect(() => {
        jwt.verify(expiredToken, TEST_SECRET);
      }).toThrow();
    });
  });

  describe('Password Hashing & Hashing Integrity', () => {
    it('should correctly hash and verify passwords using bcrypt', async () => {
      const rawPassword = 'SecurePassword2026!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(rawPassword, salt);

      expect(hash).not.toEqual(rawPassword);
      const isMatch = await bcrypt.compare(rawPassword, hash);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const rawPassword = 'CorrectPassword';
      const hash = await bcrypt.hash(rawPassword, 10);

      const isMatch = await bcrypt.compare('WrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('Airwallex HMAC Signature Verification', () => {
    function verifyAirwallexSignature(
      signature: string,
      timestamp: string,
      bodyStr: string,
      secret: string
    ): boolean {
      if (!signature || !secret) return false;
      const payloadToSign = timestamp ? `${timestamp}${bodyStr}` : bodyStr;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadToSign)
        .digest('hex');

      try {
        return crypto.timingSafeEqual(
          Buffer.from(signature, 'utf8'),
          Buffer.from(expectedSignature, 'utf8')
        );
      } catch (e) {
        return false;
      }
    }

    it('should cryptographically verify authentic HMAC SHA-256 signatures', () => {
      const secret = 'whsec_airwallex_test_secret_key_123';
      const timestamp = '1785766500';
      const body = JSON.stringify({ event: 'payment_intent.succeeded', amount: 5000 });
      const payloadToSign = `${timestamp}${body}`;

      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadToSign)
        .digest('hex');

      const isVerified = verifyAirwallexSignature(validSignature, timestamp, body, secret);
      expect(isVerified).toBe(true);
    });

    it('should reject tampered payload or forged signatures', () => {
      const secret = 'whsec_airwallex_test_secret_key_123';
      const timestamp = '1785766500';
      const originalBody = JSON.stringify({ event: 'payment_intent.succeeded', amount: 5000 });
      const tamperedBody = JSON.stringify({ event: 'payment_intent.succeeded', amount: 500000 });

      const payloadToSign = `${timestamp}${originalBody}`;
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadToSign)
        .digest('hex');

      const isVerified = verifyAirwallexSignature(validSignature, timestamp, tamperedBody, secret);
      expect(isVerified).toBe(false);
    });
  });
});
