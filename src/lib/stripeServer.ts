import Stripe from 'stripe';
import crypto from 'crypto';
import { fetchSecretFromGCP, getGcpProjectId, SecretDiagnostic } from './airwallexServer.js';
import {
  getUserByEmail,
  saveUser,
  saveTransactionToDB,
  getGatewayConfigFromDB,
  initFirestoreDB,
  StoredUser
} from './firestoreServer.js';
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import {
  UserSubscription,
  PaymentTransaction,
  StripeCheckoutSession,
  GatewayConfig
} from '../types.js';

export interface StripeDiagnostics {
  gcpProjectId: string | null;
  projectResolutionMethod: 'env_var' | 'client_auto_detected' | 'unresolved';
  secretManagerAttempts: Record<string, SecretDiagnostic>;
  statusMessage: string;
  reasonCategory:
    | 'configured'
    | 'secrets_not_found'
    | 'permission_denied'
    | 'api_disabled'
    | 'gcp_project_unresolved'
    | 'missing_required_fields'
    | 'not_configured';
}

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  isConfigured: boolean;
  source: 'env' | 'secret_manager' | 'firestore_gateway_config' | 'none';
  diagnostics?: StripeDiagnostics;
}

let cachedStripeConfig: StripeConfig | null = null;
let lastStripeConfigFetchTime = 0;
const CONFIG_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

let stripeInstance: Stripe | null = null;

/**
 * Resolves Stripe credentials by inspecting:
 * 1. Environment variables (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET)
 * 2. Google Cloud Secret Manager (project auto-detected or env var)
 * 3. Firestore gatewayConfig fallback
 */
export async function getResolvedStripeConfig(forceRefresh = false): Promise<StripeConfig> {
  const now = Date.now();
  if (!forceRefresh && cachedStripeConfig && (now - lastStripeConfigFetchTime) < CONFIG_CACHE_TTL) {
    return cachedStripeConfig;
  }

  let secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  let publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
  let webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  let source: StripeConfig['source'] = 'none';
  const secretAttempts: Record<string, SecretDiagnostic> = {};

  const { projectId, method: projectMethod } = await getGcpProjectId();

  if (secretKey) {
    source = 'env';
  } else {
    // Attempt to read from GCP Secret Manager
    const [secKeyRes, pubKeyRes, whRes] = await Promise.all([
      fetchSecretFromGCP('STRIPE_SECRET_KEY'),
      fetchSecretFromGCP('STRIPE_PUBLISHABLE_KEY'),
      fetchSecretFromGCP('STRIPE_WEBHOOK_SECRET')
    ]);

    secretAttempts['STRIPE_SECRET_KEY'] = secKeyRes.diagnostic;
    secretAttempts['STRIPE_PUBLISHABLE_KEY'] = pubKeyRes.diagnostic;
    secretAttempts['STRIPE_WEBHOOK_SECRET'] = whRes.diagnostic;

    if (secKeyRes.value) secretKey = secKeyRes.value;
    if (pubKeyRes.value) publishableKey = pubKeyRes.value;
    if (whRes.value) webhookSecret = whRes.value;

    if (secretKey) {
      source = 'secret_manager';
    }
  }

  // Fallback to Firestore gateway configuration if not found
  if (!secretKey) {
    try {
      const dbConfig = await getGatewayConfigFromDB();
      if (dbConfig?.stripe?.secretKeySet) {
        // Flag is set, see if publishableKey is present
        if (dbConfig.stripe.publishableKey) {
          publishableKey = publishableKey || dbConfig.stripe.publishableKey;
        }
      }
    } catch (_) {}
  }

  const isConfigured = Boolean(secretKey && secretKey.length > 5);

  let reasonCategory: StripeDiagnostics['reasonCategory'] = 'not_configured';
  let statusMessage = '';

  if (isConfigured) {
    reasonCategory = 'configured';
    statusMessage = `Stripe credentials loaded successfully via ${source}. Ready for live payment processing.`;
  } else {
    const secAttempt = secretAttempts['STRIPE_SECRET_KEY'];
    if (secAttempt?.status === 'permission_denied') {
      reasonCategory = 'permission_denied';
      statusMessage = `Permission denied accessing secret 'STRIPE_SECRET_KEY' in GCP project '${projectId}'. Ensure Cloud Run service account has Secret Manager Secret Accessor role.`;
    } else if (secAttempt?.status === 'api_disabled') {
      reasonCategory = 'api_disabled';
      statusMessage = `Secret Manager API is disabled in GCP project '${projectId}'. Enable secretmanager.googleapis.com in Google Cloud Console.`;
    } else if (secAttempt?.status === 'project_unresolved') {
      reasonCategory = 'gcp_project_unresolved';
      statusMessage = 'GCP project ID could not be detected. Set STRIPE_SECRET_KEY in environment variables or Secret Manager.';
    } else if (secAttempt?.status === 'not_found') {
      reasonCategory = 'secrets_not_found';
      statusMessage = `Secret 'STRIPE_SECRET_KEY' was not found in Secret Manager for GCP project '${projectId}'. Add the secret to enable live Stripe billing.`;
    } else {
      reasonCategory = 'not_configured';
      statusMessage = 'STRIPE_SECRET_KEY is not configured in Google Secret Manager or environment variables.';
    }
  }

  const diagnostics: StripeDiagnostics = {
    gcpProjectId: projectId,
    projectResolutionMethod: projectMethod,
    secretManagerAttempts: secretAttempts,
    statusMessage,
    reasonCategory
  };

  cachedStripeConfig = {
    secretKey,
    publishableKey,
    webhookSecret,
    isConfigured,
    source,
    diagnostics
  };
  lastStripeConfigFetchTime = now;

  // Reset Stripe instance if key changed
  if (stripeInstance && (!isConfigured || (stripeInstance as any)._apiKey !== secretKey)) {
    stripeInstance = null;
  }

  return cachedStripeConfig;
}

