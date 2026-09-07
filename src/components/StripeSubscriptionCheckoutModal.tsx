import React, { useState, useEffect, useRef } from 'react';
import { User, UserSubscription } from '../types';
import {
  ShieldCheck,
  Building2,
  CreditCard,
  Lock,
  ArrowRight,
  CheckCircle2,
  Download,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Layers,
  Receipt,
  FileCheck
} from 'lucide-react';

export interface StripeCheckoutItem {
  type: 'plan' | 'care_package' | 'credits' | 'escrow_pass';
  id: string;
  name: string;
  priceGBP: number;
  annualPriceGBP?: number;
  monthlyCredits?: number;
  billingInterval?: 'monthly' | 'annual';
  description?: string;
  features?: string[];
  badge?: string;
}

interface StripeSubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StripeCheckoutItem | null;
  currentUser: User | null;
  onSubscriptionSuccess: (updatedSub: UserSubscription, receipt: any) => void;
}

export const StripeSubscriptionCheckoutModal: React.FC<StripeSubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  item,
  currentUser,
  onSubscriptionSuccess
}) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
    item?.billingInterval || (item?.annualPriceGBP && item.annualPriceGBP > 0 ? 'annual' : 'monthly')
  );

  // Customer & Invoice Fields
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Arthur Vance');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'arthur.vance@tradecorp.co.uk');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || 'Vance Construction & Maintenance Ltd');
  const [vatNumber, setVatNumber] = useState('GB 938 4821 00');
  const [billingAddress, setBillingAddress] = useState('14 Berkeley Square, Mayfair, London');
  const [postcode, setPostcode] = useState('W1J 6BQ');

  // Checkout Flow Stages: 'configure' | 'awaiting_stripe' | 'settled'
  const [flowStage, setFlowStage] = useState<'configure' | 'awaiting_stripe' | 'settled'>('configure');

  // State & Loading
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    checkoutUrl: string;
    isLive?: boolean;
    publishableKey?: string;
  } | null>(null);
  const [settledReceipt, setSettledReceipt] = useState<any>(null);
  const [showArchFlow, setShowArchFlow] = useState(false);

  // Polling ref to clear timer when component unmounts
  const pollTimerRef = useRef<any>(null);

  // Synchronize state on open
  useEffect(() => {
    if (item && isOpen) {
      setErrorMessage(null);
      setSettledReceipt(null);
      setFlowStage('configure');
      setActiveSession(null);
      setBillingInterval(
        item.billingInterval || (item.annualPriceGBP && item.annualPriceGBP > 0 ? 'annual' : 'monthly')
      );
      if (currentUser?.name) setCustomerName(currentUser.name);
      if (currentUser?.email) setCustomerEmail(currentUser.email);
      if (currentUser?.companyName) setCompanyName(currentUser.companyName);
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [item, isOpen, currentUser]);

  // Pricing calculations
  const calculatePricing = () => {
    if (!item) return { base: 0, vat: 0, total: 0, savingsAnnual: 0 };
    let base = item.priceGBP;
    if (billingInterval === 'annual' && item.annualPriceGBP) {
      base = item.annualPriceGBP;
    }
    const vat = base * 0.20; // 20% Standard UK VAT
    const total = base + vat;

    const monthlyEquivalentTotal = item.priceGBP * 12;
    const savingsAnnual = item.annualPriceGBP ? Math.max(0, monthlyEquivalentTotal - item.annualPriceGBP) : 0;

    return { base, vat, total, savingsAnnual };
  };

  const { base, vat, total, savingsAnnual } = calculatePricing();

  // Create Stripe Hosted Checkout Session and Launch
  const handleLaunchStripeCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!item) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStatus('Connecting to Stripe Payments UK API & creating Hosted Checkout...');

    try {
      const token = localStorage.getItem('tidy_secure_token');
      const origin = window.location.origin;

      const res = await fetch('/api/stripe/create-subscription-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          planId: item.id,
          itemId: item.id,
          itemType: item.type,
          billingInterval,
          amount: total,
          currency: 'GBP',
          customerEmail,
          customerName,
          companyName,
          companyVatNumber: vatNumber,
          billingAddress: `${billingAddress}, ${postcode}`,
          successUrl: `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/?payment_status=cancelled`
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize Stripe Hosted Checkout.');
      }

      const checkoutUrl = data.checkoutUrl;
      const sessionId = data.sessionId || data.checkoutId || data.paymentIntentId;

      if (!checkoutUrl) {
        throw new Error('No Stripe Hosted Checkout URL returned by server.');
      }

      setActiveSession({
        id: sessionId,
        checkoutUrl,
        isLive: data.isLive,
        publishableKey: data.publishableKey
      });

      setIsProcessing(false);
      setFlowStage('awaiting_stripe');

      // Attempt to open Stripe Checkout in a new window/tab
      const popup = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Pop-up was blocked or in restrictive iframe; the user has prominent buttons to open or redirect
        console.log('Window popup was blocked or opened in background. Direct link available.');
      }

      // Start polling for payment verification
      startPollingForSession(sessionId);
    } catch (err: any) {
      console.error('[STRIPE HOSTED CHECKOUT ERROR]:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'Failed to launch Stripe Hosted Checkout.');
    }
  };

  // Verify status of Stripe Checkout Session
  const verifySessionStatus = async (sessionId: string, silent = false) => {
    if (!sessionId) return false;
    if (!silent) setIsVerifying(true);

    try {
      const res = await fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();

      if (data.verified && data.paymentStatus === 'paid') {
        // Payment succeeded and DB provisioned!
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }

        setSettledReceipt(data.receipt);
        setFlowStage('settled');
        setIsVerifying(false);

        if (data.subscription) {
          onSubscriptionSuccess(data.subscription, data.receipt);
        }
        return true;
      } else {
        if (!silent) {
          setProcessingStatus(data.message || 'Payment not yet confirmed by Stripe. Please complete the steps on Stripe.');
        }
      }
    } catch (err: any) {
      console.error('[VERIFY STATUS ERROR]:', err);
      if (!silent) {
        setErrorMessage(err.message || 'Error checking session status.');
      }
    } finally {
      if (!silent) setIsVerifying(false);
    }
    return false;
  };

  // Start polling every 3.5 seconds
  const startPollingForSession = (sessionId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    let checkCount = 0;
    pollTimerRef.current = setInterval(async () => {
      checkCount++;
      const completed = await verifySessionStatus(sessionId, true);
      if (completed || checkCount > 120) {
        // Stop after 7 minutes of polling
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }, 3500);
  };

  const handleDownloadInvoice = () => {
    if (!item) return;
    const invoiceContent = `========================================================================
TIDY CORPORATION LTD & STRIPE UK SUBSCRIPTION TAX INVOICE
FCA Authorized EMI: Stripe Payments UK Limited (FRN: 900461)
========================================================================
Invoice Reference: ${settledReceipt?.transactionId || 'STRIPE-TX-' + Math.floor(1000 + Math.random() * 9000)}
Gateway Reference: ${settledReceipt?.gatewayReference || activeSession?.id || 'cs_stripe_live'}
Date & Time: ${new Date(settledReceipt?.date || Date.now()).toUTCString()}
Status: ${settledReceipt?.status || 'Paid & Active'}

BILL TO:
Customer: ${settledReceipt?.customerName || customerName}
Company: ${settledReceipt?.companyName || companyName || 'N/A'}
Email: ${settledReceipt?.customerEmail || customerEmail}
VAT Reg No: ${settledReceipt?.companyVatNumber || vatNumber || 'N/A'}
Address: ${settledReceipt?.billingAddress || `${billingAddress}, ${postcode}`}

ITEM SPECIFICATION:
Item / Subscription: ${item.name} (${item.type.toUpperCase()})
Billing Schedule: ${billingInterval.toUpperCase()} (${billingInterval === 'annual' ? '12 Months Pre-Paid' : 'Monthly Recurring'})
Payment Method: Stripe Hosted Checkout (Cards / Apple Pay / Google Pay / BACS)
Cleared Via: Stripe Payments UK Limited (FCA Authorized EMI)

FINANCIAL BREAKDOWN:
Subtotal (Excl. VAT): £${settledReceipt?.subtotal?.toFixed(2) || base.toFixed(2)} GBP
UK VAT (20.0% Standard): £${settledReceipt?.vatAmount?.toFixed(2) || vat.toFixed(2)} GBP
------------------------------------------------------------------------
TOTAL PAID VIA STRIPE: £${settledReceipt?.amount?.toFixed(2) || total.toFixed(2)} GBP
========================================================================
Thank you for partnering with Tidy Corporation Ltd. All client funds held in ring-fenced escrow accounts.
`;
    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TidyCorp_Stripe_Tax_Invoice_${settledReceipt?.transactionId || 'Receipt'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !item) return null;

  return (
    <div id="stripe-checkout-modal" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 font-sans">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#635BFF]/30 via-slate-900 to-[#0A2540] p-5 sm:p-6 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-[#635BFF] flex items-center justify-center text-white shadow-lg font-black text-base tracking-wide">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white tracking-tight">Stripe Hosted Checkout</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold uppercase">
                  FCA Regulated #900461
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold uppercase">
                  PCI Level 1
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Stripe Checkout • Apple Pay, Google Pay, Cards &amp; UK BACS Direct Debit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowArchFlow(!showArchFlow)}
              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 hover:bg-indigo-900 transition flex items-center space-x-1 cursor-pointer"
              title="Toggle Architecture Diagram"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>{showArchFlow ? 'Hide Flow' : 'View Flow'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full transition-all cursor-pointer"
              title="Close Checkout"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Architecture Flow Banner */}
        {showArchFlow && (
          <div className="bg-slate-950/90 border-b border-slate-800 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Stripe Hosted Checkout Architecture Flow
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 text-slate-300">
                <div className="font-bold text-indigo-400">1. Plan Selection</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Select plan &amp; interval</div>
              </div>
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 text-slate-300">
                <div className="font-bold text-indigo-400">2. Stripe Checkout</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Redirect to checkout.stripe.com</div>
              </div>
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 text-slate-300">
                <div className="font-bold text-indigo-400">3. 3DS &amp; Biometric</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Apple Pay, Google Pay, Cards</div>
              </div>
              <div className="p-2.5 rounded-xl border bg-slate-900/80 border-slate-800 text-slate-300">
                <div className="font-bold text-emerald-400">4. Auto-Activation</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Instant provision &amp; VAT invoice</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* STAGE 3: SETTLED & VERIFIED RECEIPT                                       */}
          {/* ========================================================================= */}
          {flowStage === 'settled' && settledReceipt && (
            <div className="space-y-6 text-center py-4">
              <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white">Payment Authorized &amp; Subscription Active!</h4>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your payment of <strong className="text-white">£{settledReceipt.amount?.toFixed(2)} GBP</strong> was verified and settled via Stripe Payments UK Limited.
                </p>
              </div>

              {/* Receipt Summary Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="text-white font-bold">{settledReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Stripe Ref:</span>
                  <span className="text-indigo-400 truncate max-w-[200px]">{settledReceipt.gatewayReference}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Plan / Item:</span>
                  <span className="text-white font-bold">{item.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Gateway:</span>
                  <span className="text-emerald-400">Stripe Payments UK Limited</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold">
                  <span className="text-slate-300">Total Charged:</span>
                  <span className="text-emerald-400">£{settledReceipt.amount?.toFixed(2)} GBP</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download VAT Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#534be0] text-white font-black text-xs transition shadow-lg cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: AWAITING PAYMENT ON STRIPE HOSTED CHECKOUT                       */}
          {/* ========================================================================= */}
          {flowStage === 'awaiting_stripe' && activeSession && (
            <div className="space-y-6 text-center py-6">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-[#635BFF]/20 animate-ping" />
                <div className="relative h-20 w-20 rounded-full bg-[#635BFF]/30 border-2 border-[#635BFF] flex items-center justify-center text-white">
                  <RefreshCw className="h-8 w-8 text-indigo-300 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white">Stripe Hosted Checkout Open</h4>
                <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Please complete your card, Apple Pay, Google Pay, or BACS payment on Stripe's secure portal. We will automatically detect your completion and activate your plan.
                </p>
              </div>

              {/* Action buttons to open / redirect */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 max-w-lg mx-auto space-y-4 text-left">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Stripe Session:</span>
                  <span className="text-indigo-400 truncate max-w-[220px]">{activeSession.id}</span>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row gap-2">
                  <a
                    href={activeSession.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-[#635BFF] hover:bg-[#534be0] text-white font-black text-xs flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer"
                  >
                    <span>Open Stripe Portal</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => { window.location.href = activeSession.checkoutUrl; }}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <span>Redirect Here</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status & Manual Check */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center space-x-2 text-xs text-indigo-300 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Listening for Stripe completion webhook / event...</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => verifySessionStatus(activeSession.id)}
                    disabled={isVerifying}
                    className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition flex items-center space-x-2 cursor-pointer"
                  >
                    {isVerifying ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    <span>I Have Completed Payment - Verify Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlowStage('configure')}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Back to Plan Options
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs max-w-md mx-auto">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 1: PLAN CONFIGURATION & LAUNCH STRIPE CHECKOUT                      */}
          {/* ========================================================================= */}
          {flowStage === 'configure' && (
            <form onSubmit={handleLaunchStripeCheckout} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center space-x-3 text-rose-200 text-xs">
                  <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Plan Overview & Financial Breakdown */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">
                        Subscription Selection
                      </span>
                      {item.badge && (
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-white">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>

                    {/* Annual vs Monthly Interval Switch */}
                    {item.annualPriceGBP && item.annualPriceGBP > 0 && (
                      <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-2 gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setBillingInterval('monthly')}
                          className={`py-1.5 rounded-lg font-bold transition text-center cursor-pointer ${
                            billingInterval === 'monthly'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Monthly (£{item.priceGBP}/mo)
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingInterval('annual')}
                          className={`py-1.5 rounded-lg font-bold transition text-center flex items-center justify-center space-x-1 cursor-pointer ${
                            billingInterval === 'annual'
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Annual</span>
                          <span className="text-[9px] bg-emerald-900/80 text-emerald-300 px-1 rounded font-mono">17% OFF</span>
                        </button>
                      </div>
                    )}

                    {/* Financial Summary */}
                    <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Net Subscription ({billingInterval}):</span>
                        <span className="text-slate-200 font-mono">£{base.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>UK Standard VAT (20.0%):</span>
                        <span className="text-slate-200 font-mono">£{vat.toFixed(2)}</span>
                      </div>
                      {savingsAnnual > 0 && billingInterval === 'annual' && (
                        <div className="flex justify-between text-emerald-400 text-[11px]">
                          <span>Annual Upfront Savings:</span>
                          <span className="font-mono font-bold">-£{savingsAnnual.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-800/80 pt-2 text-sm font-black text-white">
                        <span>Total Due Now (Stripe):</span>
                        <span className="text-emerald-400 font-mono">£{total.toFixed(2)} GBP</span>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Security & Guarantee */}
                  <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-indigo-300 font-bold">
                      <ShieldCheck className="h-4 w-4 text-indigo-400" />
                      <span>Why Stripe Hosted Checkout?</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
                      <li className="flex items-start space-x-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Frictionless 3D Secure 2.0 biometric verification</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Instant support for Apple Pay, Google Pay, and BACS</span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Card data remains 100% tokenized on Stripe's PCI Level 1 vault</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right Column: Invoicing Details & Launch Button */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Supported Rails Card */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                      Accepted Payment Methods on Stripe
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <CreditCard className="h-5 w-5 text-indigo-400" />
                        <span className="font-bold text-slate-200">Cards</span>
                        <span className="text-[10px] text-slate-400 font-mono">Visa • MC • Amex</span>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <Smartphone className="h-5 w-5 text-cyan-400" />
                        <span className="font-bold text-slate-200">Wallets</span>
                        <span className="text-[10px] text-slate-400 font-mono">Apple &amp; Google Pay</span>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-1">
                        <Building2 className="h-5 w-5 text-emerald-400" />
                        <span className="font-bold text-slate-200">UK BACS</span>
                        <span className="text-[10px] text-slate-400 font-mono">Direct Debit</span>
                      </div>
                    </div>
                  </div>

                  {/* Business & Tax Invoice Details */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                        UK VAT Invoice Details (Pre-filled for your receipt)
                      </span>
                      <Receipt className="h-3.5 w-3.5 text-slate-500" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Company Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Vance Construction Ltd"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          UK VAT Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          placeholder="GB 123 4567 89"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Billing Address
                        </label>
                        <input
                          type="text"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Postcode
                        </label>
                        <input
                          type="text"
                          value={postcode}
                          onChange={(e) => setPostcode(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission Action Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={`w-full py-4 px-6 rounded-2xl font-black text-sm text-white shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                        isProcessing
                          ? 'bg-slate-700 cursor-not-allowed opacity-80'
                          : 'bg-[#635BFF] hover:bg-[#534be0] active:scale-[0.99] hover:shadow-indigo-500/25'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-indigo-300" />
                          <span>{processingStatus || 'Creating Stripe Hosted Checkout...'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-indigo-200" />
                          <span>Proceed to Stripe Hosted Checkout — £{total.toFixed(2)} GBP</span>
                          <ExternalLink className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-400 mt-2 font-mono">
                      <span>Stripe 256-Bit SSL Encrypted</span>
                      <span>•</span>
                      <span>Instant Access Provisioning</span>
                      <span>•</span>
                      <span>Cancel Anytime</span>
                    </div>
                  </div>

                </div>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
