import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setLogLevel,
  Firestore
} from 'firebase/firestore';

try {
  setLogLevel('silent');
} catch (e) {
  // ignore
}
import { getAuth, signInAnonymously } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { initialProjects, defaultMCPRules, defaultGatewayConfig, initialTransactions, initialVettedContractors } from '../data/mockData.js';
import { User, RenovationProject, MCPRule, GatewayConfig, PaymentTransaction, VettedContractor, ContractorInvitationLog, AirwallexCheckoutSession } from '../types.js';

export interface StoredUser extends User {
  passwordHash: string;
}

let db: Firestore | null = null;
let defaultUserPasswordHashCache: string | null = null;
let adminPasswordHashCache: string | null = null;

export interface UserScope {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}

const shouldSeedMockData = process.env.SEED_MOCK_DATA === 'true';

// In-memory fallback caches (Empty by default for clean user isolation unless SEED_MOCK_DATA=true)
let memoryUsers: StoredUser[] = [];
let memoryProjects: RenovationProject[] = shouldSeedMockData ? [...initialProjects] : [];
let memoryMCPRules: MCPRule[] = [...defaultMCPRules];
let memoryGatewayConfig: GatewayConfig = { ...defaultGatewayConfig };
let memoryTransactions: PaymentTransaction[] = shouldSeedMockData ? [...initialTransactions] : [];
let memoryContractors: VettedContractor[] = [...initialVettedContractors];
let memoryLogs: ContractorInvitationLog[] = [];

async function getPasswordHash(passType: 'admin' | 'user'): Promise<string> {
  if (passType === 'admin') {
    if (!adminPasswordHashCache) {
      const adminPass = process.env.ADMIN_INITIAL_PASSWORD || (process.env.NODE_ENV === 'production' ? crypto.randomBytes(16).toString('hex') : 'password123');
      adminPasswordHashCache = await bcrypt.hash(adminPass, 10);
    }
    return adminPasswordHashCache;
  } else {
    if (!defaultUserPasswordHashCache) {
      const userPass = process.env.DEMO_INITIAL_PASSWORD || 'password123';
      defaultUserPasswordHashCache = await bcrypt.hash(userPass, 10);
    }
    return defaultUserPasswordHashCache;
  }
}

export async function initFirestoreDB(): Promise<Firestore | null> {
  if (db) return db;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      db = firebaseConfig.firestoreDatabaseId
        ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
        : getFirestore(app);

      try {
        const auth = getAuth(app);
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (e) {
        // Auth anonymous fallback
      }

      return db;
    }
  } catch (err) {
    console.error('Failed to initialize Firestore on server:', err);
  }
  return null;
}

export function getFirestoreDB(): Firestore | null {
  return db;
}