/**
 * Returns initialized Stripe client
 */
export async function getStripeClient(): Promise<Stripe | null> {
  const config = await getResolvedStripeConfig();
  if (!config.isConfigured || !config.secretKey) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true
    });
  }
  return stripeInstance;
}

/**
 * Plan Specifications for Stripe Billing
 */
export const getStripePlanSpecs = () => ({
  apprentice: { name: 'Apprentice', monthlyPriceGBP: 0, annualPriceGBP: 0, credits: 5000, fee: '10% GTV (Capped at £150)' },
  journeyman_pro: { name: 'Journeyman Pro', monthlyPriceGBP: 29, annualPriceGBP: 290, credits: 100000, fee: '5% GTV' },
  essential_landlord: { name: 'Essential Landlord', monthlyPriceGBP: 49, annualPriceGBP: 490, credits: 30000, fee: '5% Fee' },
  professional_portfolio: { name: 'Professional Portfolio', monthlyPriceGBP: 129, annualPriceGBP: 1290, credits: 150000, fee: 'Excess Fee £1.50' },
  insurers_surveyors: { name: 'Insurers & Surveyors', monthlyPriceGBP: 199, annualPriceGBP: 1990, credits: 200000, fee: 'API Fee £5.00' },
  enterprise_os: { name: 'Enterprise OS', monthlyPriceGBP: 399, annualPriceGBP: 3990, credits: 500000, fee: 'Pre-Committed' }
});

// Memory cache for Stripe checkout sessions
let memoryStripeSessions: StripeCheckoutSession[] = [];

export async function saveStripeSessionToDB(session: StripeCheckoutSession): Promise<StripeCheckoutSession> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      await setDoc(doc(firestore, 'stripeCheckoutSessions', session.id), session);
    }
  } catch (e) {
    console.log('saveStripeSessionToDB Firestore fallback to memory');
  }

  const existingIdx = memoryStripeSessions.findIndex(s => s.id === session.id);
  if (existingIdx >= 0) {
    memoryStripeSessions[existingIdx] = session;
  } else {
    memoryStripeSessions.unshift(session);
  }
  return session;
}

export async function getStripeSessionFromDB(sessionId: string): Promise<StripeCheckoutSession | null> {
  try {
    const firestore = await initFirestoreDB();
    if (firestore) {
      const snap = await getDoc(doc(firestore, 'stripeCheckoutSessions', sessionId));
      if (snap.exists()) {
        const session = snap.data() as StripeCheckoutSession;
        const idx = memoryStripeSessions.findIndex(s => s.id === sessionId);
        if (idx >= 0) memoryStripeSessions[idx] = session;
        else memoryStripeSessions.unshift(session);
        return session;
      }
    }
  } catch (e) {
    console.log('getStripeSessionFromDB Firestore fallback to memory');
  }

  const found = memoryStripeSessions.find(s => s.id === sessionId);
  return found || null;
}

