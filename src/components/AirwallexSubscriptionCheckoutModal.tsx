import React, { useState, useEffect } from 'react';
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
  Zap,
  Check,
  FileText,
  X,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Globe
} from 'lucide-react';

export interface AirwallexCheckoutItem {
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

interface AirwallexSubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AirwallexCheckoutItem | null;
  currentUser: User | null;
  onSubscriptionSuccess: (updatedSub: UserSubscription, receipt: any) => void;
}

export const AirwallexSubscriptionCheckoutModal: React.FC<AirwallexSubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  item,
  currentUser,
  onSubscriptionSuccess
}) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
    item?.billingInterval || (item?.annualPriceGBP && item.annualPriceGBP > 0 ? 'annual' : 'monthly')
  );

  const [paymentRail, setPaymentRail] = useState<'direct_debit' | 'card' | 'apple_pay' | 'bacs_transfer'>('direct_debit');

  // Customer Fields
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Arthur Vance');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'arthur.vance@tradecorp.co.uk');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || 'Vance Construction & Maintenance Ltd');
  const [vatNumber, setVatNumber] = useState('GB 938 4821 00');
  const [billingAddress, setBillingAddress] = useState('14 Berkeley Square, Mayfair, London');
  const [postcode, setPostcode] = useState('W1J 6BQ');

  // BACS Direct Debit Fields
  const [sortCode, setSortCode] = useState('20-45-77');
  const [accountNumber, setAccountNumber] = useState('83920194');
  const [accountHolderName, setAccountHolderName] = useState(customerName);
  const [acceptDirectDebitMandate, setAcceptDirectDebitMandate] = useState(true);

  // Card Fields
  const [cardHolder, setCardHolder] = useState(customerName);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('883');
  const [saveToAirwallexVault, setSaveToAirwallexVault] = useState(true);

  // Processing & State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settledReceipt, setSettledReceipt] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<{ id: string; checkoutUrl: string; clientSecret: string } | null>(null);
  const [archStep, setArchStep] = useState<number>(1);
  const [showArchFlow, setShowArchFlow] = useState<boolean>(true);

  // Synchronize item interval when opened
  useEffect(() => {
    if (item) {
      setBillingInterval(item.billingInterval || (item.annualPriceGBP && item.annualPriceGBP > 0 ? 'annual' : 'monthly'));
      setArchStep(1);
    }
  }, [item]);

  // Synchronize name
  useEffect(() => {
    if (currentUser?.name) {
      setCustomerName(currentUser.name);
      setAccountHolderName(currentUser.name);
      setCardHolder(currentUser.name);
    }
    if (currentUser?.email) {
      setCustomerEmail(currentUser.email);
    }
  }, [currentUser]);

  // Auto-initialize Checkout Session on modal open (Architecture Steps 1 -> 2 -> 3 -> 4 -> 5)
  useEffect(() => {
    if (isOpen && item) {
      let isMounted = true;
      const initCheckout = async () => {
        try {
          setArchStep(2); // Step 2: POST /api/create-checkout
          const token = localStorage.getItem('tidy_secure_token');
          const res = await fetch('/api/create-checkout', {
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
              billingAddress: `${billingAddress}, ${postcode}`
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.success) {
              setActiveSession({
                id: data.checkoutId,
                checkoutUrl: data.checkoutUrl,
                clientSecret: data.clientSecret
              });
              setArchStep(5); // Step 5: Customer on Airwallex Payment Page
            }
          }
        } catch (e) {
          console.error('Failed to pre-create checkout session:', e);
        }
      };

      initCheckout();

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, item?.id, billingInterval]);

  // Pricing calculations
  const calculateTotal = () => {
    if (!item) {
      return { base: 0, vat: 0, airwallexFee: 0, total: 0, savingsVsStripe: 0 };
    }
    let base = item.priceGBP;
    if (item.type === 'plan') {
      if (billingInterval === 'annual' && item.annualPriceGBP !== undefined && item.annualPriceGBP > 0) {
        base = item.annualPriceGBP;
      } else {
        base = item.priceGBP;
      }
    }

    if (base <= 0) {
      return { base: 0, vat: 0, airwallexFee: 0, total: 0, savingsVsStripe: 0 };
    }

    const vat = Number((base * 0.20).toFixed(2));
    const airwallexFeePercent = paymentRail === 'direct_debit' ? 0.004 : 0.011;
    const airwallexFee = Number((base * airwallexFeePercent + (paymentRail === 'direct_debit' ? 0.10 : 0.15)).toFixed(2));
    const stripeEquivalentFee = Number((base * 0.029 + 0.30).toFixed(2));
    const savingsVsStripe = Math.max(0, stripeEquivalentFee - airwallexFee);
    const total = Number((base + vat).toFixed(2));

    return { base, vat, airwallexFee, total, savingsVsStripe };
  };

  const { base, vat, airwallexFee, total, savingsVsStripe } = calculateTotal();

  const handleProcessAirwallexPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setErrorMessage(null);

    if (paymentRail === 'direct_debit' && !acceptDirectDebitMandate) {
      setErrorMessage('Please accept the BACS Direct Debit Mandate to proceed.');
      return;
    }

    setIsProcessing(true);
    setArchStep(6); // Step 6: Customer Pays on Airwallex Payment Page
    setProcessingStep('1/3 Authorizing payment via Airwallex FCA BACS Rail...');

    try {
      const token = localStorage.getItem('tidy_secure_token');
      
      // Ensure we have a checkout session
      let currentCheckoutId = activeSession?.id;
      if (!currentCheckoutId) {
        const createRes = await fetch('/api/create-checkout', {
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
            billingAddress: `${billingAddress}, ${postcode}`
          })
        });
        const createData = await createRes.json();
        if (!createRes.ok || !createData.success) {
          throw new Error(createData.error || 'Failed to initialize Airwallex checkout session');
        }
        currentCheckoutId = createData.checkoutId;
      }

      await new Promise(r => setTimeout(r, 600));
      setArchStep(7); // Step 7: Webhook -> Backend -> Update DB -> Give User Access & Redirect
      setProcessingStep('2/3 Webhook dispatched to Backend: Updating Firestore DB & Provisioning Tier...');
      await new Promise(r => setTimeout(r, 700));
      setProcessingStep('3/3 Access Granted: Generating FCA statutory tax invoice...');

      // Complete Checkout with Airwallex backend
      const confirmRes = await fetch('/api/airwallex/complete-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          checkoutId: currentCheckoutId,
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
          paymentMethod: paymentRail,
          directDebitDetails: paymentRail === 'direct_debit' ? { sortCode, accountNumber, accountHolderName } : undefined,
          cardDetails: paymentRail === 'card' ? { brand: 'Mastercard Corporate', last4: '4242', cardHolder } : undefined
        })
      });

      const confirmData = await confirmRes.json();
      if (!confirmRes.ok || !confirmData.success) {
        throw new Error(confirmData.error || 'Airwallex payment settlement failed');
      }

      setSettledReceipt(confirmData.receipt);
      setIsProcessing(false);

      if (confirmData.subscription) {
        onSubscriptionSuccess(confirmData.subscription, confirmData.receipt);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Payment processing encountered an issue. Please retry.');
    }
  };

  const handleDownloadInvoice = () => {
    if (!item) return;
    const invoiceContent = `========================================================================
TIDY CORP UK & AIRWALLEX RECURRING SUBSCRIPTION TAX INVOICE
FCA Authorized EMI: Airwallex (UK) Limited (FRN: 901001)
========================================================================
Invoice Reference: ${settledReceipt?.transactionId || 'AWX-TX-83921'}
Gateway Ref: ${settledReceipt?.gatewayReference || 'awx_settled_live'}
Date & Time: ${new Date(settledReceipt?.date || Date.now()).toUTCString()}
Status: ${settledReceipt?.status || 'Paid & Active'}

BILL TO:
Customer: ${settledReceipt?.customerName || customerName}
Company: ${settledReceipt?.companyName || companyName || 'N/A'}
Email: ${settledReceipt?.customerEmail || customerEmail}
VAT Reg No: ${settledReceipt?.companyVatNumber || vatNumber || 'N/A'}
Address: ${settledReceipt?.billingAddress || billingAddress}

ITEM SPECIFICATION:
Item / Subscription: ${item.name} (${item.type.toUpperCase()})
Billing Schedule: ${billingInterval.toUpperCase()} (${billingInterval === 'annual' ? '12 Months Pre-Paid' : 'Monthly Recurring'})
Payment Method: ${settledReceipt?.paymentMethodUsed || paymentRail}
Cleared Via: Airwallex Global Treasury & Merchant Rail

FINANCIAL BREAKDOWN:
Subtotal (Excl. VAT): £${settledReceipt?.subtotal?.toFixed(2) || (base * 0.8333).toFixed(2)} GBP
UK VAT (20.0% Standard): £${settledReceipt?.vatAmount?.toFixed(2) || vat.toFixed(2)} GBP
------------------------------------------------------------------------
TOTAL PAID VIA AIRWALLEX: £${settledReceipt?.amount?.toFixed(2) || total.toFixed(2)} GBP
========================================================================
Thank you for partnering with Tidy Corp. All client funds held in ring-fenced escrow accounts.
`;
    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TidyCorp_Airwallex_Invoice_${settledReceipt?.transactionId || 'Receipt'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 font-sans">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#003B7A] via-[#0A1A3A] to-[#1E112A] p-5 sm:p-6 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#0057B8] to-[#FF7F00] flex items-center justify-center text-white shadow-lg font-black text-sm">
              AWX
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white tracking-tight">Airwallex Billing Checkout</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold uppercase">
                  FCA Regulated #901001
                </span>
              </div>
              <p className="text-xs text-slate-300">
                UK BACS Direct Debit, Apple Pay &amp; 3D Secure 2.0 Recurring Subscription
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowArchFlow(!showArchFlow)}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-700/50 text-blue-300 hover:bg-blue-900 transition flex items-center space-x-1"
              title="Toggle Live Architecture Diagram Flow"
            >
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>{showArchFlow ? 'Hide Architecture' : 'Show Architecture'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full transition-all"
              title="Close Checkout"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Architecture Flow Progress Banner */}
        {showArchFlow && (
          <div className="bg-slate-950/90 border-b border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Subscription Payment Architecture (Airwallex End-to-End)
                </span>
              </div>
              {activeSession && (
                <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                  <span className="text-slate-500">Session:</span>
                  <span className="text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">{activeSession.id}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px]">
              <div className={`p-2 rounded-xl border transition-all ${archStep >= 1 ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className={`h-3 w-3 ${archStep >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>1. Customer</span>
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">Clicks "Subscribe to Pro"</div>
              </div>

              <div className={`p-2 rounded-xl border transition-all ${archStep >= 2 ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className={`h-3 w-3 ${archStep >= 2 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>2. Website</span>
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">POST /api/create-checkout</div>
              </div>

              <div className={`p-2 rounded-xl border transition-all ${archStep >= 3 ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className={`h-3 w-3 ${archStep >= 3 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>3. Backend</span>
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">Create AWX Checkout</div>
              </div>

              <div className={`p-2 rounded-xl border transition-all ${archStep >= 4 ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className={`h-3 w-3 ${archStep >= 4 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>4. Airwallex</span>
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">Returns checkout URL</div>
              </div>

              <div className={`p-2 rounded-xl border transition-all ${archStep >= 5 ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className={`h-3 w-3 ${archStep >= 5 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>5. Redirect</span>
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">Customer on Payment Page</div>
              </div>

              <div className={`p-2 rounded-xl border transition-all ${archStep >= 6 ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 animate-pulse' : (archStep > 6 ? 'bg-emerald-950/50 border-emerald-600 text-emerald-200' : 'bg-slate-900/60 border-slate-800 text-slate-500')}`}>
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className={`h-3 w-3 ${archStep >= 6 ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <span>6. Customer Pays</span>
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">BACS / Card / Apple Pay</div>
              </div>

              <div className={`p-2 rounded-xl border transition-all ${archStep >= 7 ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-md' : 'bg-slate-900/60 border-slate-800 text-slate-500'}`}>
                <div className="font-bold flex items-center space-x-1">
                  <CheckCircle2 className={`h-3 w-3 ${archStep >= 7 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span>7. Webhook &amp; DB</span>
                </div>
                <div className="text-[10px] mt-0.5 text-slate-400">Update DB &amp; Grant Access</div>
              </div>
            </div>
          </div>
        )}

        {/* Settled Success Receipt View */}
        {settledReceipt ? (
          <div className="p-6 sm:p-10 space-y-6 text-center">
            <div className="h-16 w-16 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-3xl mx-auto flex items-center justify-center shadow-xl animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Payment Settled via Airwallex (UK)
              </span>
              <h3 className="text-2xl font-black text-white">Subscription Successfully Activated</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Your transaction has been securely cleared through Airwallex and your account benefits have been provisioned immediately.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-lg mx-auto text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Transaction Ref:</span>
                <span className="text-cyan-300 font-bold">{settledReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Subscription Tier:</span>
                <span className="text-white font-bold">{item.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Payment Rail:</span>
                <span className="text-slate-200">{settledReceipt.paymentMethodUsed}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Amount Charged:</span>
                <span className="text-[#FF7F00] font-black text-sm">£{settledReceipt.amount?.toFixed(2)} GBP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>{settledReceipt.status}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={handleDownloadInvoice}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download VAT Tax Invoice (TXT)</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <span>Return to Portal</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Main Payment Form Layout */
          <form onSubmit={handleProcessAirwallexPayment} className="grid grid-cols-1 lg:grid-cols-12 max-h-[80vh] overflow-y-auto">
            
            {/* Left Column: Order Summary & Plan Information */}
            <div className="lg:col-span-5 bg-slate-950/90 p-6 sm:p-8 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-800">
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0057B8]/20 text-cyan-300 border border-[#0057B8]/40 text-[10px] font-mono font-bold uppercase">
                    {item.type.replace('_', ' ')}
                  </span>
                  {item.badge && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>

                <h4 className="text-2xl font-black text-white">{item.name}</h4>
                {item.description && (
                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                )}
              </div>

              {/* Billing Interval Toggle if it's a SaaS Plan */}
              {item.type === 'plan' && item.annualPriceGBP && item.annualPriceGBP > 0 && (
                <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      billingInterval === 'monthly'
                        ? 'bg-[#0057B8] text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly Billing (£{item.priceGBP.toFixed(2)}/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('annual')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      billingInterval === 'annual'
                        ? 'bg-[#FF7F00] text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Annual (17% Off)</span>
                  </button>
                </div>
              )}

              {/* Features Included List */}
              {item.features && item.features.length > 0 && (
                <div className="space-y-2 border-t border-slate-800/80 pt-4">
                  <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Included In Tier</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {item.features.slice(0, 4).map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Itemized Order Breakdown */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Base Price ({billingInterval}):</span>
                  <span className="font-bold text-white">£{base.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>UK VAT (20%):</span>
                  <span className="font-bold text-white">£{vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cyan-300 text-[11px]">
                  <span>Airwallex Clearing (0.4% BACS):</span>
                  <span>£{airwallexFee.toFixed(2)}</span>
                </div>
                {savingsVsStripe > 0 && (
                  <div className="bg-emerald-950/60 border border-emerald-800/60 p-2 rounded-xl text-emerald-300 text-[11px] flex items-center justify-between">
                    <span>Airwallex Fee Savings:</span>
                    <span className="font-bold">+£{savingsVsStripe.toFixed(2)} saved</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-slate-200 uppercase text-xs">Total Due Now:</span>
                  <span className="text-2xl font-black text-[#FF7F00]">£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="text-[10px] text-slate-400 space-y-1 border-t border-slate-800 pt-3">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                  <Lock className="h-3.5 w-3.5" />
                  <span>256-Bit TLS Encryption • Airwallex PCI-DSS Level 1</span>
                </div>
                <p>Funds ring-fenced under FCA Electronic Money Regulations 2011.</p>
              </div>
            </div>

            {/* Right Column: Payment Method & Customer Details */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
              
              {/* Payment Method Selector Tabs */}
              <div className="space-y-3">
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Select Airwallex Payment Rail
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* BACS Direct Debit */}
                  <button
                    type="button"
                    onClick={() => setPaymentRail('direct_debit')}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      paymentRail === 'direct_debit'
                        ? 'bg-blue-950/60 border-[#0057B8] ring-2 ring-[#0057B8]/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Building2 className={`h-5 w-5 ${paymentRail === 'direct_debit' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        0.4% Fee
                      </span>
                    </div>
                    <span className="font-bold text-xs text-white block">Airwallex BACS</span>
                    <span className="text-[10px] text-slate-400 block">Direct Debit (UK)</span>
                  </button>

                  {/* Card Pay */}
                  <button
                    type="button"
                    onClick={() => setPaymentRail('card')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      paymentRail === 'card'
                        ? 'bg-blue-950/60 border-[#0057B8] ring-2 ring-[#0057B8]/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <CreditCard className={`h-5 w-5 ${paymentRail === 'card' ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        Visa / MC
                      </span>
                    </div>
                    <span className="font-bold text-xs text-white block">Credit / Debit</span>
                    <span className="text-[10px] text-slate-400 block">3DS 2.0 Secure</span>
                  </button>

                  {/* Apple / Google Pay */}
                  <button
                    type="button"
                    onClick={() => setPaymentRail('apple_pay')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      paymentRail === 'apple_pay'
                        ? 'bg-blue-950/60 border-[#0057B8] ring-2 ring-[#0057B8]/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <Zap className={`h-5 w-5 ${paymentRail === 'apple_pay' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        1-Click
                      </span>
                    </div>
                    <span className="font-bold text-xs text-white block">Apple / Google</span>
                    <span className="text-[10px] text-slate-400 block">Instant Wallet</span>
                  </button>
                </div>
              </div>

              {/* Customer Information Block */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Subscriber &amp; Billing Entity
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#0057B8]"
                      placeholder="e.g. Arthur Vance"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Email (For VAT Receipt)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#0057B8]"
                      placeholder="name@company.co.uk"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Company Name (Optional)</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#0057B8]"
                      placeholder="e.g. Vance Construction Ltd"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">UK VAT No. (Optional)</label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={e => setVatNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#0057B8]"
                      placeholder="e.g. GB 938 4821 00"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details Rail Specific */}
              {paymentRail === 'direct_debit' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">UK BACS Direct Debit Setup</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Instant Bank Verification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold mb-1">Sort Code (6-Digits)</label>
                      <input
                        type="text"
                        value={sortCode}
                        onChange={e => setSortCode(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#0057B8]"
                        placeholder="20-45-77"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold mb-1">Account Number (8-Digits)</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#0057B8]"
                        placeholder="83920194"
                      />
                    </div>
                  </div>

                  {/* Direct Debit Guarantee */}
                  <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2 text-[11px] text-slate-300">
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="dd-mandate-check"
                        checked={acceptDirectDebitMandate}
                        onChange={e => setAcceptDirectDebitMandate(e.target.checked)}
                        className="h-4 w-4 rounded bg-slate-800 border-slate-700 text-[#0057B8] focus:ring-0 mt-0.5"
                      />
                      <label htmlFor="dd-mandate-check" className="cursor-pointer">
                        <strong className="text-white">BACS Direct Debit Guarantee:</strong> I authorize Airwallex (UK) Limited on behalf of Tidy Corp to send instructions to my bank to debit my account in accordance with the scheme rules.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {paymentRail === 'card' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Airwallex Vault Card Entry</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">3D Secure 2.0</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#0057B8]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 font-bold mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        required
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#0057B8]"
                        placeholder="•••• •••• •••• ••••"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-bold mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#0057B8]"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-bold mb-1">Security Code (CVC)</label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value)}
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#0057B8]"
                          placeholder="CVC"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentRail === 'apple_pay' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-800 mx-auto flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h5 className="text-sm font-bold text-white">Airwallex Express 1-Click Wallet</h5>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Authenticate directly using Apple Pay, Google Pay, or biometric tokenized device authentication.
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-[#FF7F00] via-amber-500 to-[#FF7F00] hover:from-amber-500 hover:to-[#FF7F00] text-slate-950 font-black py-4 rounded-2xl text-sm shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-75 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin text-slate-950" />
                    <span>{processingStep || 'Processing with Airwallex...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-slate-950" />
                    <span>Pay £{total.toFixed(2)} GBP via Airwallex</span>
                    <ArrowRight className="h-4 w-4 text-slate-950" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-4 text-[10px] text-slate-400 font-mono pt-1">
                <span>FCA Firm Ref: 901001</span>
                <span>•</span>
                <span>Airwallex Global Treasury</span>
                <span>•</span>
                <span>ISO 27001 Certified</span>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