// Seed initial dataset into Firestore if empty - ONLY when explicitly enabled via SEED_MOCK_DATA=true
export async function seedFirestoreIfEmpty() {
  if (process.env.SEED_MOCK_DATA !== 'true') {
    console.log('[Firestore] Mock data seeding disabled (SEED_MOCK_DATA != true). Preserving clean database state.');
    return;
  }

  const userHash = await getPasswordHash('user');
  const adminHash = await getPasswordHash('admin');

  memoryUsers = [
    {
      id: 'usr-1',
      email: 'wassim.mehdaoui@tidycorp.co.uk',
      name: 'Wassim Mehdaoui',
      companyName: 'Tidy Corp UK',
      role: 'contractor',
      passwordHash: userHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-2',
      email: 'sarah.jenkins@homeowner.co.uk',
      name: 'Sarah Jenkins',
      companyName: 'Kensington Residence',
      role: 'homeowner',
      passwordHash: userHash,
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-3',
      email: 'admin@tidycorp.co.uk',
      name: 'Compliance Inspector',
      companyName: 'Tidy Corp Regulatory',
      role: 'inspector',
      passwordHash: adminHash,
      createdAt: new Date().toISOString()
    }
  ];

  const firestore = await initFirestoreDB();
  if (!firestore) return;

  try {
    const usersSnap = await getDocs(collection(firestore, 'users'));
    if (usersSnap.empty) {
      for (const u of memoryUsers) {
        await setDoc(doc(firestore, 'users', u.id), u);
      }
    }

    const projectsSnap = await getDocs(collection(firestore, 'projects'));
    if (projectsSnap.empty) {
      for (const p of initialProjects) {
        await setDoc(doc(firestore, 'projects', p.id), p);
      }
    }

    const rulesSnap = await getDocs(collection(firestore, 'mcpRules'));
    if (rulesSnap.empty) {
      for (const r of defaultMCPRules) {
        await setDoc(doc(firestore, 'mcpRules', r.id), r);
      }
    }

    const gatewaySnap = await getDocs(collection(firestore, 'gatewayConfig'));
    if (gatewaySnap.empty) {
      await setDoc(doc(firestore, 'gatewayConfig', 'default'), defaultGatewayConfig);
    }

    const contractorsSnap = await getDocs(collection(firestore, 'vettedContractors'));
    if (contractorsSnap.empty) {
      for (const c of initialVettedContractors) {
        await setDoc(doc(firestore, 'vettedContractors', c.id), c);
      }
    }

    const txSnap = await getDocs(collection(firestore, 'transactions'));
    if (txSnap.empty) {
      for (const t of initialTransactions) {
        await setDoc(doc(firestore, 'transactions', t.id), t);
      }
    }
  } catch (err) {
    console.log('Firestore seeding fallback:', (err as any)?.message || err);
  }
}

// User CRUD
export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const normEmail = email.toLowerCase().trim();
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const q = query(collection(firestore, 'users'), where('email', '==', normEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as StoredUser;
      }
    }
  } catch (e) {
    console.log('getUserByEmail Firestore fallback to memory');
  }

  const found = memoryUsers.find(u => u.email.toLowerCase() === normEmail);
  return found || null;
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDoc(doc(firestore, 'users', id));
      if (snap.exists()) {
        const data = snap.data() as StoredUser;
        const { passwordHash, ...userPublic } = data;
        return userPublic as User;
      }
    }
  } catch (e) {
    console.log('getUserById Firestore fallback to memory');
  }

  const found = memoryUsers.find(u => u.id === id);
  if (!found) return null;
  const { passwordHash, ...userPublic } = found;
  return userPublic as User;
}

export async function saveUser(user: StoredUser): Promise<User> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'users', user.id), user);
    }
  } catch (e) {
    console.log('saveUser Firestore fallback to memory');
  }

  const existingIdx = memoryUsers.findIndex(u => u.id === user.id);
  if (existingIdx >= 0) memoryUsers[existingIdx] = user;
  else memoryUsers.push(user);

  const { passwordHash, ...userPublic } = user;
  return userPublic as User;
}

// Projects CRUD - Scoped to authenticated user permissions
export async function getProjectsFromDB(userScope?: UserScope): Promise<RenovationProject[]> {
  if (!userScope) {
    return [];
  }

  let allProjects: RenovationProject[] = [];

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDocs(collection(firestore, 'projects'));
      if (!snap.empty) {
        allProjects = snap.docs.map(d => d.data() as RenovationProject);
        memoryProjects = allProjects;
      } else {
        allProjects = memoryProjects;
      }
    } else {
      allProjects = memoryProjects;
    }
  } catch (e) {
    console.log('getProjectsFromDB Firestore fallback to memory');
    allProjects = memoryProjects;
  }

  // Admins and Inspectors can inspect all projects across the platform
  if (userScope.role === 'admin' || userScope.role === 'inspector') {
    return allProjects;
  }

  const userId = userScope.id || userScope.userId || '';
  const userEmail = (userScope.email || '').toLowerCase().trim();
  const userName = (userScope.name || '').toLowerCase().trim();

  return allProjects.filter(p => {
    const isClient = (p.clientId && p.clientId === userId) ||
      (userEmail && p.clientEmail && p.clientEmail.toLowerCase() === userEmail) ||
      (userName && p.clientName && p.clientName.toLowerCase() === userName);

    const isContractor = (p.assignedContractorId && p.assignedContractorId === userId) ||
      (userName && p.assignedContractorName && p.assignedContractorName.toLowerCase() === userName);

    return isClient || isContractor;
  });
}

