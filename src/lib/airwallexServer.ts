import crypto from 'crypto';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { getGatewayConfigFromDB } from './firestoreServer.js';

export interface AirwallexConfig {
  clientId: string;
  apiKey: string;
  webhookSecret: string;
  env: 'demo' | 'prod';
  baseUrl: string;
  isConfigured: boolean;
  source?: 'env' | 'secret_manager' | 'firestore_gateway_config' | 'none';
}

let secretManagerClient: SecretManagerServiceClient | null = null;
function getSecretClient(): SecretManagerServiceClient {
  if (!secretManagerClient) {
    secretManagerClient = new SecretManagerServiceClient();
  }
  return secretManagerClient;
}

const secretCache: Record<string, { value: string; fetchedAt: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Attempt to read a secret from Google Secret Manager if not present in process.env
 */
async function fetchSecretFromGCP(secretName: string): Promise<string> {
  const cached = secretCache[secretName];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  const projectId =
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    '661881715792';

  const client = getSecretClient();
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (payload) {
      secretCache[secretName] = { value: payload.trim(), fetchedAt: Date.now() };
      return payload.trim();
    }
  } catch (err: any) {
    // Secret not found or permissions issue - handled gracefully
  }

  return '';
}

/**
 * Synchronous resolver for config (with async background hydrate)
 */
export function getAirwallexConfig(): AirwallexConfig {
  let clientId = (process.env.AIRWALLEX_CLIENT_ID || '').trim();
  let apiKey = (process.env.AIRWALLEX_API_KEY || '').trim();
  let webhookSecret = (process.env.AIRWALLEX_WEBHOOK_SECRET || '').trim();

  // Fallback to cache from Secret Manager if process.env is empty
  if (!clientId && secretCache['AIRWALLEX_CLIENT_ID']?.value) {
    clientId = secretCache['AIRWALLEX_CLIENT_ID'].value;
  }
  if (!apiKey && secretCache['AIRWALLEX_API_KEY']?.value) {
    apiKey = secretCache['AIRWALLEX_API_KEY'].value;
  }
  if (!webhookSecret && secretCache['AIRWALLEX_WEBHOOK_SECRET']?.value) {
    webhookSecret = secretCache['AIRWALLEX_WEBHOOK_SECRET'].value;
  }

  const env: 'demo' | 'prod' = (process.env.AIRWALLEX_ENV || 'demo').toLowerCase() === 'prod' ? 'prod' : 'demo';
  const baseUrl = env === 'prod' ? 'https://api.airwallex.com' : 'https://api-demo.airwallex.com';
  const isConfigured = Boolean(clientId && apiKey);

  return {
    clientId,
    apiKey,
    webhookSecret,
    env,
    baseUrl,
    isConfigured,
    source: isConfigured ? (process.env.AIRWALLEX_CLIENT_ID ? 'env' : 'secret_manager') : 'none'
  };
}

/**
 * Async resolver for config: checks process.env, then Google Secret Manager, then Firestore Gateway Config
 */
