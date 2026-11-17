import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  getApp as getAdminApp
} from 'firebase-admin/app';
import {
  getFirestore as getAdminFirestore,
  Firestore as AdminFirestore
} from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { encryptAndHashPassword } from './authCrypto.js';
import {
  initialProjects,
  defaultMCPRules,
  defaultGatewayConfig,
  initialTransactions,
  initialVettedContractors
} from '../data/mockData.js';
import {
  User,
  RenovationProject,
  MCPRule,
  GatewayConfig,
  PaymentTransaction,
  VettedContractor,
  ContractorInvitationLog,
  AirwallexCheckoutSession,
  StripeCheckoutSession,
  PartnerStackConfig,
  PartnerStackPartner,
  PartnerStackEvent,
  PartnerStackAttribution
} from '../types.js';

export interface StoredUser extends User {
  passwordHash: string;
  emailVerified?: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: string;
  partnerStackAttribution?: PartnerStackAttribution;
  partnerStackPartnerId?: string;
}

export interface PasswordResetRecord {
  token: string;
  otp: string;
  userId: string;
  email: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface UserScope {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}

const shouldSeedMockData = process.env.SEED_MOCK_DATA === 'true';

const DATA_DIR = path.join(process.cwd(), '.data');
const LOCAL_STORE_FILE = path.join(DATA_DIR, 'tidycorp-db.json');

let adminDb: AdminFirestore | null = null;
let firestoreProbed = false;
let firestoreAvailable = false;
let firestoreInitPromise: Promise<AdminFirestore | null> | null = null;

let defaultUserPasswordHashCache: string | null = null;
let adminPasswordHashCache: string | null = null;
let localStoreLoaded = false;

// In-memory working sets (always synchronized with atomic disk persistence + Firestore when available)
let memoryUsers: StoredUser[] = [];
let memoryProjects: RenovationProject[] = shouldSeedMockData ? [...initialProjects] : [];
let memoryMCPRules: MCPRule[] = [...defaultMCPRules];
let memoryGatewayConfig: GatewayConfig = { ...defaultGatewayConfig };
let memoryTransactions: PaymentTransaction[] = shouldSeedMockData ? [...initialTransactions] : [];
let memoryContractors: VettedContractor[] = [...initialVettedContractors];
let memoryLogs: ContractorInvitationLog[] = [];
let memoryCookieConsents: any[] = [];
let memoryAirwallexSessions: AirwallexCheckoutSession[] = [];
let memoryStripeSessions: StripeCheckoutSession[] = [];
let memoryPasswordResets: PasswordResetRecord[] = [];
let memoryPartnerStackConfig: PartnerStackConfig = {
  enabled: true,
  publicKey: process.env.PARTNERSTACK_PUBLIC_KEY || '',
  companyKey: process.env.PARTNERSTACK_COMPANY_KEY || '',
  partnerPortalUrl: process.env.PARTNERSTACK_PORTAL_URL || 'https://dash.partnerstack.com',
  defaultCommissionPercent: 20,
  contractorBountyGBP: 75,
  trackEscrowFees: true,
  autoApprovePartners: false,
  updatedAt: new Date().toISOString()
};
let memoryPartnerStackPartners: PartnerStackPartner[] = [];
let memoryPartnerStackEvents: PartnerStackEvent[] = [];

/**
 * Recursively removes undefined values from objects/arrays before Firestore or JSON serialization
 * so Firestore never rejects writes with "Unsupported field value: undefined".
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

function ensureLocalStoreLoaded() {
  if (localStoreLoaded) return;
  localStoreLoaded = true;
  try {
    if (!fs.existsSync(LOCAL_STORE_FILE)) return;
    const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf8');
    if (!raw.trim()) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.users)) memoryUsers = data.users;
    if (Array.isArray(data.projects)) memoryProjects = data.projects;
    if (Array.isArray(data.mcpRules)) memoryMCPRules = data.mcpRules;
    if (data.gatewayConfig && typeof data.gatewayConfig === 'object') memoryGatewayConfig = data.gatewayConfig;
    if (Array.isArray(data.transactions)) memoryTransactions = data.transactions;
    if (Array.isArray(data.contractors)) memoryContractors = data.contractors;
    if (Array.isArray(data.logs)) memoryLogs = data.logs;
    if (Array.isArray(data.cookieConsents)) memoryCookieConsents = data.cookieConsents;
    if (Array.isArray(data.airwallexSessions)) memoryAirwallexSessions = data.airwallexSessions;
    if (Array.isArray(data.stripeSessions)) memoryStripeSessions = data.stripeSessions;
    if (Array.isArray(data.passwordResets)) memoryPasswordResets = data.passwordResets;
    if (data.partnerStackConfig && typeof data.partnerStackConfig === 'object') {
      memoryPartnerStackConfig = data.partnerStackConfig;
    }
    if (Array.isArray(data.partnerStackPartners)) memoryPartnerStackPartners = data.partnerStackPartners;
    if (Array.isArray(data.partnerStackEvents)) memoryPartnerStackEvents = data.partnerStackEvents;
  } catch (err) {
    console.warn('[Store] Could not read local store snapshot:', (err as any)?.message || err);
  }
}

function persistLocalStore() {
  ensureLocalStoreLoaded();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const snapshot = stripUndefined({
      users: memoryUsers,
      projects: memoryProjects,
      mcpRules: memoryMCPRules,
      gatewayConfig: memoryGatewayConfig,
      transactions: memoryTransactions,
      contractors: memoryContractors,
      logs: memoryLogs,
      cookieConsents: memoryCookieConsents,
      airwallexSessions: memoryAirwallexSessions,
      stripeSessions: memoryStripeSessions,
      passwordResets: memoryPasswordResets,
      partnerStackConfig: memoryPartnerStackConfig,
      partnerStackPartners: memoryPartnerStackPartners,
      partnerStackEvents: memoryPartnerStackEvents,
      updatedAt: new Date().toISOString()
    });
    const tmpFile = `${LOCAL_STORE_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
    fs.renameSync(tmpFile, LOCAL_STORE_FILE);
  } catch (err) {
    console.warn('[Store] Failed to persist local store snapshot:', (err as any)?.message || err);
  }
}

// Hydrate local store immediately on module load
ensureLocalStoreLoaded();

async function getPasswordHash(passType: 'admin' | 'user'): Promise<string> {
  if (passType === 'admin') {
    if (!adminPasswordHashCache) {
      const adminPass =
        process.env.ADMIN_INITIAL_PASSWORD ||
        (process.env.NODE_ENV === 'production' ? crypto.randomBytes(16).toString('hex') : 'password123');
      adminPasswordHashCache = await encryptAndHashPassword(adminPass);
    }
    return adminPasswordHashCache;
  } else {
    if (!defaultUserPasswordHashCache) {
      const userPass = process.env.DEMO_INITIAL_PASSWORD || 'password123';
      defaultUserPasswordHashCache = await encryptAndHashPassword(userPass);
    }
    return defaultUserPasswordHashCache;
  }
}

function isFirestorePermissionOrAuthError(err: any): boolean {
  const code = err?.code;
  const msg = String(err?.message || '').toUpperCase();
  return (
    code === 7 ||
    code === 16 ||
    code === 'permission-denied' ||
    code === 'unauthenticated' ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('UNAUTHENTICATED') ||
    msg.includes('COULD NOT LOAD THE DEFAULT CREDENTIALS')
  );
}

function handleFirestoreRuntimeError(context: string, err: any) {
  if (isFirestorePermissionOrAuthError(err)) {
    if (firestoreAvailable) {
      console.warn(`[Firestore] Disabling remote Firestore sync after ${context} error (${err?.message || err}); using persistent local store.`);
    }
    firestoreAvailable = false;
  } else {
    console.warn(`[Firestore] ${context} fallback:`, err?.message || err);
  }
}

export async function initFirestoreDB(): Promise<AdminFirestore | null> {
  ensureLocalStoreLoaded();
  if (firestoreProbed) {
    return firestoreAvailable ? adminDb : null;
  }
  if (firestoreInitPromise) {
    return firestoreInitPromise;
  }

  firestoreInitPromise = (async () => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) {
        firestoreProbed = true;
        firestoreAvailable = false;
        return null;
      }

      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const app = getAdminApps().length
        ? getAdminApp()
        : initializeAdminApp({
            projectId: firebaseConfig.projectId
          });

      const dbInstance = firebaseConfig.firestoreDatabaseId
        ? getAdminFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getAdminFirestore(app);

      try {
        dbInstance.settings({ ignoreUndefinedProperties: true });
      } catch {
        // Ignore if settings were already configured
      }

      // Probe Firestore connectivity & IAM permissions with a strict timeout so requests never stall
      const probePromise = dbInstance.collection('users').limit(1).get();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore probe timeout (3000ms)')), 3000)
      );

      await Promise.race([probePromise, timeoutPromise]);

      adminDb = dbInstance;
      firestoreProbed = true;
      firestoreAvailable = true;
      console.log(`[Firestore] Connected via firebase-admin (db=${firebaseConfig.firestoreDatabaseId || '(default)'})`);
      return adminDb;
    } catch (err: any) {
      firestoreProbed = true;
      firestoreAvailable = false;
      adminDb = null;
      console.warn(
        `[Firestore] Remote Firestore unavailable in current runtime (${err?.message || err}). Persisting data to local store (${LOCAL_STORE_FILE}).`
      );
      return null;
    } finally {
      firestoreInitPromise = null;
    }
  })();

  return firestoreInitPromise;
}

export function getFirestoreDB(): AdminFirestore | null {
  return firestoreAvailable ? adminDb : null;
}

// Seed initial dataset into Firestore if empty - ONLY when explicitly enabled via SEED_MOCK_DATA=true
export async function seedFirestoreIfEmpty() {
  ensureLocalStoreLoaded();

  if (process.env.SEED_MOCK_DATA !== 'true') {
    console.log('[Firestore] Mock data seeding disabled (SEED_MOCK_DATA != true). Preserving clean database state.');
    await initFirestoreDB();
    return;
  }

  const userHash = await getPasswordHash('user');
  const adminHash = await getPasswordHash('admin');

  const seededUsers: StoredUser[] = [
    {
      id: 'usr-1',
      email: 'wassim.mehdaoui@tidycorp.co.uk',
      name: 'Wassim Mehdaoui',
      companyName: 'Tidy Corp UK',
      role: 'contractor',
      emailVerified: true,
      passwordHash: userHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-2',
      email: 'sarah.jenkins@homeowner.co.uk',
      name: 'Sarah Jenkins',
      companyName: 'Kensington Residence',
      role: 'homeowner',
      emailVerified: true,
      passwordHash: userHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-3',
      email: 'admin@tidycorp.co.uk',
      name: 'Compliance Inspector',
      companyName: 'Tidy Corp Regulatory',
      role: 'inspector',
      emailVerified: true,
      passwordHash: adminHash,
      createdAt: new Date().toISOString()
    }
  ];

  for (const su of seededUsers) {
    if (!memoryUsers.some(u => u.email.toLowerCase().trim() === su.email.toLowerCase())) {
      memoryUsers.push(su);
    }
  }
  persistLocalStore();

  const firestore = await initFirestoreDB();
  if (!firestore) return;

  try {
    const usersSnap = await firestore.collection('users').limit(1).get();
    if (usersSnap.empty) {
      for (const u of memoryUsers) {
        await firestore.collection('users').doc(u.id).set(stripUndefined(u));
      }
    }

    const projectsSnap = await firestore.collection('projects').limit(1).get();
    if (projectsSnap.empty) {
      for (const p of initialProjects) {
        await firestore.collection('projects').doc(p.id).set(stripUndefined(p));
      }
    }

    const rulesSnap = await firestore.collection('mcpRules').limit(1).get();
    if (rulesSnap.empty) {
      for (const r of defaultMCPRules) {
        await firestore.collection('mcpRules').doc(r.id).set(stripUndefined(r));
      }
    }

    const gatewaySnap = await firestore.collection('gatewayConfig').limit(1).get();
    if (gatewaySnap.empty) {
      await firestore.collection('gatewayConfig').doc('default').set(stripUndefined(defaultGatewayConfig));
    }

    const contractorsSnap = await firestore.collection('vettedContractors').limit(1).get();
    if (contractorsSnap.empty) {
      for (const c of initialVettedContractors) {
        await firestore.collection('vettedContractors').doc(c.id).set(stripUndefined(c));
      }
    }

    const txSnap = await firestore.collection('transactions').limit(1).get();
    if (txSnap.empty) {
      for (const t of initialTransactions) {
        await firestore.collection('transactions').doc(t.id).set(stripUndefined(t));
      }
    }
  } catch (err) {
    handleFirestoreRuntimeError('seedFirestoreIfEmpty', err);
  }
}

function upsertMemoryUser(user: StoredUser) {
  const normEmail = user.email.toLowerCase().trim();
  const cleanUser = stripUndefined({ ...user, email: normEmail });
  const existingIdx = memoryUsers.findIndex(
    u => u.id === cleanUser.id || u.email.toLowerCase().trim() === normEmail
  );
  if (existingIdx >= 0) {
    memoryUsers[existingIdx] = cleanUser;
  } else {
    memoryUsers.push(cleanUser);
  }
  persistLocalStore();
}

// User CRUD
export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  ensureLocalStoreLoaded();
  const normEmail = email.toLowerCase().trim();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('users').where('email', '==', normEmail).get();
      if (!snap.empty) {
        const docs = snap.docs
          .map(d => d.data() as StoredUser)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        const matched = docs[0];
        upsertMemoryUser(matched);
        return matched;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getUserByEmail', e);
  }

  const found = memoryUsers.find(u => u.email.toLowerCase().trim() === normEmail);
  return found || null;
}

export async function getUserById(id: string): Promise<User | null> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('users').doc(id).get();
      if (snap.exists) {
        const data = snap.data() as StoredUser;
        upsertMemoryUser(data);
        const { passwordHash, ...userPublic } = data;
        return userPublic as User;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getUserById', e);
  }

  const found = memoryUsers.find(u => u.id === id);
  if (!found) return null;
  const { passwordHash, ...userPublic } = found;
  return userPublic as User;
}

export async function saveUser(user: StoredUser): Promise<User> {
  ensureLocalStoreLoaded();
  const cleanUser = stripUndefined({
    ...user,
    email: user.email.toLowerCase().trim()
  });

  upsertMemoryUser(cleanUser);

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('users').doc(cleanUser.id).set(cleanUser);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveUser', e);
  }

  const { passwordHash, ...userPublic } = cleanUser;
  return userPublic as User;
}

export async function updateUserVerification(userIdOrEmail: string, emailVerified: boolean): Promise<void> {
  ensureLocalStoreLoaded();
  const targetNorm = userIdOrEmail.toLowerCase().trim();
  const user = memoryUsers.find(
    u => u.id === userIdOrEmail || u.email.toLowerCase().trim() === targetNorm
  );

  let resolvedUserId = user?.id || userIdOrEmail;

  if (user) {
    user.emailVerified = emailVerified;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    upsertMemoryUser(user);
  }

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      if (!user && targetNorm.includes('@')) {
        const snap = await firestore.collection('users').where('email', '==', targetNorm).limit(1).get();
        if (!snap.empty) {
          resolvedUserId = snap.docs[0].id;
        }
      }
      await firestore.collection('users').doc(resolvedUserId).update({
        emailVerified,
        verificationCode: '',
        verificationCodeExpiresAt: ''
      });
    }
  } catch (e) {
    handleFirestoreRuntimeError('updateUserVerification', e);
  }
}

export async function createEmailVerificationCode(email: string): Promise<{ code: string; expiresAt: string } | null> {
  const normEmail = email.toLowerCase().trim();
  const user = await getUserByEmail(normEmail);
  if (!user) return null;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  user.verificationCode = code;
  user.verificationCodeExpiresAt = expiresAt;
  user.emailVerified = false;
  upsertMemoryUser(user);

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('users').doc(user.id).update({
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
        emailVerified: false
      });
    }
  } catch (e) {
    handleFirestoreRuntimeError('createEmailVerificationCode', e);
  }

  return { code, expiresAt };
}

export async function verifyUserEmailCode(email: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const normEmail = email.toLowerCase().trim();
  const storedUser = await getUserByEmail(normEmail);
  if (!storedUser) {
    return { success: false, error: 'No account registered with this email address.' };
  }

  if (storedUser.emailVerified) {
    const { passwordHash, ...userPublic } = storedUser;
    return { success: true, user: userPublic as User };
  }

  const cleanCode = (code || '').trim();
  const validCode = storedUser.verificationCode?.trim();

  if (!cleanCode || !validCode || cleanCode !== validCode) {
    return { success: false, error: 'Invalid 6-digit verification code. Please check and try again.' };
  }

  if (storedUser.verificationCodeExpiresAt && new Date(storedUser.verificationCodeExpiresAt).getTime() < Date.now()) {
    return { success: false, error: 'Verification code has expired. Please request a new verification code.' };
  }

  await updateUserVerification(storedUser.id, true);
  const updatedUser = await getUserById(storedUser.id);
  return { success: true, user: updatedUser || undefined };
}

export async function updateUserPassword(userId: string, newPasswordPlain: string): Promise<boolean> {
  ensureLocalStoreLoaded();
  const passwordHash = await encryptAndHashPassword(newPasswordPlain);

  const user = memoryUsers.find(u => u.id === userId);
  if (user) {
    user.passwordHash = passwordHash;
    upsertMemoryUser(user);
  }

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('users').doc(userId).update({ passwordHash });
    }
  } catch (e) {
    handleFirestoreRuntimeError('updateUserPassword', e);
  }

  return true;
}

export async function createPasswordResetToken(email: string): Promise<{ token: string; otp: string; expiresAt: string } | null> {
  ensureLocalStoreLoaded();
  const normEmail = email.toLowerCase().trim();
  const user = await getUserByEmail(normEmail);
  if (!user) return null;

  const token = crypto.randomBytes(24).toString('hex');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const record: PasswordResetRecord = {
    token,
    otp,
    userId: user.id,
    email: user.email,
    expiresAt,
    used: false,
    createdAt: new Date().toISOString()
  };

  const existingIdx = memoryPasswordResets.findIndex(r => r.email.toLowerCase() === normEmail && !r.used);
  if (existingIdx >= 0) memoryPasswordResets[existingIdx] = record;
  else memoryPasswordResets.push(record);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('passwordResets').doc(token).set(stripUndefined(record));
    }
  } catch (e) {
    handleFirestoreRuntimeError('createPasswordResetToken', e);
  }

  return { token, otp, expiresAt };
}

export async function getPasswordResetRecord(tokenOrOtp: string, email?: string): Promise<PasswordResetRecord | null> {
  ensureLocalStoreLoaded();
  const key = (tokenOrOtp || '').trim();
  const normEmail = email?.toLowerCase().trim();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('passwordResets').doc(key).get();
      if (snap.exists) {
        return snap.data() as PasswordResetRecord;
      }
      if (normEmail) {
        const qSnap = await firestore
          .collection('passwordResets')
          .where('email', '==', normEmail)
          .where('used', '==', false)
          .get();
        if (!qSnap.empty) {
          const matching = qSnap.docs
            .map(d => d.data() as PasswordResetRecord)
            .find(r => r.token === key || r.otp === key);
          if (matching) return matching;
        }
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getPasswordResetRecord', e);
  }

  const found = memoryPasswordResets.find(
    r =>
      !r.used &&
      (r.token === key ||
        r.otp === key ||
        (normEmail && r.email.toLowerCase() === normEmail && (r.otp === key || r.token === key)))
  );
  return found || null;
}

export async function markPasswordResetUsed(token: string): Promise<void> {
  ensureLocalStoreLoaded();
  const rec = memoryPasswordResets.find(r => r.token === token);
  if (rec) {
    rec.used = true;
    persistLocalStore();
  }

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('passwordResets').doc(token).update({
        used: true,
        usedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    handleFirestoreRuntimeError('markPasswordResetUsed', e);
  }
}

// Projects CRUD - Scoped to authenticated user permissions
export async function getProjectsFromDB(userScope?: UserScope): Promise<RenovationProject[]> {
  ensureLocalStoreLoaded();
  if (!userScope) {
    return [];
  }

  let allProjects: RenovationProject[] = [];

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('projects').get();
      if (!snap.empty) {
        allProjects = snap.docs.map(d => d.data() as RenovationProject);
        memoryProjects = allProjects;
        persistLocalStore();
      } else {
        allProjects = memoryProjects;
      }
    } else {
      allProjects = memoryProjects;
    }
  } catch (e) {
    handleFirestoreRuntimeError('getProjectsFromDB', e);
    allProjects = memoryProjects;
  }

  if (userScope.role === 'admin' || userScope.role === 'inspector') {
    return allProjects;
  }

  const userId = userScope.id || userScope.userId || '';
  const userEmail = (userScope.email || '').toLowerCase().trim();
  const userName = (userScope.name || '').toLowerCase().trim();

  return allProjects.filter(p => {
    const isClient =
      (p.clientId && p.clientId === userId) ||
      (userEmail && p.clientEmail && p.clientEmail.toLowerCase() === userEmail) ||
      (userName && p.clientName && p.clientName.toLowerCase() === userName);

    const isContractor =
      (p.assignedContractorId && p.assignedContractorId === userId) ||
      (userName && p.assignedContractorName && p.assignedContractorName.toLowerCase() === userName);

    return isClient || isContractor;
  });
}

export async function getProjectByIdFromDB(id: string): Promise<RenovationProject | null> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('projects').doc(id).get();
      if (snap.exists) return snap.data() as RenovationProject;
    }
  } catch (e) {
    handleFirestoreRuntimeError('getProjectByIdFromDB', e);
  }
  return memoryProjects.find(p => p.id === id) || null;
}

export async function saveProjectToDB(project: RenovationProject): Promise<RenovationProject> {
  ensureLocalStoreLoaded();
  const cleanProject = stripUndefined(project);
  const idx = memoryProjects.findIndex(p => p.id === cleanProject.id);
  if (idx >= 0) memoryProjects[idx] = cleanProject;
  else memoryProjects.unshift(cleanProject);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('projects').doc(cleanProject.id).set(cleanProject);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveProjectToDB', e);
  }

  return cleanProject;
}

export async function deleteProjectFromDB(id: string): Promise<boolean> {
  ensureLocalStoreLoaded();
  memoryProjects = memoryProjects.filter(p => p.id !== id);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('projects').doc(id).delete();
    }
  } catch (e) {
    handleFirestoreRuntimeError('deleteProjectFromDB', e);
  }

  return true;
}

// Contractors CRUD
export async function getVettedContractorsFromDB(): Promise<VettedContractor[]> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('vettedContractors').get();
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as VettedContractor);
        memoryContractors = list;
        persistLocalStore();
        return list;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getVettedContractorsFromDB', e);
  }
  return memoryContractors;
}

export async function saveContractorToDB(contractor: VettedContractor): Promise<VettedContractor> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(contractor);
  const idx = memoryContractors.findIndex(c => c.id === clean.id);
  if (idx >= 0) memoryContractors[idx] = clean;
  else memoryContractors.unshift(clean);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('vettedContractors').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveContractorToDB', e);
  }

  return clean;
}

// MCP Rules CRUD
export async function getMCPRulesFromDB(): Promise<MCPRule[]> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('mcpRules').get();
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as MCPRule);
        memoryMCPRules = list;
        persistLocalStore();
        return list;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getMCPRulesFromDB', e);
  }
  return memoryMCPRules;
}

export async function saveMCPRuleToDB(rule: MCPRule): Promise<MCPRule> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(rule);
  const idx = memoryMCPRules.findIndex(r => r.id === clean.id);
  if (idx >= 0) memoryMCPRules[idx] = clean;
  else memoryMCPRules.push(clean);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('mcpRules').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveMCPRuleToDB', e);
  }

  return clean;
}

export async function deleteMCPRuleFromDB(id: string): Promise<boolean> {
  ensureLocalStoreLoaded();
  memoryMCPRules = memoryMCPRules.filter(r => r.id !== id);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('mcpRules').doc(id).delete();
    }
  } catch (e) {
    handleFirestoreRuntimeError('deleteMCPRuleFromDB', e);
  }

  return true;
}

// Gateway Config CRUD
export async function getGatewayConfigFromDB(): Promise<GatewayConfig> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('gatewayConfig').doc('default').get();
      if (snap.exists) {
        const cfg = snap.data() as GatewayConfig;
        memoryGatewayConfig = cfg;
        persistLocalStore();
        return cfg;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getGatewayConfigFromDB', e);
  }
  return memoryGatewayConfig;
}

export async function saveGatewayConfigToDB(config: GatewayConfig): Promise<GatewayConfig> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(config);
  memoryGatewayConfig = clean;
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('gatewayConfig').doc('default').set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveGatewayConfigToDB', e);
  }

  return clean;
}

// Transactions CRUD - Scoped to authenticated user permissions
export async function getTransactionsFromDB(userScope?: UserScope): Promise<PaymentTransaction[]> {
  ensureLocalStoreLoaded();
  if (!userScope) {
    return [];
  }

  let allTransactions: PaymentTransaction[] = [];

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('transactions').get();
      if (!snap.empty) {
        allTransactions = snap.docs.map(d => d.data() as PaymentTransaction);
        memoryTransactions = allTransactions;
        persistLocalStore();
      } else {
        allTransactions = memoryTransactions;
      }
    } else {
      allTransactions = memoryTransactions;
    }
  } catch (e) {
    handleFirestoreRuntimeError('getTransactionsFromDB', e);
    allTransactions = memoryTransactions;
  }

  if (userScope.role === 'admin' || userScope.role === 'inspector') {
    return allTransactions;
  }

  const userProjects = await getProjectsFromDB(userScope);
  const userProjectIds = new Set(userProjects.map(p => p.id));
  const userName = (userScope.name || '').toLowerCase().trim();

  return allTransactions.filter(t => {
    return userProjectIds.has(t.projectId) || (userName && t.clientName && t.clientName.toLowerCase() === userName);
  });
}

export async function saveTransactionToDB(tx: PaymentTransaction): Promise<PaymentTransaction> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(tx);
  memoryTransactions.unshift(clean);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('transactions').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveTransactionToDB', e);
  }

  return clean;
}

// Invitation Logs CRUD
export async function getInvitationLogsFromDB(): Promise<ContractorInvitationLog[]> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('invitationLogs').get();
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as ContractorInvitationLog);
        memoryLogs = list;
        persistLocalStore();
        return list;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getInvitationLogsFromDB', e);
  }
  return memoryLogs;
}

export async function saveInvitationLogToDB(log: ContractorInvitationLog): Promise<ContractorInvitationLog> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(log);
  memoryLogs.unshift(clean);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('invitationLogs').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveInvitationLogToDB', e);
  }

  return clean;
}

// Cookie Consent Audit CRUD
export async function saveCookieConsentToDB(audit: any): Promise<any> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(audit);
  memoryCookieConsents.unshift(clean);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('cookieConsents').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveCookieConsentToDB', e);
  }

  return clean;
}

export async function getCookieConsentsFromDB(): Promise<any[]> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('cookieConsents').get();
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data());
        memoryCookieConsents = list;
        persistLocalStore();
        return list;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getCookieConsentsFromDB', e);
  }
  return memoryCookieConsents;
}

// --- AIRWALLEX CHECKOUT SESSIONS CRUD ---
export async function saveAirwallexSessionToDB(session: AirwallexCheckoutSession): Promise<AirwallexCheckoutSession> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(session);
  const existingIdx = memoryAirwallexSessions.findIndex(s => s.id === clean.id);
  if (existingIdx >= 0) {
    memoryAirwallexSessions[existingIdx] = clean;
  } else {
    memoryAirwallexSessions.unshift(clean);
  }
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('airwallexCheckoutSessions').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveAirwallexSessionToDB', e);
  }

  return clean;
}

export async function getAirwallexSessionFromDB(sessionId: string): Promise<AirwallexCheckoutSession | null> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('airwallexCheckoutSessions').doc(sessionId).get();
      if (snap.exists) {
        const session = snap.data() as AirwallexCheckoutSession;
        const idx = memoryAirwallexSessions.findIndex(s => s.id === sessionId);
        if (idx >= 0) memoryAirwallexSessions[idx] = session;
        else memoryAirwallexSessions.unshift(session);
        persistLocalStore();
        return session;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getAirwallexSessionFromDB', e);
  }

  const found = memoryAirwallexSessions.find(s => s.id === sessionId);
  return found || null;
}

export async function updateAirwallexSessionInDB(
  sessionId: string,
  updates: Partial<AirwallexCheckoutSession>
): Promise<AirwallexCheckoutSession | null> {
  const current = await getAirwallexSessionFromDB(sessionId);
  if (!current) return null;

  const merged: AirwallexCheckoutSession = {
    ...current,
    ...updates
  };

  return await saveAirwallexSessionToDB(merged);
}

// --- STRIPE CHECKOUT SESSIONS CRUD ---
export async function saveStripeSessionRecordToDB(session: StripeCheckoutSession): Promise<StripeCheckoutSession> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(session);
  const existingIdx = memoryStripeSessions.findIndex(s => s.id === clean.id);
  if (existingIdx >= 0) {
    memoryStripeSessions[existingIdx] = clean;
  } else {
    memoryStripeSessions.unshift(clean);
  }
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('stripeCheckoutSessions').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('saveStripeSessionRecordToDB', e);
  }

  return clean;
}

export async function getStripeSessionRecordFromDB(sessionId: string): Promise<StripeCheckoutSession | null> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('stripeCheckoutSessions').doc(sessionId).get();
      if (snap.exists) {
        const session = snap.data() as StripeCheckoutSession;
        const idx = memoryStripeSessions.findIndex(s => s.id === sessionId);
        if (idx >= 0) memoryStripeSessions[idx] = session;
        else memoryStripeSessions.unshift(session);
        persistLocalStore();
        return session;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getStripeSessionRecordFromDB', e);
  }

  const found = memoryStripeSessions.find(s => s.id === sessionId);
  return found || null;
}

// --- PARTNERSTACK AFFILIATE & CHANNEL CRUD ---
export async function getPartnerStackConfigFromDB(): Promise<PartnerStackConfig> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('partnerStackConfig').doc('default').get();
      if (snap.exists) {
        const cfg = snap.data() as PartnerStackConfig;
        memoryPartnerStackConfig = cfg;
        persistLocalStore();
        return cfg;
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getPartnerStackConfigFromDB', e);
  }
  return memoryPartnerStackConfig;
}

export async function savePartnerStackConfigToDB(config: PartnerStackConfig): Promise<PartnerStackConfig> {
  ensureLocalStoreLoaded();
  const updated = stripUndefined({
    ...config,
    updatedAt: new Date().toISOString()
  });
  memoryPartnerStackConfig = updated;
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('partnerStackConfig').doc('default').set(updated);
    }
  } catch (e) {
    handleFirestoreRuntimeError('savePartnerStackConfigToDB', e);
  }
  return updated;
}

export async function getPartnerStackPartnersFromDB(): Promise<PartnerStackPartner[]> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('partnerStackPartners').get();
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as PartnerStackPartner);
        memoryPartnerStackPartners = list;
        persistLocalStore();
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getPartnerStackPartnersFromDB', e);
  }
  return [...memoryPartnerStackPartners].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPartnerByKeyOrCodeFromDB(keyOrCode: string): Promise<PartnerStackPartner | null> {
  if (!keyOrCode) return null;
  const normalized = keyOrCode.trim().toLowerCase();
  const partners = await getPartnerStackPartnersFromDB();
  return (
    partners.find(
      p =>
        p.partnerKey.toLowerCase() === normalized ||
        p.referralCode.toLowerCase() === normalized ||
        p.id.toLowerCase() === normalized
    ) || null
  );
}

export async function getPartnerByEmailFromDB(email: string): Promise<PartnerStackPartner | null> {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const partners = await getPartnerStackPartnersFromDB();
  return partners.find(p => p.email.toLowerCase() === normalized) || null;
}

export async function savePartnerStackPartnerToDB(partner: PartnerStackPartner): Promise<PartnerStackPartner> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(partner);
  const idx = memoryPartnerStackPartners.findIndex(p => p.id === clean.id);
  if (idx >= 0) memoryPartnerStackPartners[idx] = clean;
  else memoryPartnerStackPartners.unshift(clean);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('partnerStackPartners').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('savePartnerStackPartnerToDB', e);
  }

  return clean;
}

export async function getPartnerStackEventsFromDB(): Promise<PartnerStackEvent[]> {
  ensureLocalStoreLoaded();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await firestore.collection('partnerStackEvents').get();
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as PartnerStackEvent);
        memoryPartnerStackEvents = list;
        persistLocalStore();
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    }
  } catch (e) {
    handleFirestoreRuntimeError('getPartnerStackEventsFromDB', e);
  }
  return [...memoryPartnerStackEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function savePartnerStackEventToDB(event: PartnerStackEvent): Promise<PartnerStackEvent> {
  ensureLocalStoreLoaded();
  const clean = stripUndefined(event);
  const idx = memoryPartnerStackEvents.findIndex(ev => ev.id === clean.id);
  if (idx >= 0) memoryPartnerStackEvents[idx] = clean;
  else memoryPartnerStackEvents.unshift(clean);
  persistLocalStore();

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await firestore.collection('partnerStackEvents').doc(clean.id).set(clean);
    }
  } catch (e) {
    handleFirestoreRuntimeError('savePartnerStackEventToDB', e);
  }

  return clean;
}
