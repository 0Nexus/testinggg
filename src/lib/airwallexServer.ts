import crypto from 'crypto';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { getGatewayConfigFromDB } from './firestoreServer.js';

export interface SecretDiagnostic {
  secretName: string;
  projectId: string | null;
  status: 'found' | 'not_found' | 'permission_denied' | 'api_disabled' | 'unauthenticated' | 'project_unresolved' | 'error';
  errorCode?: string | number;
  errorMessage?: string;
}

export interface AirwallexDiagnostics {
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

export interface AirwallexConfig {
  clientId: string;
  apiKey: string;
  webhookSecret: string;
  env: 'demo' | 'prod';
  baseUrl: string;
  isConfigured: boolean;
  source?: 'env' | 'secret_manager' | 'firestore_gateway_config' | 'none';
  diagnostics?: AirwallexDiagnostics;
}

let secretManagerClient: SecretManagerServiceClient | null = null;
function getSecretClient(): SecretManagerServiceClient {
  if (!secretManagerClient) {
    secretManagerClient = new SecretManagerServiceClient();
  }
  return secretManagerClient;
}

let cachedGcpProjectId: string | null = null;

/**
 * Resolves the GCP Project ID:
 * 1. Checks environment variables (GCP_PROJECT, GOOGLE_CLOUD_PROJECT, GCLOUD_PROJECT)
 * 2. If absent, uses the Google Cloud client library default resolution (@google-cloud/secret-manager / google-auth-library)
 */
export async function getGcpProjectId(): Promise<{ projectId: string | null; method: 'env_var' | 'client_auto_detected' | 'unresolved' }> {
  if (cachedGcpProjectId) {
    return { projectId: cachedGcpProjectId, method: 'client_auto_detected' };
  }

  const envProject =
    process.env.GCP_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;

  if (envProject && envProject.trim()) {
    cachedGcpProjectId = envProject.trim();
    return { projectId: cachedGcpProjectId, method: 'env_var' };
  }

  try {
    const client = getSecretClient();
    const autoProject = await client.getProjectId();
    if (autoProject && typeof autoProject === 'string' && autoProject.trim()) {
      cachedGcpProjectId = autoProject.trim();
      return { projectId: cachedGcpProjectId, method: 'client_auto_detected' };
    }
  } catch (err: any) {
    console.warn('[SECRET MANAGER] Could not auto-detect GCP project ID via Google Cloud default credentials resolution:', err?.message || err);
  }

  return { projectId: null, method: 'unresolved' };
}

const secretCache: Record<string, { value: string; fetchedAt: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Result of fetching a secret from GCP Secret Manager with full diagnostics
 */
export interface SecretFetchResult {
  value: string;
  diagnostic: SecretDiagnostic;
}

/**
 * Attempt to read a secret from Google Secret Manager with robust error classification and logging.
 */
export async function fetchSecretFromGCP(secretName: string): Promise<SecretFetchResult> {
  const cached = secretCache[secretName];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      value: cached.value,
      diagnostic: {
        secretName,
        projectId: cachedGcpProjectId,
        status: 'found'
      }
    };
  }

  const { projectId, method: projectMethod } = await getGcpProjectId();

  if (!projectId) {
    const diagnostic: SecretDiagnostic = {
      secretName,
      projectId: null,
      status: 'project_unresolved',
      errorMessage: 'GCP project ID could not be resolved (no env var and client auto-detection failed).'
    };
    console.error(
      `[SECRET MANAGER RESOLUTION ERROR] Cannot fetch secret '${secretName}': No GCP project ID available. ` +
      `Environment variables (GCP_PROJECT, GOOGLE_CLOUD_PROJECT, GCLOUD_PROJECT) are not set and Google Cloud client library could not auto-resolve project ID.`
    );
    return { value: '', diagnostic };
  }

