import React, { useState } from 'react';
import { User, UserSubscription } from '../types';
import {
  PLAN_TIERS,
  CARE_PACKAGES,
  CREDIT_SCHEDULE,
  ESCROW_BOOKING_FEES,
  STANDARD_ESCROW_POLICY,
  PlanTierDefinition,
  CarePackageDefinition
} from '../data/pricingData';
import {
  Shield,
  Zap,
  CheckCircle2,
  Sparkles,
  Award,
  Lock,
  Clock,
  Building2,
  CreditCard,
  PoundSterling,
  Users,
  Percent,
  Check,
  RefreshCw,
  Gift,
  ShieldCheck,
  Globe,
  Flame,
  ArrowRight,
  TrendingUp,
  Sliders,
  HelpCircle
} from 'lucide-react';

interface PricingSubscriptionPortalProps {
  currentUser: User | null;
  onUserUpdate?: (updatedUser: User) => void;
}

export const PricingSubscriptionPortal: React.FC<PricingSubscriptionPortalProps> = ({
  currentUser,
  onUserUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'gateway_fees' | 'homeowner_care' | 'credits' | 'growth_pass'>('plans');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');

  // Interactive Fee Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(2500);
  const [calcTradeCertActive, setCalcTradeCertActive] = useState<boolean>(true);

  // Mutation / Action Loading States
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [loadingCareId, setLoadingCareId] = useState<string | null>(null);
  const [loadingCreditsType, setLoadingCreditsType] = useState<string | null>(null);
  const [loadingEscrowPass, setLoadingEscrowPass] = useState<boolean>(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const token = localStorage.getItem('tidy_secure_token');

  // Handle Subscription Change
  const handleSubscribePlan = async (plan: PlanTierDefinition) => {
    setLoadingPlanId(plan.id);
    setBannerMessage(null);

    try {
      const res = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          planId: plan.id,
          billingInterval
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBannerMessage(data.message);

        if (currentUser && onUserUpdate && data.subscription) {
          onUserUpdate({
            ...currentUser,
            subscription: data.subscription
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlanId(null);
    }
  };

  // Handle Care Package Subscription
  const handleSubscribeCarePackage = async (carePkg: CarePackageDefinition) => {
    setLoadingCareId(carePkg.id);
    setBannerMessage(null);

    try {
      const res = await fetch('/api/user/care-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          carePackageId: carePkg.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBannerMessage(data.message);

        if (currentUser && onUserUpdate && data.updatedSubscription) {
          onUserUpdate({
            ...currentUser,
            subscription: data.updatedSubscription
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCareId(null);
    }
  };

  // Handle Credits Top Up
  const handleTopUpCredits = async (packageType: 'standard' | 'bulk') => {
    setLoadingCreditsType(packageType);
    setBannerMessage(null);

    try {
      const res = await fetch('/api/user/credits/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ packageType })
      });

      if (res.ok) {
        const data = await res.json();
        setBannerMessage(data.message);

        if (currentUser && onUserUpdate && data.updatedSubscription) {
          onUserUpdate({
            ...currentUser,
            subscription: data.updatedSubscription
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCreditsType(null);
    }
  };

  // Handle Escrow Pre-Purchase Pass
  const handleActivateEscrowPass = async () => {
    setLoadingEscrowPass(true);
    setBannerMessage(null);

    try {
      const res = await fetch('/api/user/escrow-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ userId: currentUser?.id })
      });

      if (res.ok) {
        const data = await res.json();
        setBannerMessage(data.message);

        if (currentUser && onUserUpdate && data.updatedSubscription) {
          onUserUpdate({
            ...currentUser,
            subscription: data.updatedSubscription
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEscrowPass(false);
    }
  };

  const currentSub = currentUser?.subscription;

  // Escrow Fee Calculator logic
  const calculateEscrowBreakdown = (amount: number) => {
    const isPassHolder = currentSub?.hasEscrowPrePurchasePass;
    const rate = calcTradeCertActive ? 1.90 : 2.25;
    const payerShare = (amount * (rate / 100)) + 0.30;
    const payeeShare = (amount * (rate / 100)) + 0.30;
    const totalProcessing = isPassHolder ? 0 : payerShare + payeeShare;

    let releaseGateSLA = '48-Hour Auto-Approval Gate';
    let releaseGateTier = 'Minor Emergency (<£500)';

    if (amount >= 500 && amount <= 5000) {
      releaseGateSLA = '72-Hour Review (Multi-channel SMS/WhatsApp)';
      releaseGateTier = 'Mid-Tier Renovation (£500–£5k)';
    } else if (amount > 5000) {
      releaseGateSLA = '5–7 Day Inspection (RICS/Building Sign-off)';
      releaseGateTier = 'Major Structural (>£5k)';
    }

    return {
      payerShare: Number(payerShare.toFixed(2)),
      payeeShare: Number(payeeShare.toFixed(2)),
      totalProcessing: Number(totalProcessing.toFixed(2)),
      releaseGateSLA,
      releaseGateTier,
      isPassHolder
    };
  };

  const calcBreakdown = calculateEscrowBreakdown(calcAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Top Banner Message Notification */}
      {bannerMessage && (
        <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 px-6 py-4 rounded-2xl flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm">{bannerMessage}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="text-emerald-400 text-sm font-bold">✕</button>
        </div>
      )}

      {/* Header & Active User Plan Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-[#0057B8]/10 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#0057B8]/20 border border-[#0057B8]/40 text-cyan-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>Tidy Corp SaaS &amp; Escrow Fee Policy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Flexible Enterprise &amp; Subscription Tiers
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Compliance-engineered plans, FCA-compliant escrow fee structures, AI compute credit schedule, and predictive home care packages.
            </p>
          </div>

          {/* Active User Subscription Card */}
          {currentUser && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 min-w-[280px] sm:min-w-[340px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Active Subscription Status
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  ● {currentSub?.status || 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-white">{currentSub?.planName || 'Apprentice'} Plan</h3>
                  <span className="text-slate-400 text-xs font-mono capitalize">
                    {currentSub?.billingInterval || 'Monthly'} Billing • {currentSub?.transactionFeeRate || '10% GTV'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#FF7F00] block">
                    {(currentSub?.remainingCredits || 5000).toLocaleString()} Credits
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Monthly Quota</span>
                </div>
              </div>

              {/* Extra Badges */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2 text-[10px]">
                {currentSub?.hasEscrowPrePurchasePass ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700 font-bold flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span>Escrow Pass (£25k Zero Fee)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-medium">
                    Standard Escrow
                  </span>
                )}

                {currentSub?.activeCarePackageId && currentSub.activeCarePackageId !== 'none' && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold flex items-center space-x-1">
                    <ShieldCheck className="h-3 w-3 text-cyan-400" />
                    <span className="capitalize">{currentSub.activeCarePackageId.replace('tidy_', 'Tidy ')}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation Bar */}
        <div className="mt-8 border-t border-slate-800 pt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'plans'
                ? 'bg-[#0057B8] text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="h-4 w-4 text-cyan-300" />
            <span>1. SaaS Plan Tiers</span>
          </button>

          <button
            onClick={() => setActiveTab('gateway_fees')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'gateway_fees'
                ? 'bg-[#0057B8] text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Percent className="h-4 w-4 text-amber-400" />
            <span>2. Gateway &amp; Escrow Fees</span>
          </button>

          <button
            onClick={() => setActiveTab('homeowner_care')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'homeowner_care'
                ? 'bg-[#0057B8] text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>3. Homeowner Care Packages</span>
          </button>

          <button
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'credits'
                ? 'bg-[#0057B8] text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="h-4 w-4 text-[#FF7F00]" />
            <span>4. Tidy Credits Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('growth_pass')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 ${
              activeTab === 'growth_pass'
                ? 'bg-[#0057B8] text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Gift className="h-4 w-4 text-purple-400" />
            <span>5. Escrow Pass &amp; Growth</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SAAS SUBSCRIPTION PLAN TIERS MATRIX */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Billing Cycle Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-white flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-[#FF7F00]" />
                <span>Select Subscription Billing Cycle</span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                All plans include a <strong>17% discount (2 months free)</strong> when billed annually upfront, backed by statutory compliance automation.
              </p>
            </div>

            <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 ${
                  billingInterval === 'annual'
                    ? 'bg-[#FF7F00] text-slate-950 shadow-md'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                  SAVE 17%
                </span>
              </button>
            </div>
          </div>

          {/* Grid of 6 Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLAN_TIERS.map(plan => {
              const isCurrent = currentSub?.planId === plan.id;
              const isAnnual = billingInterval === 'annual';
              const displayPrice = plan.monthlyPriceGBP === -1
                ? 'Custom Scale'
                : plan.monthlyPriceGBP === 0
                ? '£0.00'
                : isAnnual
                ? `£${(plan.annualPriceGBP / 12).toFixed(2)}`
                : `£${plan.monthlyPriceGBP.toFixed(2)}`;

              return (
                <div
                  key={plan.id}
                  className={`bg-slate-900 border ${
                    plan.isPopular
                      ? 'border-[#FF7F00] ring-2 ring-[#FF7F00]/30 shadow-2xl relative'
                      : 'border-slate-800'
                  } rounded-3xl p-6 flex flex-col justify-between transition-all hover:border-slate-700`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 right-6 bg-[#FF7F00] text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${plan.badgeColor}`}>
                        {plan.subtitle}
                      </span>
                      <h3 className="text-xl font-black text-white mt-2">{plan.name}</h3>
                      <span className="text-xs text-slate-400 block font-medium mt-0.5">{plan.targetRole}</span>
                    </div>

                    {/* Price */}
                    <div className="border-y border-slate-800/80 py-4 space-y-1">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-black text-white tracking-tight">{displayPrice}</span>
                        {plan.monthlyPriceGBP > 0 && <span className="text-xs text-slate-400 font-medium">/ month</span>}
                      </div>
                      {plan.monthlyPriceGBP > 0 && isAnnual && (
                        <span className="text-[10px] text-amber-400 font-mono font-bold block">
                          £{plan.annualPriceGBP.toFixed(2)} billed annually (Save 17%)
                        </span>
                      )}
                    </div>

                    {/* Specs */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Monthly AI Credits:</span>
                        <span className="text-white font-bold">
                          {plan.monthlyCredits === -1 ? 'Custom Quota' : plan.monthlyCredits.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Transaction Rate:</span>
                        <span className="text-cyan-300 font-bold">{plan.transactionRate}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Deliverables &amp; Compliance Features:
                      </span>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="pt-6 mt-6 border-t border-slate-800">
                    <button
                      onClick={() => handleSubscribePlan(plan)}
                      disabled={loadingPlanId === plan.id || isCurrent}
                      className={`w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                        isCurrent
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-600/40 cursor-default'
                          : plan.isPopular
                          ? 'bg-[#FF7F00] hover:bg-amber-600 text-slate-950 shadow-lg'
                          : 'bg-[#0057B8] hover:bg-blue-600 text-white shadow-md'
                      }`}
                    >
                      {loadingPlanId === plan.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Updating Plan...</span>
                        </>
                      ) : isCurrent ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Current Active Plan</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe to {plan.name}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GATEWAY & ESCROW SERVICE FEES & POLICY */}
      {activeTab === 'gateway_fees' && (
        <div className="space-y-8">
          {/* Policy Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-[#0057B8]/20 border border-[#0057B8]/40 flex items-center justify-center text-cyan-400">
                <Percent className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white">Standard Fee Split</h3>
              <p className="text-cyan-300 font-mono text-sm font-bold">2.25% + £0.30 / party</p>
              <p className="text-slate-400 text-xs">
                Charged equitably to Payer (Homeowner/Landlord) and Payee (Trade Pro). Total processing charge of 4.56% split 50/50.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FF7F00]/20 border border-[#FF7F00]/40 flex items-center justify-center text-amber-400">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white">Apprentice Plan Cap</h3>
              <p className="text-amber-400 font-mono text-sm font-bold">£150.00 Cap per Milestone</p>
              <p className="text-slate-400 text-xs">
                Tradespeople on free Apprentice plan pay 10% GTV on minor jobs (&lt;£1,000). Fees strictly capped at £150.00 on major jobs.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-white">Trust Discounts</h3>
              <p className="text-emerald-400 font-mono text-sm font-bold">1.90% + £0.30 / party</p>
              <p className="text-slate-400 text-xs">
                Unlock discounted processing rates scaling down to 1.90% + £0.30 by maintaining active trade certs (Gas Safe, NICEIC, FENSA) &amp; high completion rates.
              </p>
            </div>
          </div>

          {/* Interactive Escrow Fee Calculator */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="inline-flex items-center space-x-2 bg-amber-950 border border-amber-800 text-amber-300 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2">
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                <span>Interactive Fee &amp; Release Gate Estimator</span>
              </div>
              <h3 className="text-xl font-black text-white">Project Milestone Fee Simulator</h3>
              <p className="text-slate-400 text-xs mt-1">
                Enter a project milestone value to calculate exact payer/payee processing shares and statutory release gates.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Project Milestone Value (£ GBP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400 font-black text-sm">£</span>
                    <input
                      type="number"
                      value={calcAmount}
                      onChange={e => setCalcAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-lg font-black text-white focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Active Trade Qualifications (Trust Discount)</span>
                    <span className="text-[11px] text-slate-400">Gas Safe, NICEIC, RICS verified active</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={calcTradeCertActive}
                    onChange={e => setCalcTradeCertActive(e.target.checked)}
                    className="h-5 w-5 rounded bg-slate-800 border-slate-700 text-[#0057B8] focus:ring-0"
                  />
                </div>
              </div>

              {/* Calculator Output Display */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Applicable Processing Rate:</span>
                  <span className="text-cyan-300 font-bold">
                    {calcTradeCertActive ? '1.90% + £0.30 / party (Trust Rate)' : '2.25% + £0.30 / party (Standard)'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Payer (Homeowner) Fee Share:</span>
                  <span className="text-white font-bold">£{calcBreakdown.payerShare.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Payee (Trade Pro) Fee Share:</span>
                  <span className="text-white font-bold">£{calcBreakdown.payeeShare.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Total Gateway Processing Charge:</span>
                  <span className="text-[#FF7F00] font-black text-sm">£{calcBreakdown.totalProcessing.toFixed(2)}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-emerald-400 font-bold block text-[11px]">
                    Statutory Release Gate ({calcBreakdown.releaseGateTier}):
                  </span>
                  <span className="text-slate-300 text-[11px] block">{calcBreakdown.releaseGateSLA}</span>
                </div>
              </div>
            </div>

            {/* Escrow Release Gates Grid */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-black text-white mb-3 flex items-center space-x-2">
                <Lock className="h-4 w-4 text-[#0057B8]" />
                <span>Escrow Safeguarding &amp; Release Gates Policy</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-emerald-400 font-bold block">Emergency / Minor (&lt;£500)</span>
                  <span className="text-white font-black text-sm block">48-Hour Auto-Approval Gate</span>
                  <p className="text-slate-400 text-[11px]">
                    Fast-track release upon photo proof submission with 48h automated approval timer.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold block">Mid-Tier (£500–£5,000)</span>
                  <span className="text-white font-black text-sm block">72-Hour Review Gate</span>
                  <p className="text-slate-400 text-[11px]">
                    Multi-channel SMS &amp; WhatsApp reminders sent to homeowner before automatic release.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-purple-400 font-bold block">Major Structural (&gt;£5,000)</span>
                  <span className="text-white font-black text-sm block">5–7 Day Inspection Gate</span>
                  <p className="text-slate-400 text-[11px]">
                    Formal RICS or Building Control sign-offs required prior to milestone disbursement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOMEOWNER MARKETPLACE & PREDICTIVE CARE PACKAGES */}
      {activeTab === 'homeowner_care' && (
        <div className="space-y-8">
          {/* Project Escrow Booking Fees */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                Homeowner Marketplace Fees
              </span>
              <h3 className="text-xl font-black text-white mt-1">Transparent Project Escrow Booking Fees</h3>
              <p className="text-slate-400 text-xs mt-1">
                Homeowners hiring trade professionals through the platform access clear, transparent booking fees.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-2xl font-black text-white block">£16.50</span>
                <span className="text-xs font-bold text-cyan-300 block">Minor Works (&lt;£1,000 value)</span>
                <p className="text-slate-400 text-[11px]">
                  Flat fee per project escrow. Optimised for quick, small-scale trade tasks and minor residential maintenance.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-2xl font-black text-white block">£38.50</span>
                <span className="text-xs font-bold text-amber-300 block">Medium Works (£1k–£3k value)</span>
                <p className="text-slate-400 text-[11px]">
                  Flat fee per project escrow. Standard tier covering multi-day trades and specialty installations.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-2xl font-black text-white block">£82.50</span>
                <span className="text-xs font-bold text-[#FF7F00] block">Major Works (&gt;£3,000 value)</span>
                <p className="text-slate-400 text-[11px]">
                  Flat fee per project escrow. Engineered for structural extensions, full refits, and major engineering works.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-2xl font-black text-white block">5.5%</span>
                <span className="text-xs font-bold text-emerald-400 block">On-Demand Everyday Living</span>
                <p className="text-slate-400 text-[11px]">
                  Service charge added directly to the verified invoice for flexible services including cleaning, gardening, and handymen.
                </p>
              </div>
            </div>
          </div>

          {/* Predictive Care-as-a-Service Packages */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#FF7F00] uppercase tracking-wider block">
                Predictive Care-as-a-Service Packages
              </span>
              <h3 className="text-xl font-black text-white mt-1">Proactive Home Care &amp; Maintenance Subscriptions</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CARE_PACKAGES.map(pkg => {
                const isActive = currentSub?.activeCarePackageId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className={`bg-slate-900 border ${
                      isActive ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-800'
                    } rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                          {pkg.badge}
                        </span>
                        {isActive && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase">
                            Active Package
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xl font-black text-white">{pkg.name}</h4>
                        <span className="text-2xl font-black text-[#FF7F00] mt-1 block">
                          £{pkg.monthlyPriceGBP.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ month</span>
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs font-medium">{pkg.description}</p>

                      <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSubscribeCarePackage(pkg)}
                      disabled={loadingCareId === pkg.id || isActive}
                      className={`w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                        isActive
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-600/40'
                          : 'bg-[#FF7F00] hover:bg-amber-600 text-slate-950 shadow-md'
                      }`}
                    >
                      {loadingCareId === pkg.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                          <span>Activating...</span>
                        </>
                      ) : isActive ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span>Care Package Active</span>
                        </>
                      ) : (
                        <>
                          <span>Activate {pkg.name}</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIDY CREDITS COMPUTE ECONOMY & TOKEN SCHEDULE */}
      {activeTab === 'credits' && (
        <div className="space-y-8">
          {/* Top-up Cards & Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold uppercase">
                Standard Top-Up
              </span>
              <div>
                <h3 className="text-2xl font-black text-white">£10.00 Flat</h3>
                <span className="text-slate-400 text-xs">Per 20,000 Tidy Credits allocated instantly.</span>
              </div>
              <button
                onClick={() => handleTopUpCredits('standard')}
                disabled={loadingCreditsType === 'standard'}
                className="w-full bg-[#0057B8] hover:bg-blue-600 text-white font-black py-3 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {loadingCreditsType === 'standard' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-amber-300" />
                    <span>Top-Up 20,000 Credits (£10)</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 border border-[#FF7F00] ring-2 ring-[#FF7F00]/30 rounded-3xl p-6 space-y-4">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF7F00] text-slate-950 text-[10px] font-black uppercase">
                Bulk Enterprise (30% Savings)
              </span>
              <div>
                <h3 className="text-2xl font-black text-white">£700.00 / 1.4M</h3>
                <span className="text-slate-400 text-xs">High-volume discount engineered for portfolio managers.</span>
              </div>
              <button
                onClick={() => handleTopUpCredits('bulk')}
                disabled={loadingCreditsType === 'bulk'}
                className="w-full bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {loadingCreditsType === 'bulk' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-slate-950" />
                    <span>Buy 1.4 Million Credits (£700)</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 text-xs">
              <h4 className="font-black text-white text-sm flex items-center space-x-2">
                <Gift className="h-4 w-4 text-amber-400" />
                <span>Credit-Back &amp; Expiry Policies</span>
              </h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Credit-Back Loyalty:</strong> Earn 1,000 bonus credits for every £100 settled through escrow.
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Never Expire:</strong> Unused credits never expire for active subscription holders.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* AI Token Schedule Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div>
              <h3 className="text-lg font-black text-white">AI Multi-Agent Token Schedule</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Dynamically mapped execution costs optimized against foundational LLM pricing matrices.
              </p>
            </div>

            <div className="overflow-x-auto bg-slate-950 rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 font-sans">
                <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                  <tr>
                    <th className="p-4">Operation Category</th>
                    <th className="p-4">Use Case</th>
                    <th className="p-4">AI Engine</th>
                    <th className="p-4">Credits Required</th>
                    <th className="p-4">Equiv Cost (£ GBP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {CREDIT_SCHEDULE.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-all">
                      <td className="p-4 font-bold text-white">{item.operationCategory}</td>
                      <td className="p-4 text-slate-300">{item.useCase}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                          {item.aiEngine}
                        </span>
                      </td>
                      <td className="p-4 text-[#FF7F00] font-black">{item.creditsRequired} Credits</td>
                      <td className="p-4 text-emerald-400 font-bold">{item.equivGBP}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ESCROW PRE-PURCHASE PASS & VIRAL GROWTH */}
      {activeTab === 'growth_pass' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Escrow Pre-Purchase Pass */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold uppercase">
                High-Volume Trade Pass
              </span>
              <h3 className="text-2xl font-black text-white mt-2">Escrow Pre-Purchase Pass</h3>
              <p className="text-slate-400 text-xs mt-1">
                Designed for high-volume trade contractors to bypass gateway transaction fees while injecting liquidity.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-3xl font-black text-white block">£500.00 <span className="text-xs text-slate-400">Upfront Lock-In</span></span>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-amber-400" />
                  <span><strong>Zero Gateway Fees:</strong> Valid on first £25,000 of project volume.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-amber-400" />
                  <span><strong>£1,125.00 Net Savings:</strong> Substantial discount replacing standard commission.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleActivateEscrowPass}
              disabled={loadingEscrowPass || currentSub?.hasEscrowPrePurchasePass}
              className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                currentSub?.hasEscrowPrePurchasePass
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-600/40'
                  : 'bg-[#FF7F00] hover:bg-amber-600 text-slate-950 shadow-xl'
              }`}
            >
              {loadingEscrowPass ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : currentSub?.hasEscrowPrePurchasePass ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Escrow Pass Active (£25k Limit)</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Activate Escrow Pass (£500)</span>
                </>
              )}
            </button>
          </div>

          {/* Viral Shared Security Loop */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold uppercase">
                Bilateral Referral Incentives
              </span>
              <h3 className="text-2xl font-black text-white mt-2">Viral "Shared Security" Loop</h3>
              <p className="text-slate-400 text-xs mt-1">
                A self-sustaining referral network that triggers high-value compute allocations upon transactional verification.
              </p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-3xl font-black text-cyan-300 block">50,000 Credits <span className="text-xs text-slate-400">/ Party</span></span>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-cyan-400" />
                  <span><strong>Bilateral Incentives:</strong> Both referrers and referred counterparties receive bonus.</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-cyan-400" />
                  <span><strong>Escrow Triggered:</strong> Deposited automatically upon completion of first transaction.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
