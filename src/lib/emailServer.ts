import { fetchSecretFromGCP, getGcpProjectId } from './airwallexServer.js';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  errorCode?: string | number;
}

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'postmark' | 'mailgun' | 'none';
  apiKey: string;
  fromEmail: string;
  mailgunDomain?: string;
  isConfigured: boolean;
  source?: 'env' | 'secret_manager' | 'none';
  diagnostics?: {
    gcpProjectId: string | null;
    statusMessage: string;
    checkedSecrets: string[];
  };
}

let cachedEmailConfig: EmailConfig | null = null;
let lastConfigCheckTime = 0;
const CONFIG_CACHE_TTL = 60 * 1000; // 1 minute cache

/**
 * Resolves Email Provider Configuration from environment variables and Google Secret Manager.
 * Checks in order:
 * 1. RESEND_API_KEY (Resend REST API)
 * 2. SENDGRID_API_KEY (SendGrid REST API)
 * 3. POSTMARK_SERVER_TOKEN (Postmark REST API)
 * 4. MAILGUN_API_KEY (Mailgun REST API)
 * 5. EMAIL_API_KEY (Generic REST API key)
 */
export async function getResolvedEmailConfig(): Promise<EmailConfig> {
  const now = Date.now();
  if (cachedEmailConfig && now - lastConfigCheckTime < CONFIG_CACHE_TTL) {
    return cachedEmailConfig;
  }

  const { projectId } = await getGcpProjectId();
  const checkedSecrets: string[] = [];

  // Check Environment Variables first
  let resendKey = (process.env.RESEND_API_KEY || '').trim();
  let sendgridKey = (process.env.SENDGRID_API_KEY || '').trim();
  let postmarkKey = (process.env.POSTMARK_SERVER_TOKEN || '').trim();
  let mailgunKey = (process.env.MAILGUN_API_KEY || '').trim();
  let mailgunDomain = (process.env.MAILGUN_DOMAIN || '').trim();
  let emailApiKey = (process.env.EMAIL_API_KEY || '').trim();
  let fromEmail = (process.env.EMAIL_FROM || process.env.FROM_EMAIL || '').trim();

  let source: EmailConfig['source'] = 'none';

  if (resendKey || sendgridKey || postmarkKey || mailgunKey || emailApiKey) {
    source = 'env';
  }

  // If no env keys found, check Google Secret Manager
  if (!resendKey && !sendgridKey && !postmarkKey && !mailgunKey && !emailApiKey) {
    try {
      checkedSecrets.push('RESEND_API_KEY', 'SENDGRID_API_KEY', 'POSTMARK_SERVER_TOKEN', 'MAILGUN_API_KEY', 'EMAIL_API_KEY', 'EMAIL_FROM');
      
      const [resendRes, sendgridRes, postmarkRes, mailgunRes, genericRes, fromRes] = await Promise.all([
        fetchSecretFromGCP('RESEND_API_KEY'),
        fetchSecretFromGCP('SENDGRID_API_KEY'),
        fetchSecretFromGCP('POSTMARK_SERVER_TOKEN'),
        fetchSecretFromGCP('MAILGUN_API_KEY'),
        fetchSecretFromGCP('EMAIL_API_KEY'),
        fetchSecretFromGCP('EMAIL_FROM')
      ]);

      if (resendRes.value) resendKey = resendRes.value;
      if (sendgridRes.value) sendgridKey = sendgridRes.value;
      if (postmarkRes.value) postmarkKey = postmarkRes.value;
      if (mailgunRes.value) mailgunKey = mailgunRes.value;
      if (genericRes.value) emailApiKey = genericRes.value;
      if (fromRes.value && !fromEmail) fromEmail = fromRes.value;

      if (resendKey || sendgridKey || postmarkKey || mailgunKey || emailApiKey) {
        source = 'secret_manager';
      }
    } catch (err: any) {
      console.warn('[EMAIL SERVICE] Secret Manager lookup error:', err?.message || err);
    }
  }

  // Determine active provider
  let provider: EmailConfig['provider'] = 'none';
  let apiKey = '';

  if (resendKey) {
    provider = 'resend';
    apiKey = resendKey;
    if (!fromEmail) fromEmail = 'Tidy Corporation <onboarding@resend.dev>';
  } else if (sendgridKey) {
    provider = 'sendgrid';
    apiKey = sendgridKey;
    if (!fromEmail) fromEmail = 'Tidy Corporation <no-reply@tidycorp.co.uk>';
  } else if (postmarkKey) {
    provider = 'postmark';
    apiKey = postmarkKey;
    if (!fromEmail) fromEmail = 'no-reply@tidycorp.co.uk';
  } else if (mailgunKey) {
    provider = 'mailgun';
    apiKey = mailgunKey;
    if (!fromEmail) fromEmail = `Tidy Corporation <no-reply@${mailgunDomain || 'tidycorp.co.uk'}>`;
  } else if (emailApiKey) {
    // If generic key is provided, infer by format (Resend keys start with 're_', SendGrid with 'SG.')
    if (emailApiKey.startsWith('re_')) {
      provider = 'resend';
      apiKey = emailApiKey;
      if (!fromEmail) fromEmail = 'Tidy Corporation <onboarding@resend.dev>';
    } else if (emailApiKey.startsWith('SG.')) {
      provider = 'sendgrid';
      apiKey = emailApiKey;
      if (!fromEmail) fromEmail = 'Tidy Corporation <no-reply@tidycorp.co.uk>';
    } else {
      provider = 'resend';
      apiKey = emailApiKey;
      if (!fromEmail) fromEmail = 'Tidy Corporation <onboarding@resend.dev>';
    }
    source = source || 'secret_manager';
  }

  if (!fromEmail) {
    fromEmail = 'Tidy Corporation <no-reply@tidycorp.co.uk>';
  }

  const isConfigured = Boolean(provider !== 'none' && apiKey);

  const statusMessage = isConfigured
    ? `Configured with ${provider.toUpperCase()} (${source}) - Sender: ${fromEmail}`
    : `No transactional email API key found in Secret Manager or environment variables. Checked: ${checkedSecrets.join(', ')}`;

  const config: EmailConfig = {
    provider,
    apiKey,
    fromEmail,
    mailgunDomain,
    isConfigured,
    source,
    diagnostics: {
      gcpProjectId: projectId,
      statusMessage,
      checkedSecrets
    }
  };

  cachedEmailConfig = config;
  lastConfigCheckTime = now;
  return config;
}

