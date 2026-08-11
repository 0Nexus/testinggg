import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Lock, CheckCircle2, AlertTriangle, Sparkles, Smartphone, Volume2 } from 'lucide-react';

interface StructuredFrictionHoldButtonProps {
  amount: number;
  label: string;
  reason?: string;
  onConfirm: () => Promise<void> | void;
  className?: string;
}

export const StructuredFrictionHoldButton: React.FC<StructuredFrictionHoldButtonProps> = ({
  amount,
  label,
  reason = 'AI Vision Engine verified 4 site photos, milestone scope completion, and statutory building safety compliance.',
  onConfirm,
  className = ''
}) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricState, setBiometricState] = useState<'scanning' | 'success' | 'failed'>('scanning');
  const [isCompleted, setIsCompleted] = useState(false);

  const holdIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const isHighValue = amount >= 1000;

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted || showBiometricModal) return;
    
    // Non-high value payments confirm directly
    if (!isHighValue) {
      handleTriggerConfirmation();
      return;
    }

    setIsHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      setProgress(pct);

      if (elapsed >= 3000) {
        clearInterval(holdIntervalRef.current);
        setIsHolding(false);
        setProgress(100);
        triggerBiometricVerification();
      }
    }, 30);
  };

  const stopHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    if (isHolding && progress < 100) {
      setIsHolding(false);
      setProgress(0);
      // Optional slight fail vibration
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
    }
  };

  const triggerBiometricVerification = () => {
    setShowBiometricModal(true);
    setBiometricState('scanning');

    // Simulate haptic vibration click for reaching 3s
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([400]);
    }

    setTimeout(() => {
      setBiometricState('success');
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }

      setTimeout(async () => {
        setShowBiometricModal(false);
        setIsCompleted(true);
        await onConfirm();
      }, 1000);
    }, 1800);
  };

  const handleTriggerConfirmation = async () => {
    setIsCompleted(true);
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([200]);
    }
    await onConfirm();
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  return (
    <div className={`space-y-2 text-left ${className}`}>
      {/* No Magic Plain English Explanation Pane */}
      {isHighValue && (
        <div className="bg-slate-900/90 text-slate-100 p-3 rounded-xl border border-amber-500/30 text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[#FF5F15] font-black uppercase text-[10px] tracking-wider">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Structured Friction Protocol Enabled (&gt;£1,000)</span>
            </span>
            <span className="bg-[#FF5F15]/20 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">
              3s Hold + FaceID/Fingerprint
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            <strong>No Magic AI Transparency:</strong> {reason}
          </p>
        </div>
      )}

      {/* Action Button Container */}
      <div className="relative inline-block w-full">
        {isHighValue ? (
          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={startHold}
            onTouchEnd={stopHold}
            disabled={isCompleted}
            className={`w-full relative overflow-hidden font-black text-xs sm:text-sm py-3 px-4 rounded-xl text-white shadow-lg transition-all select-none flex items-center justify-center space-x-2 ${
              isCompleted
                ? 'bg-emerald-600 cursor-default'
                : 'bg-[#FF5F15] hover:bg-orange-600 active:scale-[0.99]'
            }`}
          >
            {/* Visual Circular / Horizontal Progress Bar fill overlay */}
            {isHolding && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-black/30 transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            )}

            <div className="relative z-10 flex items-center space-x-2">
              <Fingerprint className={`h-4 w-4 ${isHolding ? 'animate-pulse text-amber-300' : 'text-white'}`} />
              <span>
                {isCompleted
                  ? 'Payment Release Verified ✓'
                  : isHolding
                  ? `Hold Continuously... ${Math.round((progress / 100) * 3)}s`
                  : `Press & Hold 3s to Release (£${amount.toLocaleString()})`}
              </span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleTriggerConfirmation}
            disabled={isCompleted}
            className={`w-full font-bold text-xs py-2.5 px-4 rounded-xl text-white transition-all shadow flex items-center justify-center space-x-2 ${
              isCompleted ? 'bg-emerald-600' : 'bg-[#0057B8] hover:bg-blue-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isCompleted ? 'Payment Released' : label}</span>
          </button>
        )}
      </div>

      {/* Simulated Biometric Modal Scanner Overlay */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl text-slate-100">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#FF5F15]/20 border-2 border-[#FF5F15] flex items-center justify-center relative">
              <Fingerprint className={`h-10 w-10 text-[#FF5F15] ${biometricState === 'scanning' ? 'animate-pulse' : ''}`} />
              {biometricState === 'success' && (
                <div className="absolute inset-0 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-white">
                {biometricState === 'scanning' ? 'Biometric Touch ID / Face ID' : 'Transfer Approved'}
              </h3>
              <p className="text-xs text-slate-300">
                {biometricState === 'scanning'
                  ? `Authenticating transfer of £${amount.toLocaleString()} for project escrow release`
                  : 'Fingerprint matched. Physical haptic confirmation triggered.'}
              </p>
            </div>

            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-left text-[11px] space-y-1">
              <div className="text-slate-400 font-medium">Authorised Account:</div>
              <div className="font-bold text-slate-200 flex items-center justify-between">
                <span>Tidy Secure Escrow Vault</span>
                <span className="text-emerald-400 font-mono">FCA Compliant</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400">
              <Smartphone className="h-3.5 w-3.5 text-amber-400" />
              <span>400ms Haptic Pulse Generated</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