/**
 * Initializes a Stripe PaymentIntent / Checkout Session for subscription/credits/care package purchase
 */
export async function createStripeSubscriptionSession(params: {
  itemId: string;
  itemType?: 'plan' | 'care_package' | 'credits' | 'escrow_pass';
  billingInterval?: 'monthly' | 'annual';
  amount?: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  companyName?: string;
  companyVatNumber?: string;
  billingAddress?: string;
  appUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{
  success: boolean;
  checkoutId: string;
  sessionId: string;
  checkoutUrl: string;
  paymentIntentId: string;
  clientSecret: string;
  publishableKey?: string;
  amount: number;
  currency: string;
  planName: string;
  isLive: boolean;
  error?: string;
  diagnostics?: StripeDiagnostics;
}> {
  const {
    itemId,
    itemType = 'plan',
    billingInterval = 'monthly',
    customerEmail,
    customerName = 'Valued Subscriber',
    companyName = '',
    companyVatNumber = '',
    billingAddress = 'United Kingdom',
    appUrl = '',
    successUrl = '/?payment_status=success',
    cancelUrl = '/?payment_status=cancelled'
  } = params;

  const planSpecs = getStripePlanSpecs();
  let calculatedAmount = Number(params.amount) || 0;
  let planName = 'Tidy Subscription Plan';

  if (itemType === 'plan') {
    const spec = (planSpecs as any)[itemId] || planSpecs.journeyman_pro;
    planName = spec.name;
    if (!params.amount && params.amount !== 0) {
      calculatedAmount = billingInterval === 'annual' ? spec.annualPriceGBP : spec.monthlyPriceGBP;
    }
  } else if (itemType === 'care_package') {
    const carePrices: Record<string, number> = { tidy_essentials: 19, tidy_homecare: 39, tidy_safecover: 79 };
    calculatedAmount = params.amount || carePrices[itemId] || 29;
    planName = `Care Package: ${itemId.replace('tidy_', 'Tidy ')}`;
  } else if (itemType === 'credits') {
    calculatedAmount = itemId === 'bulk' ? 700 : 10;
    planName = itemId === 'bulk' ? 'Bulk AI Credits (1.4M)' : 'Standard AI Credits (20,000)';
  } else if (itemType === 'escrow_pass') {
    calculatedAmount = 500;
    planName = 'Escrow Pre-Purchase Growth Pass (£25k)';
  }

  const currency = (params.currency || 'GBP').toUpperCase();
  const config = await getResolvedStripeConfig();

  // If live Stripe credentials exist, create a real Stripe Checkout Session (Hosted Checkout)
  const stripe = await getStripeClient();
  let sessionId = '';
  let checkoutUrl = '';
  let paymentIntentId = '';
  let clientSecret = '';
  let isLive = false;

  // Resolve base URL for redirects
  const baseAppUrl = appUrl || process.env.APP_URL || 'http://localhost:3000';
  let resolvedSuccessUrl = successUrl;
  if (resolvedSuccessUrl.startsWith('/')) {
    resolvedSuccessUrl = `${baseAppUrl}${resolvedSuccessUrl}`;
  }
  if (!resolvedSuccessUrl.includes('session_id=')) {
    const joiner = resolvedSuccessUrl.includes('?') ? '&' : '?';
    resolvedSuccessUrl = `${resolvedSuccessUrl}${joiner}session_id={CHECKOUT_SESSION_ID}&payment_status=success&item_id=${itemId}`;
  }

  let resolvedCancelUrl = cancelUrl;
  if (resolvedCancelUrl.startsWith('/')) {
    resolvedCancelUrl = `${baseAppUrl}${resolvedCancelUrl}`;
  }
  if (!resolvedCancelUrl.includes('payment_status=')) {
    const joiner = resolvedCancelUrl.includes('?') ? '&' : '?';
    resolvedCancelUrl = `${resolvedCancelUrl}${joiner}payment_status=cancelled`;
  }

  if (stripe && config.isConfigured) {
    try {
      // Amount in smallest currency unit (pence for GBP)
      const amountInPence = Math.round(calculatedAmount * 100);

      // Create official Stripe Hosted Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Tidy Corporation Ltd: ${planName}`,
                description: `${planName} (${billingInterval === 'annual' ? 'Annual Subscription' : 'Monthly Subscription'}) • FCA-Regulated Escrow & Property OS`,
              },
              unit_amount: amountInPence,
            },
            quantity: 1,
          }
        ],
        metadata: {
          itemId: String(itemId),
          itemType: String(itemType),
          billingInterval: String(billingInterval),
          customerEmail,
          customerName,
          companyName,
          companyVatNumber
        },
        billing_address_collection: 'auto',
        success_url: resolvedSuccessUrl,
        cancel_url: resolvedCancelUrl,
      });

      sessionId = checkoutSession.id;
      checkoutUrl = checkoutSession.url || '';
      paymentIntentId = typeof checkoutSession.payment_intent === 'string'
        ? checkoutSession.payment_intent
        : (checkoutSession.payment_intent?.id || sessionId);
      isLive = true;
    } catch (stripeErr: any) {
      console.error('[STRIPE API ERROR] Failed to create Checkout Session:', stripeErr);
      throw new Error(`Stripe API Error: ${stripeErr.message || 'Checkout session creation failed'}`);
    }
  } else {
    // If Stripe credentials are not set in Secret Manager or env,
    // generate a structured simulated checkout session to allow sandbox testing and provide clear diagnostics
    sessionId = `cs_mock_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    paymentIntentId = `pi_mock_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    clientSecret = `${paymentIntentId}_secret_${crypto.randomBytes(8).toString('hex')}`;
    checkoutUrl = `${resolvedSuccessUrl.replace('{CHECKOUT_SESSION_ID}', sessionId)}`;
    isLive = false;
  }

  const session: StripeCheckoutSession = {
    id: sessionId,
    paymentIntentId,
    clientSecret,
    checkoutUrl,
    itemType,
    itemId,
    planName,
    billingInterval,
    amount: calculatedAmount,
    currency,
    customerEmail,
    customerName,
    companyName,
    companyVatNumber,
    billingAddress,
    status: 'pending',
    stripeStatus: isLive ? 'open' : 'pending_setup',
    publishableKey: config.publishableKey || '',
    successUrl: resolvedSuccessUrl,
    cancelUrl: resolvedCancelUrl,
    createdAt: new Date().toISOString()
  };

  await saveStripeSessionToDB(session);

  return {
    success: true,
    checkoutId: sessionId,
    sessionId,
    checkoutUrl,
    paymentIntentId,
    clientSecret,
    publishableKey: config.publishableKey,
    amount: calculatedAmount,
    currency,
    planName,
    isLive,
    diagnostics: config.diagnostics
  };
}