export async function getProjectByIdFromDB(id: string): Promise<RenovationProject | null> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDoc(doc(firestore, 'projects', id));
      if (snap.exists()) return snap.data() as RenovationProject;
    }
  } catch (e) {
    console.log('getProjectByIdFromDB Firestore fallback to memory');
  }
  return memoryProjects.find(p => p.id === id) || null;
}

export async function saveProjectToDB(project: RenovationProject): Promise<RenovationProject> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'projects', project.id), project);
    }
  } catch (e) {
    console.log('saveProjectToDB Firestore fallback to memory');
  }

  const idx = memoryProjects.findIndex(p => p.id === project.id);
  if (idx >= 0) memoryProjects[idx] = project;
  else memoryProjects.unshift(project);

  return project;
}

export async function deleteProjectFromDB(id: string): Promise<boolean> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await deleteDoc(doc(firestore, 'projects', id));
    }
  } catch (e) {
    console.log('deleteProjectFromDB Firestore fallback to memory');
  }

  memoryProjects = memoryProjects.filter(p => p.id !== id);
  return true;
}

// Contractors CRUD
export async function getVettedContractorsFromDB(): Promise<VettedContractor[]> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDocs(collection(firestore, 'vettedContractors'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as VettedContractor);
        memoryContractors = list;
        return list;
      }
    }
  } catch (e) {
    console.log('getVettedContractorsFromDB Firestore fallback to memory');
  }
  return memoryContractors;
}

export async function saveContractorToDB(contractor: VettedContractor): Promise<VettedContractor> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'vettedContractors', contractor.id), contractor);
    }
  } catch (e) {
    console.log('saveContractorToDB Firestore fallback to memory');
  }

  const idx = memoryContractors.findIndex(c => c.id === contractor.id);
  if (idx >= 0) memoryContractors[idx] = contractor;
  else memoryContractors.unshift(contractor);

  return contractor;
}

// MCP Rules CRUD
export async function getMCPRulesFromDB(): Promise<MCPRule[]> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDocs(collection(firestore, 'mcpRules'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as MCPRule);
        memoryMCPRules = list;
        return list;
      }
    }
  } catch (e) {
    console.log('getMCPRulesFromDB Firestore fallback to memory');
  }
  return memoryMCPRules;
}

export async function saveMCPRuleToDB(rule: MCPRule): Promise<MCPRule> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'mcpRules', rule.id), rule);
    }
  } catch (e) {
    console.log('saveMCPRuleToDB Firestore fallback to memory');
  }

  const idx = memoryMCPRules.findIndex(r => r.id === rule.id);
  if (idx >= 0) memoryMCPRules[idx] = rule;
  else memoryMCPRules.push(rule);

  return rule;
}

export async function deleteMCPRuleFromDB(id: string): Promise<boolean> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await deleteDoc(doc(firestore, 'mcpRules', id));
    }
  } catch (e) {
    console.log('deleteMCPRuleFromDB Firestore fallback to memory');
  }

  memoryMCPRules = memoryMCPRules.filter(r => r.id !== id);
  return true;
}

// Gateway Config CRUD
export async function getGatewayConfigFromDB(): Promise<GatewayConfig> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDoc(doc(firestore, 'gatewayConfig', 'default'));
      if (snap.exists()) {
        const cfg = snap.data() as GatewayConfig;
        memoryGatewayConfig = cfg;
        return cfg;
      }
    }
  } catch (e) {
    console.log('getGatewayConfigFromDB Firestore fallback to memory');
  }
  return memoryGatewayConfig;
}