export async function getResolvedAirwallexConfig(): Promise<AirwallexConfig> {
  let clientId = (process.env.AIRWALLEX_CLIENT_ID || '').trim();
  let apiKey = (process.env.AIRWALLEX_API_KEY || '').trim();
  let webhookSecret = (process.env.AIRWALLEX_WEBHOOK_SECRET || '').trim();
  let source: AirwallexConfig['source'] = 'env';

  // 1. Try Google Secret Manager if environment variables are not populated
  if (!clientId || !apiKey || !webhookSecret) {
    try {
      const [smClientId, smApiKey, smWebhookSecret] = await Promise.all([
        !clientId ? fetchSecretFromGCP('AIRWALLEX_CLIENT_ID') : Promise.resolve(clientId),
        !apiKey ? fetchSecretFromGCP('AIRWALLEX_API_KEY') : Promise.resolve(apiKey),
        !webhookSecret ? fetchSecretFromGCP('AIRWALLEX_WEBHOOK_SECRET') : Promise.resolve(webhookSecret)
      ]);

      if (smClientId) clientId = smClientId;
      if (smApiKey) apiKey = smApiKey;
      if (smWebhookSecret) webhookSecret = smWebhookSecret;

      if (smClientId || smApiKey) {
        source = 'secret_manager';
      }
    } catch (e) {
      console.warn('[AIRWALLEX] Secret Manager lookup error, checking database config');
    }
  }

  // 2. Try Firestore Gateway Config as fallback
  if (!clientId || !apiKey) {
    try {
      const gatewayConfig = await getGatewayConfigFromDB();
      if (gatewayConfig?.airwallex?.clientId && gatewayConfig?.airwallex?.apiKey) {
        clientId = clientId || gatewayConfig.airwallex.clientId.trim();
        apiKey = apiKey || gatewayConfig.airwallex.apiKey.trim();
        webhookSecret = webhookSecret || (gatewayConfig.airwallex.webhookSecret || '').trim();
        source = 'firestore_gateway_config';
      }
    } catch (e) {
      console.warn('[AIRWALLEX] Gateway Config lookup error');
    }
  }

  const env: 'demo' | 'prod' = (process.env.AIRWALLEX_ENV || 'demo').toLowerCase() === 'prod' ? 'prod' : 'demo';
  const baseUrl = env === 'prod' ? 'https://api.airwallex.com' : 'https://api-demo.airwallex.com';
  const isConfigured = Boolean(clientId && apiKey);

  return {
    clientId,
    apiKey,
    webhookSecret,
    env,
    baseUrl,
    isConfigured,
    source
  };
}

let cachedAuthToken: { token: string; expiresAtMs: number } | null = null;

/**
 * Authenticate with Airwallex API using API Key & Client ID
 * POST /api/v1/authentication/login
 */
export async function getAirwallexAuthToken(): Promise<string> {
  const config = await getResolvedAirwallexConfig();
  if (!config.isConfigured) {
    throw new Error(
      'Airwallex API credentials are not configured. Please set AIRWALLEX_CLIENT_ID and AIRWALLEX_API_KEY in Google Secret Manager or environment variables.'
    );
  }

  const now = Date.now();
  // Return cached token if valid for at least 3 more minutes
  if (cachedAuthToken && cachedAuthToken.expiresAtMs - now > 3 * 60 * 1000) {
    return cachedAuthToken.token;
  }

  const loginUrl = `${config.baseUrl}/api/v1/authentication/login`;
  console.log(`[AIRWALLEX] Authenticating with ${config.env.toUpperCase()} API (${config.source}): ${loginUrl}`);

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': config.clientId,
      'x-api-key': config.apiKey
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AIRWALLEX AUTH ERROR] Status: ${res.status}, Response:`, errText);
    throw new Error(`Airwallex authentication failed (Status ${res.status}): ${errText || 'Invalid credentials'}`);
  }

  const data = (await res.json()) as { token: string; expires_at: string };
  if (!data?.token) {
    throw new Error('Airwallex authentication did not return a valid auth token.');
  }

  const expiresAtMs = data.expires_at ? new Date(data.expires_at).getTime() : now + 25 * 60 * 1000;
  cachedAuthToken = {
    token: data.token,
    expiresAtMs
  };

  return data.token;
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  merchantOrderId: string;
  descriptor?: string;
  metadata?: Record<string, string>;
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  };
  returnUrl?: string;
}

export interface AirwallexPaymentIntent {
  id: string;
  request_id: string;
  amount: number;
  currency: string;
  merchant_order_id: string;
  status:
    | 'REQUIRES_PAYMENT_METHOD'
    | 'REQUIRES_CUSTOMER_ACTION'
    | 'REQUIRES_CAPTURE'
    | 'PENDING'
    | 'PROCESSING'
    | 'SUCCEEDED'
    | 'CANCELLED'
    | 'FAILED';
  client_secret: string;
  next_action?: any;
  latest_payment_attempt?: {
    id: string;
    status: string;
    payment_method_type?: string;
    payment_method?: {
      type: string;
      card?: {
        brand: string;
        last4: string;
        expiry_month: string;
        expiry_year: string;
      };
      bacs_direct_debit?: {
        sort_code: string;
        account_number: string;
      };
    };
    authentication_data?: any;
  };
  metadata?: Record<string, string>;
  customer?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Create a real Payment Intent on Airwallex
 * POST /api/v1/pa/payment_intents/create
 */
export async function createAirwallexPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<AirwallexPaymentIntent> {
  const config = await getResolvedAirwallexConfig();
  const token = await getAirwallexAuthToken();

  const requestId = crypto.randomUUID();
  const createUrl = `${config.baseUrl}/api/v1/pa/payment_intents/create`;

  const payload = {
    request_id: requestId,
    amount: Number(params.amount.toFixed(2)),
    currency: (params.currency || 'GBP').toUpperCase(),
    merchant_order_id: params.merchantOrderId,
    descriptor: params.descriptor || 'Tidy Corporation Ltd',
    metadata: params.metadata || {},
    customer: params.customer || {},
    return_url: params.returnUrl
  };

  console.log(`[AIRWALLEX] Creating Payment Intent for £${payload.amount} ${payload.currency} (Order: ${payload.merchant_order_id})`);

  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AIRWALLEX CREATE INTENT ERROR] Status: ${res.status}, Response:`, errText);
    throw new Error(`Failed to create Airwallex payment intent (Status ${res.status}): ${errText}`);
  }

  const intent = (await res.json()) as AirwallexPaymentIntent;
  console.log(`[AIRWALLEX] Payment Intent created successfully: ID=${intent.id}, Status=${intent.status}`);
  return intent;
}