/**
 * Apply the subscription, credits, or package to the user in the database
 * and record a verified Stripe transaction and VAT invoice receipt.
 */
export async function applyStripeSubscriptionToUser(params: {
  customerEmail: string;
  customerName?: string;
  itemType: 'plan' | 'care_package' | 'credits' | 'escrow_pass';
  itemId: string;
  billingInterval: 'monthly' | 'annual';
  amount: number;
  currency?: string;
  paymentMethodUsed?: string;
  gatewayRef?: string;
  companyName?: string;
  companyVatNumber?: string;
  billingAddress?: string;
}) {
  const {
    customerEmail,
    customerName,
    itemType,
    itemId,
    billingInterval,
    amount,
    currency = 'GBP',
    paymentMethodUsed = 'Stripe Credit/Debit Card',
    gatewayRef = `pi_stripe_${Date.now()}`,
    companyName = '',
    companyVatNumber = '',
    billingAddress = 'United Kingdom'
  } = params;

  const emailToUse = (customerEmail || 'user@tidycorp.co.uk').toLowerCase().trim();
  const nameToUse = customerName || 'Valued Subscriber';
  const planSpecs = getStripePlanSpecs();
  const intervalDays = billingInterval === 'annual' ? 365 : 30;

  let updatedSub: UserSubscription | null = null;
  let transactionDescription = '';

  let storedUser: StoredUser | null = await getUserByEmail(emailToUse);

  if (itemType === 'plan') {
    const spec = (planSpecs as any)[itemId] || planSpecs.journeyman_pro;
    updatedSub = {
      planId: itemId as any,
      planName: spec.name,
      billingInterval: billingInterval || 'monthly',
      status: 'active',
      renewalDate: new Date(Date.now() + intervalDays * 24 * 3600 * 1000).toISOString().split('T')[0],
      monthlyCreditsQuota: spec.credits,
      remainingCredits: (storedUser?.subscription?.remainingCredits || 0) + spec.credits,
      transactionFeeRate: spec.fee,
      hasEscrowPrePurchasePass: storedUser?.subscription?.hasEscrowPrePurchasePass || false,
      escrowPassVolumeUsedGBP: storedUser?.subscription?.escrowPassVolumeUsedGBP || 0,
      activeCarePackageId: storedUser?.subscription?.activeCarePackageId || 'none'
    };
    transactionDescription = `Stripe Subscription: ${spec.name} (${billingInterval === 'annual' ? 'Annual' : 'Monthly'})`;
  } else if (itemType === 'care_package') {
    updatedSub = {
      ...(storedUser?.subscription || {
        planId: 'apprentice',
        planName: 'Apprentice',
        billingInterval: 'monthly',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        monthlyCreditsQuota: 5000,
        remainingCredits: 5000,
        transactionFeeRate: '10% GTV',
        hasEscrowPrePurchasePass: false,
        escrowPassVolumeUsedGBP: 0,
        activeCarePackageId: 'none'
      }),
      activeCarePackageId: itemId as any
    };
    transactionDescription = `Stripe Care Package: ${itemId}`;
  } else if (itemType === 'credits') {
    const creditsToAdd = itemId === 'bulk' ? 1400000 : 20000;
    updatedSub = {
      ...(storedUser?.subscription || {
        planId: 'apprentice',
        planName: 'Apprentice',
        billingInterval: 'monthly',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        monthlyCreditsQuota: 5000,
        remainingCredits: 0,
        transactionFeeRate: '10% GTV',
        hasEscrowPrePurchasePass: false,
        escrowPassVolumeUsedGBP: 0,
        activeCarePackageId: 'none'
      }),
      remainingCredits: (storedUser?.subscription?.remainingCredits || 0) + creditsToAdd
    };
    transactionDescription = `Stripe Compute Credits Top-Up: ${creditsToAdd.toLocaleString()} Credits`;
  } else if (itemType === 'escrow_pass') {
    updatedSub = {
      ...(storedUser?.subscription || {
        planId: 'apprentice',
        planName: 'Apprentice',
        billingInterval: 'monthly',
        status: 'active',
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        monthlyCreditsQuota: 5000,
        remainingCredits: 5000,
        transactionFeeRate: '10% GTV',
        hasEscrowPrePurchasePass: false,
        escrowPassVolumeUsedGBP: 0,
        activeCarePackageId: 'none'
      }),
      hasEscrowPrePurchasePass: true,
      escrowPassVolumeUsedGBP: 0
    };
    transactionDescription = 'Stripe Escrow Pre-Purchase Growth Pass (£25k Allowance)';
  }

  if (storedUser && updatedSub) {
    storedUser.subscription = updatedSub;
    await saveUser(storedUser);
  }

  const txId = `strp_tx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  
  // Calculate Stripe fees (standard UK rate: 1.4% + £0.20)
  const numAmount = Number(amount) || 0;
  const fee = Math.round((numAmount * 0.014 + 0.20) * 100) / 100;

  const transaction: PaymentTransaction = {
    id: txId,
    projectId: 'subscription-portal',
    projectTitle: transactionDescription,
    milestoneId: `stripe_sub_${Date.now()}`,
    milestoneTitle: transactionDescription,
    clientName: nameToUse,
    amount: numAmount,
    currency,
    gateway: 'stripe',
    paymentMethodUsed,
    status: 'succeeded',
    gatewayRef,
    feeAmount: fee,
    timestamp: new Date().toISOString()
  };

  await saveTransactionToDB(transaction);

  // Update session record if it exists
  const session = await getStripeSessionFromDB(gatewayRef);
  if (session) {
    session.status = 'succeeded';
    session.stripeStatus = 'succeeded';
    session.completedAt = new Date().toISOString();
    session.gatewayRef = gatewayRef;
    session.paymentMethodUsed = paymentMethodUsed;
    await saveStripeSessionToDB(session);
  }

  const subtotal = Number((numAmount / 1.2).toFixed(2));
  const vatAmount = Number((numAmount - subtotal).toFixed(2));

  const receipt = {
    transactionId: txId,
    gatewayReference: gatewayRef,
    clearedVia: 'Stripe Payments UK Limited • FCA Authorized Electronic Money Institution',
    date: new Date().toISOString(),
    customerName: nameToUse,
    customerEmail: emailToUse,
    companyName: companyName || '',
    companyVatNumber: companyVatNumber || '',
    billingAddress: billingAddress || 'United Kingdom',
    itemDescription: transactionDescription,
    subtotal,
    vatRate: '20.0%',
    vatAmount,
    amount: numAmount,
    currency,
    paymentMethodUsed,
    status: 'Paid & Active'
  };

  return {
    updatedSub,
    transaction,
    receipt
  };
}

/**
 * Verifies a Stripe Hosted Checkout Session and automatically applies the subscription
 */
export async function verifyStripeCheckoutSession(sessionId: string) {
  if (!sessionId) {
    throw new Error('Missing sessionId parameter');
  }

  const stripe = await getStripeClient();

  if (stripe && !sessionId.startsWith('cs_mock_')) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items']
      });

      if (session.payment_status === 'paid' || session.status === 'complete') {
        const meta = session.metadata || {};
        const email = session.customer_details?.email || (meta.customerEmail as string) || session.customer_email || 'user@tidycorp.co.uk';
        const name = session.customer_details?.name || (meta.customerName as string) || 'Valued Subscriber';
        const itemType = (meta.itemType as any) || 'plan';
        const itemId = meta.itemId || 'journeyman_pro';
        const billingInterval = (meta.billingInterval as any) || 'monthly';
        const amount = (session.amount_total || 0) / 100;
        const currency = (session.currency || 'GBP').toUpperCase();

        const result = await applyStripeSubscriptionToUser({
          customerEmail: email,
          customerName: name,
          itemType,
          itemId,
          billingInterval,
          amount,
          currency,
          paymentMethodUsed: 'Stripe Hosted Checkout (Cards / Apple Pay / Google Pay / BACS)',
          gatewayRef: session.id,
          companyName: (meta.companyName as string) || '',
          companyVatNumber: (meta.companyVatNumber as string) || '',
          billingAddress: session.customer_details?.address?.line1 || 'United Kingdom'
        });

        // Update stored session
        const storedSession = await getStripeSessionFromDB(sessionId);
        if (storedSession) {
          storedSession.status = 'succeeded';
          storedSession.stripeStatus = 'paid';
          storedSession.completedAt = new Date().toISOString();
          storedSession.gatewayRef = session.id;
          await saveStripeSessionToDB(storedSession);
        }

        return {
          success: true,
          verified: true,
          status: session.status,
          paymentStatus: session.payment_status,
          session,
          subscription: result.updatedSub,
          receipt: result.receipt,
          transaction: result.transaction
        };
      } else {
        return {
          success: false,
          verified: false,
          status: session.status,
          paymentStatus: session.payment_status,
          message: `Stripe Checkout Session is not completed yet (Status: ${session.status}, Payment: ${session.payment_status})`
        };
      }
    } catch (err: any) {
      console.error('[STRIPE CHECKOUT VERIFY ERROR]:', err);
      throw new Error(`Stripe Checkout Verification Failed: ${err.message || 'Session not verified'}`);
    }
  } else {
    // Simulated / Test mode (for developer sandbox)
    const stored = await getStripeSessionFromDB(sessionId);
    const itemType = stored?.itemType || 'plan';
    const itemId = stored?.itemId || 'journeyman_pro';
    const billingInterval = stored?.billingInterval || 'monthly';
    const email = stored?.customerEmail || 'subscriber@tidycorp.co.uk';
    const name = stored?.customerName || 'Valued Subscriber';
    const amount = stored?.amount || 29;
    const currency = stored?.currency || 'GBP';

    const result = await applyStripeSubscriptionToUser({
      customerEmail: email,
      customerName: name,
      itemType,
      itemId,
      billingInterval,
      amount,
      currency,
      paymentMethodUsed: 'Stripe Sandbox Simulation',
      gatewayRef: sessionId,
      companyName: stored?.companyName || '',
      companyVatNumber: stored?.companyVatNumber || '',
      billingAddress: stored?.billingAddress || 'United Kingdom'
    });

    return {
      success: true,
      verified: true,
      status: 'complete',
      paymentStatus: 'paid',
      subscription: result.updatedSub,
      receipt: result.receipt,
      transaction: result.transaction
    };
  }
}

/**
 * Confirms payment status for a Stripe PaymentIntent or Checkout Session
 */
export async function verifyAndConfirmStripePayment(params: {
  paymentIntentId: string;
  itemId?: string;
  itemType?: 'plan' | 'care_package' | 'credits' | 'escrow_pass';
  billingInterval?: 'monthly' | 'annual';
  amount?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  companyName?: string;
  companyVatNumber?: string;
  billingAddress?: string;
  paymentMethod?: string;
}) {
  const { paymentIntentId } = params;
  if (!paymentIntentId) {
    throw new Error('Missing paymentIntentId parameter');
  }

  // If this is a Stripe Checkout Session (starts with cs_)
  if (paymentIntentId.startsWith('cs_')) {
    const sessionResult = await verifyStripeCheckoutSession(paymentIntentId);
    if (!sessionResult.verified) {
      throw new Error(sessionResult.message || 'Stripe checkout not verified');
    }
    return {
      updatedSub: sessionResult.subscription,
      transaction: sessionResult.transaction,
      receipt: sessionResult.receipt
    };
  }

  const stripe = await getStripeClient();
  let paymentSucceeded = false;
  let resolvedAmount = params.amount || 0;
  let resolvedCurrency = params.currency || 'GBP';
  let resolvedEmail = params.customerEmail || '';
  let resolvedName = params.customerName || '';
  let resolvedMethod = params.paymentMethod || 'card';

  // Check if live Stripe payment
  if (stripe && !paymentIntentId.startsWith('pi_mock_')) {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status === 'succeeded') {
        paymentSucceeded = true;
        resolvedAmount = intent.amount / 100;
        resolvedCurrency = intent.currency.toUpperCase();
        resolvedEmail = resolvedEmail || intent.receipt_email || (intent.metadata?.customerEmail as string) || '';
        resolvedName = resolvedName || (intent.metadata?.customerName as string) || '';
      } else {
        throw new Error(`Stripe payment not completed. Current status: ${intent.status}`);
      }
    } catch (err: any) {
      console.error('[STRIPE VERIFY ERROR]:', err);
      throw new Error(`Stripe Verification Failed: ${err.message || 'Payment not verified'}`);
    }
  } else {
    // Simulated / Test mode (for developer sandbox)
    paymentSucceeded = true;
  }

  // Look up existing session for item details
  const session = await getStripeSessionFromDB(paymentIntentId);

  const itemType = params.itemType || session?.itemType || 'plan';
  const itemId = params.itemId || session?.itemId || 'journeyman_pro';
  const billingInterval = params.billingInterval || session?.billingInterval || 'monthly';
  const emailToUse = resolvedEmail || session?.customerEmail || 'subscriber@tidycorp.co.uk';
  const nameToUse = resolvedName || session?.customerName || 'Valued Subscriber';
  const amountToUse = resolvedAmount || session?.amount || 0;

  const result = await applyStripeSubscriptionToUser({
    customerEmail: emailToUse,
    customerName: nameToUse,
    itemType,
    itemId,
    billingInterval,
    amount: amountToUse,
    currency: resolvedCurrency,
    paymentMethodUsed: `Stripe (${resolvedMethod})`,
    gatewayRef: paymentIntentId,
    companyName: params.companyName || session?.companyName || '',
    companyVatNumber: params.companyVatNumber || session?.companyVatNumber || '',
    billingAddress: params.billingAddress || session?.billingAddress || 'United Kingdom'
  });

  return result;
}
