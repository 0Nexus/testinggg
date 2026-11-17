import { PartnerStackAttribution } from '../types';

const STORAGE_KEY = 'tidy_ps_attribution';
const ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90-day cookie/attribution window

declare global {
  interface Window {
    growsumo?: {
      data?: Record<string, any>;
      createSignup?: (callback?: () => void) => void;
    };
    growsumoInit?: () => void;
    partnerstack?: any;
  }
}

/**
 * Checks whether the user has consented to Trade Partner & Attribution cookies (Category 4)
 * or if no consent preference has explicitly opted out of marketing attribution.
 */
export function hasPartnerAttributionConsent(): boolean {
  try {
    const stored = localStorage.getItem('tidy_cookie_consent');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return Boolean(parsed?.marketing);
  } catch {
    return false;
  }
}

/**
 * Captures PartnerStack URL referral parameters (?pscd=, ?ps_partner_key=, ?gs=, ?ref=)
 * on page load and persists them in localStorage. Also pings /api/partnerstack/track-click.
 */
export function capturePartnerStackReferralFromUrl(): PartnerStackAttribution | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const pscd = params.get('pscd') || params.get('gs') || undefined;
    const partnerKey = params.get('ps_partner_key') || params.get('partner_key') || undefined;
    const referralCode = params.get('ref') || pscd || undefined;

    if (!pscd && !partnerKey && !referralCode) {
      return getStoredPartnerStackAttribution();
    }

    const attribution: PartnerStackAttribution = {
      pscd: pscd || referralCode,
      partnerKey: partnerKey || pscd || referralCode,
      referralCode: referralCode || pscd || partnerKey,
      source: params.get('utm_source') || 'partnerstack',
      landingUrl: window.location.pathname + window.location.search,
      capturedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));

    // Record referral click on backend
    fetch('/api/partnerstack/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerKey: attribution.partnerKey,
        pscd: attribution.pscd,
        referralCode: attribution.referralCode,
        landingUrl: attribution.landingUrl
      })
    }).catch(() => {
      // Non-blocking click telemetry
    });

    return attribution;
  } catch {
    return null;
  }
}

/**
 * Retrieves stored PartnerStack attribution if within the 90-day attribution window
 */
export function getStoredPartnerStackAttribution(): PartnerStackAttribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PartnerStackAttribution;
    if (!parsed?.capturedAt) return null;

    const ageMs = Date.now() - new Date(parsed.capturedAt).getTime();
    if (ageMs > ATTRIBUTION_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clears stored attribution manually if needed
 */
export function clearStoredPartnerStackAttribution() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Dynamically initializes PartnerStackJS (GrowSumo) snippet in document.head
 * when a Public Key is configured AND the user has granted marketing/partner attribution consent.
 */
export function initPartnerStackJS(publicKey: string, forceConsentCheck: boolean = true) {
  if (!publicKey || !publicKey.trim()) return;
  if (forceConsentCheck && !hasPartnerAttributionConsent()) return;

  const existingScript = document.getElementById('partnerstack-growsumo-js');
  if (existingScript) return;

  try {
    (function (g: any, r: Document, s: string) {
      g.growsumo =
        g.growsumo ||
        function (...args: any[]) {
          (g.growsumo.q = g.growsumo.q || []).push(args);
        };
      const script = r.createElement('script') as HTMLScriptElement;
      script.id = 'partnerstack-growsumo-js';
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://js.partnerstack.com/v1/';
      script.setAttribute('data-public-key', s);
      script.onerror = () => {
        // Silently ignore if blocked by privacy extension
      };
      const firstScript = r.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        r.head.appendChild(script);
      }
    })(window, document, publicKey.trim());
  } catch {
    // Non-blocking script injection
  }
}

/**
 * Fires PartnerStackJS client-side signup attribution (growsumo.createSignup) when available
 */
export function notifyPartnerStackClientSignup(params: {
  email: string;
  name: string;
  customerKey?: string;
}) {
  try {
    if (typeof window !== 'undefined' && window.growsumo) {
      window.growsumo.data = window.growsumo.data || {};
      window.growsumo.data.email = params.email;
      window.growsumo.data.name = params.name;
      window.growsumo.data.customer_key = params.customerKey || params.email;
      if (typeof window.growsumo.createSignup === 'function') {
        window.growsumo.createSignup();
      }
    }
  } catch {
    // Safe fallback to server-side PartnerStack S2S API
  }
}