/**
 * Retrieve and verify status of a Payment Intent directly from Airwallex API
 * GET /api/v1/pa/payment_intents/{id}
 */
export async function getAirwallexPaymentIntent(paymentIntentId: string): Promise<AirwallexPaymentIntent> {
  const config = await getResolvedAirwallexConfig();
  const token = await getAirwallexAuthToken();

  const getUrl = `${config.baseUrl}/api/v1/pa/payment_intents/${encodeURIComponent(paymentIntentId)}`;

  const res = await fetch(getUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[AIRWALLEX GET INTENT ERROR] Status: ${res.status}, Intent: ${paymentIntentId}`, errText);
    throw new Error(`Failed to retrieve Airwallex payment intent ${paymentIntentId} (Status ${res.status}): ${errText}`);
  }

  return (await res.json()) as AirwallexPaymentIntent;
}

/**
 * Cryptographically verify Airwallex Webhook HMAC-SHA256 signature
 */
export async function verifyAirwallexWebhookSignature(
  rawBodyStr: string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined
): Promise<{ isValid: boolean; error?: string }> {
  const config = await getResolvedAirwallexConfig();

  if (!config.webhookSecret) {
    return {
      isValid: false,
      error: 'AIRWALLEX_WEBHOOK_SECRET is not configured on the server.'
    };
  }

  if (!signatureHeader) {
    return {
      isValid: false,
      error: 'Missing x-signature header on webhook request.'
    };
  }

  try {
    const payloadToSign = timestampHeader ? `${timestampHeader}${rawBodyStr}` : rawBodyStr;
    const computedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payloadToSign)
      .digest('hex');

    const expectedBuffer = Buffer.from(computedSignature, 'utf8');
    const providedBuffer = Buffer.from(signatureHeader, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return { isValid: false, error: 'Signature length mismatch.' };
    }

    const isMatch = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    return { isValid: isMatch };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Signature verification calculation error.' };
  }
}
