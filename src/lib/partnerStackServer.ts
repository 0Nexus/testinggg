import crypto from 'crypto';
import { fetchSecretFromGCP } from './airwallexServer.js';
import {
  getPartnerStackConfigFromDB,
  savePartnerStackConfigToDB,
  getPartnerByKeyOrCodeFromDB,
  getPartnerByEmailFromDB,
  savePartnerStackPartnerToDB,
  savePartnerStackEventToDB,
  getUserByEmail
} from './firestoreServer.js';
import {
  PartnerStackConfig,
  PartnerStackEvent,
  PartnerStackPartner,
  PartnerStackAttribution
} from '../types.js';

const PARTNERSTACK_API_BASE = 'https://api.partnerstack.com/api/v2';

export interface ResolvedPartnerStackCredentials {
  config: PartnerStackConfig;
  publicKey: string;
  secretKey: string;
  companyKey: string;
  webhookSecret: string;
  isLiveConfigured: boolean;
  source: 'env' | 'secret_manager' | 'firestore' | 'default';
}

/**
 * Resolves PartnerStack credentials from:
 * 1. Environment Variables (PARTNERSTACK_PUBLIC_KEY, PARTNERSTACK_SECRET_KEY, etc.)
 * 2. Google Cloud Secret Manager (if configured)
 * 3. Firestore partnerStackConfig/default
 */
export async function getResolvedPartnerStackConfig(): Promise<ResolvedPartnerStackCredentials> {
  const dbConfig = await getPartnerStackConfigFromDB();

  let publicKey = process.env.PARTNERSTACK_PUBLIC_KEY || dbConfig.publicKey || '';
  let secretKey = process.env.PARTNERSTACK_SECRET_KEY || '';
  let companyKey = process.env.PARTNERSTACK_COMPANY_KEY || dbConfig.companyKey || '';
  let webhookSecret = process.env.PARTNERSTACK_WEBHOOK_SECRET || '';
  let source: 'env' | 'secret_manager' | 'firestore' | 'default' = 'default';

  if (process.env.PARTNERSTACK_PUBLIC_KEY && process.env.PARTNERSTACK_SECRET_KEY) {
    source = 'env';
  } else if (dbConfig.publicKey) {
    source = 'firestore';
  }

  // Try Google Cloud Secret Manager if secret key or public key is missing
  if (!secretKey) {
    try {
      const secRes = await fetchSecretFromGCP('PARTNERSTACK_SECRET_KEY', { optional: true });
      if (secRes.value) {
        secretKey = secRes.value;
        source = 'secret_manager';
      }
    } catch {
      // Optional secret
    }
  }

  if (!publicKey) {
    try {
      const pubRes = await fetchSecretFromGCP('PARTNERSTACK_PUBLIC_KEY', { optional: true });
      if (pubRes.value) {
        publicKey = pubRes.value;
      }
    } catch {
      // Optional secret
    }
  }

  if (!webhookSecret) {
    try {
      const whRes = await fetchSecretFromGCP('PARTNERSTACK_WEBHOOK_SECRET', { optional: true });
      if (whRes.value) {
        webhookSecret = whRes.value;
      }
    } catch {
      // Optional secret
    }
  }

  const isLiveConfigured = Boolean(publicKey && secretKey);

  return {
    config: {
      ...dbConfig,
      publicKey,
      companyKey,
      partnerPortalUrl: process.env.PARTNERSTACK_PORTAL_URL || dbConfig.partnerPortalUrl || 'https://dash.partnerstack.com',
      isLiveConfigured,
      hasSecretKey: Boolean(secretKey),
      hasWebhookSecret: Boolean(webhookSecret),
      source
    },
    publicKey,
    secretKey,
    companyKey,
    webhookSecret,
    isLiveConfigured,
    source
  };
}

/**
 * Returns safe public PartnerStack config (NEVER returns secretKey or webhookSecret)
 */
