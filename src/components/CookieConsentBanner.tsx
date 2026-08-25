import React, { useState, useEffect } from 'react';
import { Shield, Cookie, Check, X, Settings2, Lock, Sparkles, ExternalLink, ChevronRight, Info } from 'lucide-react';
import { CookieConsentPreferences } from '../types';

interface CookieConsentBannerProps {
  onConsentUpdated?: (preferences: CookieConsentPreferences) => void;
  forceOpenModal?: boolean;
  onCloseModal?: () => void;
}

const DEFAULT_PREFERENCES: CookieConsentPreferences = {
  strictlyNecessary: true,
  functional: true,
  analytics: true,
  marketing: false,
  consentedAt: new Date().toISOString(),
  consentVersion: '2026.1'
};

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onConsentUpdated,
  forceOpenModal = false,
  onCloseModal
}) => {
  const [hasStoredConsent, setHasStoredConsent] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load existing consent on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tidy_cookie_consent');
      if (stored) {
        const parsed = JSON.parse(stored) as CookieConsentPreferences;
        setPreferences(parsed);
        setHasStoredConsent(true);
      } else {
        setHasStoredConsent(false);
      }
    } catch (e) {
      setHasStoredConsent(false);
    }
  }, []);

  // Respond to forceOpenModal from Navbar/Footer
  useEffect(() => {
    if (forceOpenModal) {
      setIsModalOpen(true);
    }
  }, [forceOpenModal]);

  const saveConsent = async (newPrefs: CookieConsentPreferences) => {
    setIsSaving(true);
    const finalized: CookieConsentPreferences = {
      ...newPrefs,
      strictlyNecessary: true,
      consentedAt: new Date().toISOString(),
      consentVersion: '2026.1'
    };

    try {
      localStorage.setItem('tidy_cookie_consent', JSON.stringify(finalized));
      setPreferences(finalized);
      setHasStoredConsent(true);
      setIsModalOpen(false);

      const token = localStorage.getItem('tidy_secure_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/cookies/consent', {
        method: 'POST',
        headers,
        body: JSON.stringify(finalized)
      });

      if (onConsentUpdated) {
        onConsentUpdated(finalized);
      }

      setToastMessage('Cookie preferences saved successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to sync cookie consent to server:', err);
    } finally {
      setIsSaving(false);
      if (onCloseModal) {
        onCloseModal();
      }
    }
  };

  const handleAcceptAll = () => {
    saveConsent({
      strictlyNecessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      consentedAt: new Date().toISOString(),
      consentVersion: '2026.1'
    });
  };

  const handleAcceptEssentialOnly = () => {
    saveConsent({
      strictlyNecessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      consentedAt: new Date().toISOString(),
      consentVersion: '2026.1'
    });
  };

  const handleSaveCustomPreferences = () => {
    saveConsent(preferences);
  };

  return (
    <>
      {/* 1. FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 2. INITIAL FLOATING BANNER (Shown if consent not recorded yet) */}
      {!hasStoredConsent && !isModalOpen && (
        <div
          id="cookie-consent-banner"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-6"
        >
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#0057B8]/20 border border-blue-500/30 text-cyan-300 shrink-0 mt-0.5">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center space-x-2">
                  <span>Cookie &amp; Privacy Notice</span>
                </h4>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  UK PECR / GDPR
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                We use strictly necessary cookies to power Airwallex (UK) Ltd FCA-compliant payment security and escrow cryptographic integrity. With your consent, we also utilize functional &amp; analytics cookies to refine AI trade estimations.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
            <button
              id="cookie-accept-all-btn"
              onClick={handleAcceptAll}
              disabled={isSaving}
              className="w-full sm:w-auto flex-1 bg-[#0057B8] hover:bg-blue-600 text-white font-bold py-2 px-3.5 rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              Accept All
            </button>
            <button
              id="cookie-essential-only-btn"
              onClick={handleAcceptEssentialOnly}
              disabled={isSaving}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3.5 rounded-xl text-xs transition-all active:scale-95"
            >
              Essential Only
            </button>
            <button
              id="cookie-customize-btn"
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto text-slate-400 hover:text-cyan-300 text-xs font-semibold py-2 px-2 transition-colors flex items-center justify-center space-x-1"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Customize</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. GRANULAR PREFERENCES MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            id="cookie-preferences-modal"
            className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-[#0057B8]/20 border border-blue-500/30 text-cyan-300">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">UK Privacy &amp; Cookie Preferences</h3>
                  <p className="text-xs text-slate-400">
                    Compliant with Data Protection Act 2018 &amp; Privacy and Electronic Communications Regulations (PECR)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseModal) onCloseModal();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              <p className="text-slate-300 leading-relaxed">
                Tidy Corporation Ltd respects your statutory privacy rights. You may adjust your cookie preferences below. Strictly necessary cookies cannot be disabled as they maintain payment state with Airwallex, token safety, and dispute escrow evidence.
              </p>

              {/* 1. Strictly Necessary */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <span className="font-black text-sm text-white">1. Strictly Necessary Cookies</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                      REQUIRED
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-not-allowed opacity-80"
                  />
                </div>
                <p className="text-slate-400">
                  Enables cryptographic Airwallex tokenization (FCA Firm Ref 901001), 3D Secure 2.0 liability shifts, authenticated session integrity, and tamper-evident escrow logging.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Retention: Session / 30 Days • Providers: Tidy Corp, Airwallex UK, Google Cloud
                </div>
              </div>

              {/* 2. Functional & Experience */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <span className="font-black text-sm text-white">2. Functional &amp; Workflow Cookies</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={e => setPreferences(prev => ({ ...prev, functional: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0057B8]"></div>
                  </label>
                </div>
                <p className="text-slate-400">
                  Remembers your Day/Night UI theme, pre-filled quotation drafts, trade merchant preference (Travis Perkins, Screwfix, etc.), and localized GBP formatting.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Retention: 1 Year • Providers: Tidy Corp Local Storage
                </div>
              </div>

              {/* 3. Performance & Latency Analytics */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings2 className="h-4 w-4 text-blue-400" />
                    <span className="font-black text-sm text-white">3. Performance &amp; Payment Telemetry</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={e => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0057B8]"></div>
                  </label>
                </div>
                <p className="text-slate-400">
                  Measures milestone clearing speed, BACS payout latency metrics, and Gemini model compute response times to prevent checkout friction.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Retention: 90 Days • Providers: Anonymized Internal Telemetry
                </div>
              </div>

              {/* 4. Marketing & Contractor Network */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-amber-400" />
                    <span className="font-black text-sm text-white">4. Trade Partner &amp; Warranty Attribution</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={e => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0057B8]"></div>
                  </label>
                </div>
                <p className="text-slate-400">
                  Tracks contractor invite campaigns, trade guild membership verification, and statutory Awaab's law certificate delivery.
                </p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Retention: 180 Days • Providers: Tidy Corp Dispatch Engine
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400">
                You can change these settings anytime via the footer.
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={handleAcceptAll}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none bg-[#0057B8] hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md"
                >
                  Accept All
                </button>
                <button
                  onClick={handleSaveCustomPreferences}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-md"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