/**
 * Send an email using Resend REST API (https://api.resend.com/emails)
 */
async function sendWithResend(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text
      })
    });

    const body: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = body?.message || body?.error || `Resend HTTP ${res.status}: ${res.statusText}`;
      console.error(`[EMAIL ERROR][Resend] Failed to send email to ${to}:`, errMsg);
      return {
        success: false,
        provider: 'resend',
        errorCode: res.status,
        error: `Resend email delivery failed: ${errMsg}`
      };
    }

    console.log(`[EMAIL SUCCESS][Resend] Message sent to ${to}. MessageId: ${body.id || 'ok'}`);
    return {
      success: true,
      provider: 'resend',
      messageId: body.id
    };
  } catch (err: any) {
    console.error(`[EMAIL NETWORK ERROR][Resend] Connection failed:`, err?.message || err);
    return {
      success: false,
      provider: 'resend',
      error: `Network error connecting to Resend API: ${err?.message || err}`
    };
  }
}

/**
 * Send an email using SendGrid REST API (https://api.sendgrid.com/v3/mail/send)
 */
async function sendWithSendGrid(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  try {
    // SendGrid format: from can be "Name <email>" or an object
    let senderEmail = from;
    let senderName = 'Tidy Corporation';
    const match = from.match(/^(.*?)\s*<(.+?)>$/);
    if (match) {
      senderName = match[1].trim();
      senderEmail = match[2].trim();
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: to }]
        }
      ],
      from: { email: senderEmail, name: senderName },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      let parsedError = errorText;
      try {
        const json = JSON.parse(errorText);
        parsedError = json.errors?.[0]?.message || errorText;
      } catch (_) {}

      console.error(`[EMAIL ERROR][SendGrid] Failed to send email to ${to}:`, parsedError);
      return {
        success: false,
        provider: 'sendgrid',
        errorCode: res.status,
        error: `SendGrid email delivery failed (${res.status}): ${parsedError}`
      };
    }

    const messageId = res.headers.get('x-message-id') || `sg-${Date.now()}`;
    console.log(`[EMAIL SUCCESS][SendGrid] Message sent to ${to}. MessageId: ${messageId}`);
    return {
      success: true,
      provider: 'sendgrid',
      messageId
    };
  } catch (err: any) {
    console.error(`[EMAIL NETWORK ERROR][SendGrid] Connection failed:`, err?.message || err);
    return {
      success: false,
      provider: 'sendgrid',
      error: `Network error connecting to SendGrid API: ${err?.message || err}`
    };
  }
}

/**
 * Send an email using Postmark REST API (https://api.postmarkapp.com/email)
 */