  const client = getSecretClient();
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (payload) {
      const trimmed = payload.trim();
      secretCache[secretName] = { value: trimmed, fetchedAt: Date.now() };
      return {
        value: trimmed,
        diagnostic: {
          secretName,
          projectId,
          status: 'found'
        }
      };
    }
    const diagnostic: SecretDiagnostic = {
      secretName,
      projectId,
      status: 'not_found',
      errorMessage: 'Secret payload was empty.'
    };
    return { value: '', diagnostic };
  } catch (err: any) {
    const errCode = err.code || err.status;
    const errMsg = String(err.message || err);
    const errDetails = String(err.details || '');

    // Classify error based on gRPC status code and error messages
    let statusCategory: SecretDiagnostic['status'] = 'error';

    if (errCode === 5 || errCode === 404 || errMsg.includes('NOT_FOUND') || errMsg.includes('not found')) {
      statusCategory = 'not_found';
      console.error(
        `[SECRET MANAGER NOT FOUND] Secret '${secretName}' does not exist or has no latest version in GCP project '${projectId}'. ` +
        `[Code: ${errCode || 404}] Details: ${errMsg}`
      );
    } else if (
      errCode === 7 ||
      errCode === 403 ||
      errMsg.includes('PERMISSION_DENIED') ||
      errMsg.includes('Permission denied') ||
      errMsg.includes('does not have secretmanager.secrets.get')
    ) {
      statusCategory = 'permission_denied';
      console.error(
        `[SECRET MANAGER PERMISSION DENIED] Access denied fetching secret '${secretName}' from GCP project '${projectId}'. ` +
        `The Cloud Run runtime service account requires the 'roles/secretmanager.secretAccessor' IAM role. ` +
        `[Code: ${errCode || 403}] Details: ${errMsg}`
      );
    } else if (
      errCode === 9 ||
      errMsg.includes('FAILED_PRECONDITION') ||
      errMsg.includes('has not been used') ||
      errMsg.includes('is not enabled') ||
      errMsg.includes('SERVICE_DISABLED')
    ) {
      statusCategory = 'api_disabled';
      console.error(
        `[SECRET MANAGER API DISABLED] Secret Manager API is not enabled for GCP project '${projectId}'. ` +
        `Enable 'secretmanager.googleapis.com' in the Google Cloud Console. ` +
        `[Code: ${errCode || 9}] Details: ${errMsg}`
      );
    } else if (errCode === 16 || errCode === 401 || errMsg.includes('UNAUTHENTICATED')) {
      statusCategory = 'unauthenticated';
      console.error(
        `[SECRET MANAGER AUTH ERROR] Unauthenticated request while fetching secret '${secretName}' from GCP project '${projectId}'. ` +
        `[Code: ${errCode || 401}] Details: ${errMsg}`
      );
    } else {
      statusCategory = 'error';
      console.error(
        `[SECRET MANAGER UNEXPECTED ERROR] Failed to fetch secret '${secretName}' from GCP project '${projectId}' (Resolution: ${projectMethod}): ` +
        `[Code: ${errCode || 'UNKNOWN'}] Details: ${errMsg} ${errDetails ? `| Details: ${errDetails}` : ''}`
      );
    }

    const diagnostic: SecretDiagnostic = {
      secretName,
      projectId,
      status: statusCategory,
      errorCode: errCode,
      errorMessage: errMsg
    };

    return { value: '', diagnostic };
  }
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
 * Async resolver for config: checks process.env, then Google Secret Manager (with auto-detected project ID and full logging), then Firestore Gateway Config
 */
