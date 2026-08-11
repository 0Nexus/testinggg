import React, { useState } from 'react';
import { RenovationProject, Milestone, PaymentGateway } from '../types';
import { StructuredFrictionHoldButton } from './StructuredFrictionHoldButton';
import { ShieldCheck, CreditCard, Building2, CheckCircle2, Lock, ArrowRight, Download, Sparkles, AlertCircle, Coins } from 'lucide-react';

interface ClientCheckoutPortalProps {
  projects: RenovationProject[];
  selectedProject: RenovationProject | null;
  selectedMilestoneId: string | null;
  onPayMilestone: (projectId: string, milestoneId: string, method: string, cardInfo?: any) => Promise<void>;
}

export const ClientCheckoutPortal: React.FC<ClientCheckoutPortalProps> = ({
  projects,
  selectedProject,
  selectedMilestoneId,
  onPayMilestone
}) => {
  const [activeProjectId, setActiveProjectId] = useState<string>(
    selectedProject ? selectedProject.id : (projects[0]?.id || '')
  );

  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const [activeMilestoneId, setActiveMilestoneId] = useState<string>(
    selectedMilestoneId || (currentProject?.milestones.find(m => m.status !== 'paid')?.id || currentProject?.milestones[0]?.id || '')
  );

  const currentMilestone = currentProject?.milestones.find(m => m.id === activeMilestoneId) || currentProject?.milestones[0];

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'direct_debit'>('card');
  const [cardName, setCardName] = useState('Arthur Vance');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [settledReceipt, setSettledReceipt] = useState<any>(null);

  if (!currentProject || !currentMilestone) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active project or milestone selected for payment portal.
      </div>
    );
  }

  const assignedGateway: PaymentGateway = currentMilestone.assignedGateway;
  const isAirwallex = assignedGateway === 'airwallex';
  const isPaid = currentMilestone.status === 'paid';

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
  
    try {
      await onPayMilestone(currentProject.id, currentMilestone.id, paymentMethod, {
        brand: paymentMethod === 'direct_debit' ? 'Airwallex Direct Debit' : 'Visa',
        last4: '4242'
      });

      setIsProcessing(false);
      setPaymentSuccess(true);
      setSettledReceipt({
        txId: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: currentMilestone.amount,
        currency: 'GBP',
        gateway: assignedGateway,
        date: new Date().toLocaleDateString(),
        client: currentProject.clientName,
        milestoneTitle: currentMilestone.title
      });
    } catch (err) {
      setIsProcessing(false);
      alert('Payment processing error. Please try again.');
    }
  };

  return (
    <div id="client-checkout-portal-container" className="max-w-4xl mx-auto space-y-8">
      {/* Link Switcher Header for Demo / Testing */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-slate-900 block">Simulated Client Payment Link View</span>
          <span className="text-slate-500">Select contract &amp; milestone to preview client checkout page</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            id="select-portal-project"
            value={activeProjectId}
            onChange={e => {
              setActiveProjectId(e.target.value);
              const proj = projects.find(p => p.id === e.target.value);
              if (proj && proj.milestones[0]) {
                setActiveMilestoneId(proj.milestones[0].id);
              }
            }}
            className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 bg-slate-50"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          <select
            id="select-portal-milestone"
            value={activeMilestoneId}
            onChange={e => setActiveMilestoneId(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 bg-slate-50"
          >
            {currentProject.milestones.map(m => (
              <option key={m.id} value={m.id}>
                {m.title} (£{m.amount.toLocaleString()}) {m.status === 'paid' ? '✓ Paid' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Checkout View Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Side: Invoice & Contract Summary */}
        <div className="md:col-span-5 bg-slate-900 text-white p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-[#0057B8] flex items-center justify-center font-black text-white text-xs">
                TC
              </div>
              <div>
                <span className="font-black text-sm tracking-tight text-white block">Tidy Secure Pay</span>
                <span className="text-[10px] text-slate-300 font-medium">Verified Escrow &amp; Maintenance Portal</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-b border-slate-800 py-4">
              <span className="text-[10px] text-slate-400 font-mono uppercase">INVOICE TO</span>
              <div className="font-bold text-white text-base">{currentProject.clientName}</div>
              <div className="text-xs text-slate-400">{currentProject.clientEmail}</div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-mono uppercase">MILESTONE ESCROW STAGE</span>
              <div className="font-bold text-slate-200 text-sm">{currentMilestone.title}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{currentMilestone.description}</p>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">TOTAL DUE IN ESCROW NOW</span>
              <div className="text-3xl font-black text-[#FF7F00]">
                £{currentMilestone.amount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Gateway Badge */}
          <div className="pt-4 border-t border-slate-800 flex items-center space-x-2 text-xs text-slate-300">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>256-bit Encrypted via {isAirwallex ? 'Airwallex Direct Debit' : 'Stripe Escrow'}</span>
          </div>
        </div>

        {/* Right Side: Interactive Payment Form or Settled Receipt */}
        <div className="md:col-span-7 p-8 space-y-6">
          {isPaid || paymentSuccess ? (
            <div id="receipt-success-card" className="space-y-6 text-center py-6">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Payment Escrow Settled</h3>
                <p className="text-xs text-slate-500">
                  Thank you! Escrow receipt issued for <span className="font-bold text-slate-800">{currentMilestone.title}</span>.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-bold text-slate-900">{settledReceipt?.txId || 'TX-892109'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rail Provider:</span>
                  <span className="font-bold text-slate-900">{isAirwallex ? 'Airwallex Direct Debit' : 'Stripe Escrow'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">£{currentMilestone.amount.toLocaleString()} GBP</span>
                </div>
              </div>

              <button
                id="btn-download-receipt"
                onClick={() => alert('Receipt downloaded as PDF!')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Payment Receipt</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-6">
              {/* Gateway Banner */}
              {isAirwallex ? (
                <div id="airwallex-checkout-badge" className="p-4 bg-cyan-50 rounded-2xl border border-cyan-200 space-y-1">
                  <div className="flex items-center space-x-2 text-cyan-900 font-bold text-sm">
                    <ShieldCheck className="h-5 w-5 text-cyan-600" />
                    <span>Airwallex Long-Term Direct Debit Rails</span>
                  </div>
                  <p className="text-xs text-cyan-800">
                    This renovation milestone is scheduled past 90 days. Airwallex locks in a multi-month direct debit mandate to prevent expired card auth holds.
                  </p>
                </div>
              ) : (
                <div id="stripe-checkout-badge" className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-1">
                  <div className="flex items-center space-x-2 text-blue-950 font-bold text-sm">
                    <CreditCard className="h-5 w-5 text-[#0057B8]" />
                    <span>Stripe Instant Escrow Checkout</span>
                  </div>
                  <p className="text-xs text-blue-900">
                    Immediate deposit milestone under 90 days. Fast processing via credit card or Apple Pay.
                  </p>
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Select Payment Rail</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center space-x-2 ${
                      paymentMethod === 'card'
                        ? 'border-[#0057B8] bg-blue-50 text-blue-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('direct_debit')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center space-x-2 ${
                      paymentMethod === 'direct_debit'
                        ? 'border-cyan-600 bg-cyan-50 text-cyan-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Airwallex Direct Debit</span>
                  </button>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cardholder / Account Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0057B8] font-medium"
                  />
                </div>

                {paymentMethod === 'card' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#0057B8] font-mono"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">Global Bank Mandate Setup</span>
                    <p className="text-slate-500">
                      Authorizing continuous long-term direct debit via Airwallex BACS. Low fees and automatically handles long-term renovation schedules over 12-24 months.
                    </p>
                  </div>
                )}
              </div>

              {/* Pay Button with Structured Friction Protocol */}
              <div className="pt-2">
                <StructuredFrictionHoldButton
                  amount={currentMilestone.amount}
                  label={`Authorize £${currentMilestone.amount.toLocaleString()} Deposit`}
                  reason={`Authorizing payment to Tidy Secure Escrow Vault via ${paymentMethod === 'direct_debit' ? 'Airwallex Direct Debit' : 'Stripe Instant Escrow'}.`}
                  onConfirm={async () => {
                    await handleProcessPayment({ preventDefault: () => {} } as any);
                  }}
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