async function sendWithPostmark(
  serverToken: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  try {
    const res = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': serverToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        From: from,
        To: to,
        Subject: subject,
        HtmlBody: html,
        TextBody: text,
        MessageStream: 'outbound'
      })
    });

    const body: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = body?.Message || `Postmark HTTP ${res.status}: ${res.statusText}`;
      console.error(`[EMAIL ERROR][Postmark] Failed to send to ${to}:`, errMsg);
      return {
        success: false,
        provider: 'postmark',
        errorCode: body?.ErrorCode || res.status,
        error: `Postmark email delivery failed: ${errMsg}`
      };
    }

    console.log(`[EMAIL SUCCESS][Postmark] Message sent to ${to}. MessageId: ${body.MessageID}`);
    return {
      success: true,
      provider: 'postmark',
      messageId: body.MessageID
    };
  } catch (err: any) {
    console.error(`[EMAIL NETWORK ERROR][Postmark]:`, err?.message || err);
    return {
      success: false,
      provider: 'postmark',
      error: `Network error connecting to Postmark: ${err?.message || err}`
    };
  }
}

/**
 * Send an email using Mailgun REST API
 */
async function sendWithMailgun(
  apiKey: string,
  domain: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  try {
    const mailDomain = domain || from.split('@')[1]?.replace('>', '') || 'tidycorp.co.uk';
    const form = new URLSearchParams();
    form.append('from', from);
    form.append('to', to);
    form.append('subject', subject);
    form.append('html', html);
    form.append('text', text);

    const authHeader = 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64');
    const res = await fetch(`https://api.mailgun.net/v3/${mailDomain}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form.toString()
    });

    const body: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = body?.message || `Mailgun HTTP ${res.status}`;
      console.error(`[EMAIL ERROR][Mailgun] Failed to send to ${to}:`, errMsg);
      return {
        success: false,
        provider: 'mailgun',
        errorCode: res.status,
        error: `Mailgun email delivery failed: ${errMsg}`
      };
    }

    return {
      success: true,
      provider: 'mailgun',
      messageId: body.id
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'mailgun',
      error: `Network error connecting to Mailgun: ${err?.message || err}`
    };
  }
}

/**
 * Universal Sender Dispatcher
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  const config = await getResolvedEmailConfig();

  if (!config.isConfigured || !config.apiKey) {
    const errorMsg =
      `Transactional email provider is not configured. ` +
      `Please add RESEND_API_KEY or SENDGRID_API_KEY to Google Secret Manager in your GCP project or server environment variables. ` +
      `(${config.diagnostics?.statusMessage})`;

    console.error(`[EMAIL CONFIG ERROR] Cannot deliver email to ${to}:`, errorMsg);
    return {
      success: false,
      provider: 'none',
      error: errorMsg
    };
  }

  console.log(`[EMAIL SENDING] Dispatching email to ${to} via ${config.provider.toUpperCase()} from ${config.fromEmail}...`);

  switch (config.provider) {
    case 'resend':
      return await sendWithResend(config.apiKey, config.fromEmail, to, subject, html, text);
    case 'sendgrid':
      return await sendWithSendGrid(config.apiKey, config.fromEmail, to, subject, html, text);
    case 'postmark':
      return await sendWithPostmark(config.apiKey, config.fromEmail, to, subject, html, text);
    case 'mailgun':
      return await sendWithMailgun(config.apiKey, config.mailgunDomain || '', config.fromEmail, to, subject, html, text);
    default:
      return {
        success: false,
        error: 'Unsupported email provider configured.'
      };
  }
}

// ============================================================================
// EMAIL TEMPLATES (Responsive, High-Contrast, Brand-Aligned)
// ============================================================================

function generateEmailWrapper(headerTitle: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b1120;
      padding: 40px 16px;
    }
    .main-card {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #0057B8 0%, #003670 100%);
      padding: 32px 28px;
      text-align: center;
    }
    .logo-badge {
      display: inline-block;
      background-color: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 6px 14px;
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .header-title {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .content-body {
      padding: 36px 32px;
      line-height: 1.6;
      font-size: 15px;
      color: #334155;
    }
    .greeting {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .code-box {
      background: #f1f5f9;
      border: 2px dashed #0057B8;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .code-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .verification-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 8px;
      color: #0057B8;
      margin: 0;
      line-height: 1;
    }
    .badge-expiry {
      display: inline-block;
      margin-top: 10px;
      background-color: #fee2e2;
      color: #991b1b;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
    }
    .info-card {
      background-color: #f8fafc;
      border-left: 4px solid #FF7F00;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
      font-size: 13px;
      color: #475569;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .footer strong {
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <div class="header">
        <div class="logo-badge">TIDY ESCROW PLATFORM</div>
        <h1 class="header-title">${headerTitle}</h1>
      </div>
      <div class="content-body">
        ${contentHtml}
      </div>
      <div class="footer">
        <p><strong>Tidy Corporation Limited</strong> • UK Protected Renovation &amp; Milestone Escrow</p>
        <p>This is an automated security message. Please do not reply to this email. For assistance, contact support@tidycorp.co.uk</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * 1. Registration Verification Code Email
 */
export async function sendRegistrationVerificationEmail(
  to: string,
  name: string,
  code: string
): Promise<EmailSendResult> {
  const safeName = name ? name.trim() : 'Member';
  const subject = `Verify your Tidy Corporation account: ${code}`;

  const htmlContent = `
    <h2 class="greeting">Welcome to Tidy Corporation, ${safeName}!</h2>
    <p>Thank you for creating an account with Tidy Corporation — the secure milestone escrow platform for UK renovations and trade services.</p>
    <p>To complete your registration and activate your portal access, please verify your email address by entering the 6-digit confirmation code below:</p>
    
    <div class="code-box">
      <div class="code-label">Your Verification Code</div>
      <div class="verification-code">${code}</div>
      <div class="badge-expiry">Valid for 24 hours</div>
    </div>

    <div class="info-card">
      <strong>Security Notice:</strong> Never share this code with anyone. Tidy Corporation staff will never ask for your verification code by phone, chat, or email.
    </div>

    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
      If you did not register for an account on the Tidy Corporation platform, you can safely ignore this email.
    </p>
  `;

  const html = generateEmailWrapper('Email Confirmation', htmlContent);

  const text = `Welcome to Tidy Corporation, ${safeName}!

Thank you for registering. To confirm your email address and activate your account, please enter this 6-digit verification code:

${code}

This code is valid for 24 hours.

Security Reminder: Never share your verification code with anyone.
If you did not create this account, you can safely ignore this email.

Tidy Corporation Limited
https://tidycorp.co.uk
`;

  return await sendEmail(to, subject, html, text);
}

/**
 * 2. Resend Verification Code Email
 */
export async function sendResendVerificationEmail(
  to: string,
  name: string,
  code: string
): Promise<EmailSendResult> {
  const safeName = name ? name.trim() : 'Member';
  const subject = `Your new verification code: ${code}`;

  const htmlContent = `
    <h2 class="greeting">Hello ${safeName},</h2>
    <p>You recently requested a new email verification code for your Tidy Corporation account.</p>
    <p>Please enter the following 6-digit code to verify your email address and unlock your portal access:</p>
    
    <div class="code-box">
      <div class="code-label">New Verification Code</div>
      <div class="verification-code">${code}</div>
      <div class="badge-expiry">Valid for 24 hours</div>
    </div>

    <div class="info-card">
      <strong>Security Notice:</strong> This code replaces any previous verification codes sent to you. If you did not request this, please ensure your email account is secure.
    </div>
  `;

  const html = generateEmailWrapper('New Verification Code', htmlContent);

  const text = `Hello ${safeName},

You requested a new verification code for your Tidy Corporation account:

${code}

This code is valid for 24 hours.

If you did not request a new code, please check your account security.

Tidy Corporation Limited
`;

  return await sendEmail(to, subject, html, text);
}

/**
 * 3. Password Reset OTP Email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  otp: string
): Promise<EmailSendResult> {
  const safeName = name ? name.trim() : 'Member';
  const subject = `Your Tidy Corporation password reset code: ${otp}`;

  const htmlContent = `
    <h2 class="greeting">Hello ${safeName},</h2>
    <p>We received a request to reset the password for your Tidy Corporation account (<strong>${to}</strong>).</p>
    <p>Use the 6-digit recovery code below to verify your identity and set a new password:</p>
    
    <div class="code-box">
      <div class="code-label">Password Recovery Code</div>
      <div class="verification-code">${otp}</div>
      <div class="badge-expiry">Valid for 60 minutes</div>
    </div>

    <div class="info-card">
      <strong>Important Security Alert:</strong> If you did not request a password reset, someone may be attempting to access your account. You can disregard this email — your existing password remains unchanged and safe.
    </div>

    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
      Do not forward or give this recovery code to anyone, including Tidy Corporation support agents.
    </p>
  `;

  const html = generateEmailWrapper('Password Reset Request', htmlContent);

  const text = `Hello ${safeName},

We received a request to reset your Tidy Corporation password.

Your 6-digit recovery code is:

${otp}

This recovery code is valid for 60 minutes.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Tidy Corporation Limited
`;

  return await sendEmail(to, subject, html, text);
}