export async function saveGatewayConfigToDB(config: GatewayConfig): Promise<GatewayConfig> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'gatewayConfig', 'default'), config);
    }
  } catch (e) {
    console.log('saveGatewayConfigToDB Firestore fallback to memory');
  }

  memoryGatewayConfig = config;
  return config;
}

// Transactions CRUD - Scoped to authenticated user permissions
export async function getTransactionsFromDB(userScope?: UserScope): Promise<PaymentTransaction[]> {
  if (!userScope) {
    return [];
  }

  let allTransactions: PaymentTransaction[] = [];

  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDocs(collection(firestore, 'transactions'));
      if (!snap.empty) {
        allTransactions = snap.docs.map(d => d.data() as PaymentTransaction);
        memoryTransactions = allTransactions;
      } else {
        allTransactions = memoryTransactions;
      }
    } else {
      allTransactions = memoryTransactions;
    }
  } catch (e) {
    console.log('getTransactionsFromDB Firestore fallback to memory');
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
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'transactions', tx.id), tx);
    }
  } catch (e) {
    console.log('saveTransactionToDB Firestore fallback to memory');
  }

  memoryTransactions.unshift(tx);
  return tx;
}

// Invitation Logs CRUD
export async function getInvitationLogsFromDB(): Promise<ContractorInvitationLog[]> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDocs(collection(firestore, 'invitationLogs'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as ContractorInvitationLog);
        memoryLogs = list;
        return list;
      }
    }
  } catch (e) {
    console.log('getInvitationLogsFromDB Firestore fallback to memory');
  }
  return memoryLogs;
}

export async function saveInvitationLogToDB(log: ContractorInvitationLog): Promise<ContractorInvitationLog> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'invitationLogs', log.id), log);
    }
  } catch (e) {
    console.log('saveInvitationLogToDB Firestore fallback to memory');
  }

  memoryLogs.unshift(log);
  return log;
}

// Cookie Consent Audit CRUD
let memoryCookieConsents: any[] = [];

export async function saveCookieConsentToDB(audit: any): Promise<any> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'cookieConsents', audit.id), audit);
    }
  } catch (e) {
    console.log('saveCookieConsentToDB Firestore fallback to memory');
  }

  memoryCookieConsents.unshift(audit);
  return audit;
}

export async function getCookieConsentsFromDB(): Promise<any[]> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDocs(collection(firestore, 'cookieConsents'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data());
        memoryCookieConsents = list;
        return list;
      }
    }
  } catch (e) {
    console.log('getCookieConsentsFromDB Firestore fallback to memory');
  }
  return memoryCookieConsents;
}

// --- AIRWALLEX CHECKOUT SESSIONS CRUD ---
let memoryAirwallexSessions: AirwallexCheckoutSession[] = [];

export async function saveAirwallexSessionToDB(session: AirwallexCheckoutSession): Promise<AirwallexCheckoutSession> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'airwallexCheckoutSessions', session.id), session);
    }
  } catch (e) {
    console.log('saveAirwallexSessionToDB Firestore fallback to memory');
  }

  const existingIdx = memoryAirwallexSessions.findIndex(s => s.id === session.id);
  if (existingIdx >= 0) {
    memoryAirwallexSessions[existingIdx] = session;
  } else {
    memoryAirwallexSessions.unshift(session);
  }
  return session;
}

export async function getAirwallexSessionFromDB(sessionId: string): Promise<AirwallexCheckoutSession | null> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDoc(doc(firestore, 'airwallexCheckoutSessions', sessionId));
      if (snap.exists()) {
        const session = snap.data() as AirwallexCheckoutSession;
        const idx = memoryAirwallexSessions.findIndex(s => s.id === sessionId);
        if (idx >= 0) memoryAirwallexSessions[idx] = session;
        else memoryAirwallexSessions.unshift(session);
        return session;
      }
    }
  } catch (e) {
    console.log('getAirwallexSessionFromDB Firestore fallback to memory');
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