export async function getResolvedAirwallexConfig(): Promise<AirwallexConfig> {
  let clientId = (process.env.AIRWALLEX_CLIENT_ID || '').trim();
  let apiKey = (process.env.AIRWALLEX_API_KEY || '').trim();
  let webhookSecret = (process.env.AIRWALLEX_WEBHOOK_SECRET || '').trim();
  let source: AirwallexConfig['source'] = clientId && apiKey ? 'env' : 'none';

  const { projectId, method: projectMethod } = await getGcpProjectId();
  const secretAttempts: Record<string, SecretDiagnostic> = {};

  // 1. Try Google Secret Manager if environment variables are not populated
  if (!clientId || !apiKey || !webhookSecret) {
    try {
      const [clientRes, apiRes, webhookRes] = await Promise.all([
        !clientId ? fetchSecretFromGCP('AIRWALLEX_CLIENT_ID') : Promise.resolve({ value: clientId, diagnostic: { secretName: 'AIRWALLEX_CLIENT_ID', projectId, status: 'found' as const } }),
        !apiKey ? fetchSecretFromGCP('AIRWALLEX_API_KEY') : Promise.resolve({ value: apiKey, diagnostic: { secretName: 'AIRWALLEX_API_KEY', projectId, status: 'found' as const } }),
        !webhookSecret ? fetchSecretFromGCP('AIRWALLEX_WEBHOOK_SECRET') : Promise.resolve({ value: webhookSecret, diagnostic: { secretName: 'AIRWALLEX_WEBHOOK_SECRET', projectId, status: 'found' as const } })
      ]);

      secretAttempts['AIRWALLEX_CLIENT_ID'] = clientRes.diagnostic;
      secretAttempts['AIRWALLEX_API_KEY'] = apiRes.diagnostic;
      secretAttempts['AIRWALLEX_WEBHOOK_SECRET'] = webhookRes.diagnostic;

      if (!clientId && clientRes.value) clientId = clientRes.value;
      if (!apiKey && apiRes.value) apiKey = apiRes.value;
      if (!webhookSecret && webhookRes.value) webhookSecret = webhookRes.value;

      if (clientRes.value || apiRes.value) {
        source = 'secret_manager';
      }
    } catch (e: any) {
      console.error('[AIRWALLEX] Unexpected error during Secret Manager lookup:', e?.message || e);
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
    } catch (e: any) {
      console.warn('[AIRWALLEX] Gateway Config lookup note:', e?.message || e);
    }
  }

  const env: 'demo' | 'prod' = (process.env.AIRWALLEX_ENV || 'demo').toLowerCase() === 'prod' ? 'prod' : 'demo';
  const baseUrl = env === 'prod' ? 'https://api.airwallex.com' : 'https://api-demo.airwallex.com';
  const isConfigured = Boolean(clientId && apiKey);

  // Compute clear diagnostics and human-readable explanation
  let reasonCategory: AirwallexDiagnostics['reasonCategory'] = 'not_configured';
  let statusMessage = '';

  if (isConfigured) {
    reasonCategory = 'configured';
    statusMessage = `Credentials successfully loaded from ${source} (${env.toUpperCase()} environment).`;
  } else {
    // Check if there was a permission denied error
    const hasPermDenied = Object.values(secretAttempts).some(a => a.status === 'permission_denied');
    const hasApiDisabled = Object.values(secretAttempts).some(a => a.status === 'api_disabled');
    const hasProjectUnresolved = projectMethod === 'unresolved' || Object.values(secretAttempts).some(a => a.status === 'project_unresolved');
    const hasNotFound = Object.values(secretAttempts).some(a => a.status === 'not_found');

    if (hasPermDenied) {
      reasonCategory = 'permission_denied';
      statusMessage = `Access denied (403 Permission Denied) reading Secret Manager in GCP project '${projectId}'. Ensure Cloud Run service account has 'roles/secretmanager.secretAccessor'.`;
    } else if (hasApiDisabled) {
      reasonCategory = 'api_disabled';
      statusMessage = `Secret Manager API (secretmanager.googleapis.com) is disabled in GCP project '${projectId}'. Please enable it in the GCP Console.`;
    } else if (hasProjectUnresolved) {
      reasonCategory = 'gcp_project_unresolved';
      statusMessage = 'GCP Project ID could not be resolved from environment variables or Google Cloud runtime metadata.';
    } else if (hasNotFound) {
      reasonCategory = 'secrets_not_found';
      statusMessage = `Secrets AIRWALLEX_CLIENT_ID and/or AIRWALLEX_API_KEY were not found in GCP project '${projectId}' Secret Manager.`;
    } else {
      reasonCategory = 'not_configured';
      statusMessage = 'Airwallex credentials are not configured in environment variables, Secret Manager, or Gateway settings.';
    }
  }

  const diagnostics: AirwallexDiagnostics = {
    gcpProjectId: projectId,
    projectResolutionMethod: projectMethod,
    secretManagerAttempts: secretAttempts,
    statusMessage,
    reasonCategory
  };

  return {
    clientId,
    apiKey,
    webhookSecret,
    env,
    baseUrl,
    isConfigured,
    source,
    diagnostics
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