export async function getPublicPartnerStackConfig(): Promise<PartnerStackConfig> {
  const resolved = await getResolvedPartnerStackConfig();
  return resolved.config;
}

/**
 * Updates PartnerStack configuration settings in Firestore
 */
export async function updatePartnerStackConfig(partial: Partial<PartnerStackConfig>): Promise<PartnerStackConfig> {
  const current = await getPartnerStackConfigFromDB();
  const next: PartnerStackConfig = {
    ...current,
    enabled: partial.enabled !== undefined ? Boolean(partial.enabled) : current.enabled,
    publicKey: partial.publicKey !== undefined ? String(partial.publicKey).trim() : current.publicKey,
    companyKey: partial.companyKey !== undefined ? String(partial.companyKey).trim() : current.companyKey,
    partnerPortalUrl: partial.partnerPortalUrl !== undefined ? String(partial.partnerPortalUrl).trim() : current.partnerPortalUrl,
    defaultCommissionPercent:
      partial.defaultCommissionPercent !== undefined
        ? Math.min(50, Math.max(1, Number(partial.defaultCommissionPercent) || 20))
        : current.defaultCommissionPercent,
    contractorBountyGBP:
      partial.contractorBountyGBP !== undefined
        ? Math.max(0, Number(partial.contractorBountyGBP) || 0)
        : current.contractorBountyGBP,
    trackEscrowFees: partial.trackEscrowFees !== undefined ? Boolean(partial.trackEscrowFees) : current.trackEscrowFees,
    autoApprovePartners:
      partial.autoApprovePartners !== undefined ? Boolean(partial.autoApprovePartners) : current.autoApprovePartners
  };

  await savePartnerStackConfigToDB(next);
  return await getPublicPartnerStackConfig();
}

function getPartnerStackAuthHeader(publicKey: string, secretKey: string): string {
  return `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`;
}

/**
 * Records a referral link click and increments partner click counter if matched
 */
export async function recordPartnerStackClick(params: {
  partnerKey?: string;
  pscd?: string;
  referralCode?: string;
  landingUrl?: string;
}) {
  const keyOrCode = params.partnerKey || params.pscd || params.referralCode || '';
  if (!keyOrCode) return null;

  const partner = await getPartnerByKeyOrCodeFromDB(keyOrCode);
  if (partner) {
    partner.clicksCount = (partner.clicksCount || 0) + 1;
    await savePartnerStackPartnerToDB(partner);
  }

  const event: PartnerStackEvent = {
    id: `ps_ev_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    eventType: 'referral.click',
    partnerKey: partner?.partnerKey || params.partnerKey || keyOrCode,
    referralCode: partner?.referralCode || params.pscd || params.referralCode,
    currency: 'GBP',
    syncStatus: 'queued_sandbox',
    metadata: { landingUrl: params.landingUrl || '/' },
    createdAt: new Date().toISOString()
  };

  await savePartnerStackEventToDB(event);
  return { partner, event };
}

/**
 * Registers/syncs a referred customer signup with PartnerStack v2 Customers API
 * POST https://api.partnerstack.com/api/v2/customers
 */
export async function syncPartnerStackCustomerSignup(params: {
  userId: string;
  email: string;
  name: string;
  role?: string;
  attribution?: PartnerStackAttribution;
}): Promise<PartnerStackEvent | null> {
  const resolved = await getResolvedPartnerStackConfig();
  if (!resolved.config.enabled) return null;

  const partnerLookupKey =
    params.attribution?.partnerKey ||
    params.attribution?.pscd ||
    params.attribution?.referralCode ||
    '';

  if (!partnerLookupKey) {
    return null;
  }

  const matchedPartner = await getPartnerByKeyOrCodeFromDB(partnerLookupKey);
  if (matchedPartner) {
    matchedPartner.signupsCount = (matchedPartner.signupsCount || 0) + 1;
    await savePartnerStackPartnerToDB(matchedPartner);
  }

  let syncStatus: 'live_synced' | 'queued_sandbox' | 'failed' = 'queued_sandbox';
  let partnerStackResponseId: string | undefined;
  let errorMessage: string | undefined;

  if (resolved.isLiveConfigured) {
    try {
      const response = await fetch(`${PARTNERSTACK_API_BASE}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getPartnerStackAuthHeader(resolved.publicKey, resolved.secretKey)
        },
        body: JSON.stringify({
          customer_key: params.userId || params.email,
          email: params.email,
          name: params.name,
          partner_key: matchedPartner?.partnerKey || partnerLookupKey,
          source_key: params.attribution?.pscd || params.attribution?.referralCode || undefined,
          group: params.role || 'homeowner'
        })
      });

      const bodyText = await response.text();
      let parsed: any = {};
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        // non-JSON
      }

      if (response.ok) {
        syncStatus = 'live_synced';
        partnerStackResponseId = parsed?.data?.key || parsed?.key || `ps_cust_${Date.now()}`;
      } else {
        syncStatus = 'failed';
        errorMessage = `PartnerStack API ${response.status}: ${parsed?.message || bodyText.slice(0, 200)}`;
      }
    } catch (err: any) {
      syncStatus = 'failed';
      errorMessage = err?.message || 'Network error calling PartnerStack Customers API';
    }
  }

  const event: PartnerStackEvent = {
    id: `ps_ev_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    eventType: 'customer.signup',
    customerEmail: params.email,
    customerName: params.name,
    partnerKey: matchedPartner?.partnerKey || partnerLookupKey,
    referralCode: matchedPartner?.referralCode || params.attribution?.pscd || params.attribution?.referralCode,
    currency: 'GBP',
    syncStatus,
    partnerStackResponseId,
    errorMessage,
    metadata: { role: params.role || 'homeowner' },
    createdAt: new Date().toISOString()
  };

  await savePartnerStackEventToDB(event);
  return event;
}

/**
 * Syncs a revenue/subscription/escrow transaction to PartnerStack v2 Transactions API
 * POST https://api.partnerstack.com/api/v2/transactions
 */
export async function syncPartnerStackTransaction(params: {
  customerEmail: string;
  customerName?: string;
  customerId?: string;
  amountGBP: number;
  currency?: string;
  transactionKey: string;
  productKey: string;
  category: 'subscription' | 'escrow_milestone';
  attribution?: PartnerStackAttribution;
}): Promise<PartnerStackEvent | null> {
  const resolved = await getResolvedPartnerStackConfig();
  if (!resolved.config.enabled) return null;
  if (params.category === 'escrow_milestone' && !resolved.config.trackEscrowFees) return null;

  const amount = Number(params.amountGBP) || 0;
  if (amount <= 0) return null;

  let attribution = params.attribution;
  let customerId = params.customerId;
  if (!attribution && params.customerEmail) {
    const user = await getUserByEmail(params.customerEmail);
    if (user) {
      customerId = customerId || user.id;
      attribution = user.partnerStackAttribution;
    }
  }

  const partnerLookupKey =
    attribution?.partnerKey || attribution?.pscd || attribution?.referralCode || '';
  if (!partnerLookupKey) {
    return null;
  }

  const matchedPartner = await getPartnerByKeyOrCodeFromDB(partnerLookupKey);
  const commissionRate = (resolved.config.defaultCommissionPercent || 20) / 100;
  const commissionGBP = Number((amount * commissionRate).toFixed(2));

  if (matchedPartner) {
    matchedPartner.paidConversionsCount = (matchedPartner.paidConversionsCount || 0) + 1;
    matchedPartner.totalRevenueReferredGBP = Number(
      ((matchedPartner.totalRevenueReferredGBP || 0) + amount).toFixed(2)
    );
    matchedPartner.totalCommissionsEarnedGBP = Number(
      ((matchedPartner.totalCommissionsEarnedGBP || 0) + commissionGBP).toFixed(2)
    );
    await savePartnerStackPartnerToDB(matchedPartner);
  }

  let syncStatus: 'live_synced' | 'queued_sandbox' | 'failed' = 'queued_sandbox';
  let partnerStackResponseId: string | undefined;
  let errorMessage: string | undefined;

  if (resolved.isLiveConfigured) {
    try {
      const response = await fetch(`${PARTNERSTACK_API_BASE}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getPartnerStackAuthHeader(resolved.publicKey, resolved.secretKey)
        },
        body: JSON.stringify({
          customer_key: customerId || params.customerEmail,
          transaction_key: params.transactionKey,
          amount: Math.round(amount * 100), // PartnerStack expects amount in minor currency units (pence/cents)
          currency: (params.currency || 'GBP').toUpperCase(),
          product_key: params.productKey,
          category: params.category
        })
      });

      const bodyText = await response.text();
      let parsed: any = {};
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        // non-JSON
      }

      if (response.ok) {
        syncStatus = 'live_synced';
        partnerStackResponseId = parsed?.data?.key || parsed?.key || params.transactionKey;
      } else {
        syncStatus = 'failed';
        errorMessage = `PartnerStack API ${response.status}: ${parsed?.message || bodyText.slice(0, 200)}`;
      }
    } catch (err: any) {
      syncStatus = 'failed';
      errorMessage = err?.message || 'Network error calling PartnerStack Transactions API';
    }
  }

  const event: PartnerStackEvent = {
    id: `ps_ev_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    eventType: params.category === 'subscription' ? 'transaction.subscription' : 'transaction.escrow_milestone',
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    partnerKey: matchedPartner?.partnerKey || partnerLookupKey,
    referralCode: matchedPartner?.referralCode || attribution?.pscd || attribution?.referralCode,
    amountGBP: amount,
    commissionGBP,
    currency: (params.currency || 'GBP').toUpperCase(),
    transactionKey: params.transactionKey,
    productKey: params.productKey,
    syncStatus,
    partnerStackResponseId,
    errorMessage,
    createdAt: new Date().toISOString()
  };

  await savePartnerStackEventToDB(event);
  return event;
}

/**
 * Registers a PartnerStack partner application (trade guild, property agency, broker, or creator)
 */
export async function applyAsPartnerStackPartner(params: {
  userId?: string;
  name: string;
  email: string;
  companyName: string;
  partnerType: 'trade_guild' | 'property_agency' | 'mortgage_broker' | 'affiliate_creator';
  website?: string;
  appUrl: string;
}): Promise<{ partner: PartnerStackPartner; event: PartnerStackEvent }> {
  const existing = await getPartnerByEmailFromDB(params.email);
  if (existing) {
    return {
      partner: existing,
      event: {
        id: `ps_ev_${Date.now().toString(36)}`,
        eventType: 'partner.application',
        customerEmail: existing.email,
        customerName: existing.name,
        partnerKey: existing.partnerKey,
        referralCode: existing.referralCode,
        currency: 'GBP',
        syncStatus: existing.partnerStackPartnershipId ? 'live_synced' : 'queued_sandbox',
        createdAt: new Date().toISOString()
      }
    };
  }

  const resolved = await getResolvedPartnerStackConfig();
  const slugBase = (params.companyName || params.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 10) || 'tidy';
  const suffix = crypto.randomBytes(2).toString('hex');
  const referralCode = `${slugBase}-${suffix}`;
  const partnerKey = `ps_pk_${slugBase}_${crypto.randomBytes(4).toString('hex')}`;
  const cleanOrigin = (params.appUrl || 'https://tidycorp.co.uk').replace(/\/$/, '');
  const referralLink = `${cleanOrigin}/?pscd=${encodeURIComponent(referralCode)}&ps_partner_key=${encodeURIComponent(partnerKey)}`;

  let syncStatus: 'live_synced' | 'queued_sandbox' | 'failed' = 'queued_sandbox';
  let partnerStackPartnershipId: string | undefined;
  let errorMessage: string | undefined;

  if (resolved.isLiveConfigured) {
    try {
      const response = await fetch(`${PARTNERSTACK_API_BASE}/partnerships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getPartnerStackAuthHeader(resolved.publicKey, resolved.secretKey)
        },
        body: JSON.stringify({
          email: params.email,
          first_name: params.name.split(' ')[0] || params.name,
          last_name: params.name.split(' ').slice(1).join(' ') || 'Partner',
          company_name: params.companyName,
          website: params.website || undefined
        })
      });

      const bodyText = await response.text();
      let parsed: any = {};
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        // non-JSON
      }

      if (response.ok) {
        syncStatus = 'live_synced';
        partnerStackPartnershipId = parsed?.data?.key || parsed?.key;
      } else {
        syncStatus = 'failed';
        errorMessage = `PartnerStack API ${response.status}: ${parsed?.message || bodyText.slice(0, 200)}`;
      }
    } catch (err: any) {
      syncStatus = 'failed';
      errorMessage = err?.message || 'Network error calling PartnerStack Partnerships API';
    }
  }

  const partner: PartnerStackPartner = {
    id: `psp_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    userId: params.userId,
    name: params.name.trim(),
    email: params.email.toLowerCase().trim(),
    companyName: params.companyName.trim(),
    partnerType: params.partnerType,
    website: params.website?.trim(),
    referralCode,
    referralLink,
    partnerKey: partnerStackPartnershipId || partnerKey,
    status: resolved.config.autoApprovePartners ? 'active' : 'approved',
    clicksCount: 0,
    signupsCount: 0,
    paidConversionsCount: 0,
    totalRevenueReferredGBP: 0,
    totalCommissionsEarnedGBP: 0,
    partnerStackPartnershipId,
    createdAt: new Date().toISOString()
  };

  await savePartnerStackPartnerToDB(partner);

  const event: PartnerStackEvent = {
    id: `ps_ev_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
    eventType: 'partner.application',
    customerEmail: partner.email,
    customerName: partner.name,
    partnerKey: partner.partnerKey,
    referralCode: partner.referralCode,
    currency: 'GBP',
    syncStatus,
    partnerStackResponseId: partnerStackPartnershipId,
    errorMessage,
    metadata: { partnerType: partner.partnerType, companyName: partner.companyName },
    createdAt: new Date().toISOString()
  };

  await savePartnerStackEventToDB(event);

  return { partner, event };
}

/**
 * Verifies inbound PartnerStack Webhook HMAC-SHA256 signature
 */
export async function verifyPartnerStackWebhookSignature(
  rawBodyStr: string,
  signatureHeader: string | undefined
): Promise<{ isValid: boolean; error?: string }> {
  const resolved = await getResolvedPartnerStackConfig();
  if (!resolved.webhookSecret) {
    return { isValid: true }; // Allow unsigned sandbox webhooks if secret not configured
  }

  if (!signatureHeader) {
    return { isValid: false, error: 'Missing PartnerStack webhook signature header' };
  }

  try {
    const computedHex = crypto
      .createHmac('sha256', resolved.webhookSecret)
      .update(rawBodyStr)
      .digest('hex');

    const providedClean = signatureHeader.replace(/^sha256=/i, '').trim();
    const expectedBuf = Buffer.from(computedHex, 'utf8');
    const providedBuf = Buffer.from(providedClean, 'utf8');

    if (expectedBuf.length !== providedBuf.length) {
      return { isValid: false, error: 'Webhook signature length mismatch' };
    }

    return { isValid: crypto.timingSafeEqual(expectedBuf, providedBuf) };
  } catch (err: any) {
    return { isValid: false, error: err?.message || 'Signature verification failed' };
  }
}
