import React, { useState, useEffect } from 'react';
import {
  User,
  PartnerStackConfig,
  PartnerStackPartner,
  PartnerStackEvent
} from '../types';
import {
  Handshake,
  Copy,
  Check,
  ExternalLink,
  PoundSterling,
  Users,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Sliders,
  Link2,
  Send,
  RefreshCw,
  Building2,
  Activity,
  Award,
  Webhook,
  Play,
  ArrowRight,
  Lock
} from 'lucide-react';

interface PartnerProgramPortalProps {
  currentUser: User | null;
  onOpenAuthModal?: () => void;
  embeddedInLanding?: boolean;
}

export const PartnerProgramPortal: React.FC<PartnerProgramPortalProps> = ({
  currentUser,
  onOpenAuthModal,
  embeddedInLanding = false
}) => {
  const [config, setConfig] = useState<PartnerStackConfig | null>(null);
  const [partners, setPartners] = useState<PartnerStackPartner[]>([]);
  const [events, setEvents] = useState<PartnerStackEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive Calculator State
  const [monthlyContractors, setMonthlyContractors] = useState<number>(8);
  const [monthlyLandlords, setMonthlyLandlords] = useState<number>(4);

  // Partner Application Form State
  const [appName, setAppName] = useState(currentUser?.name || '');
  const [appEmail, setAppEmail] = useState(currentUser?.email || '');
  const [appCompany, setAppCompany] = useState(currentUser?.companyName || '');
  const [appType, setAppType] = useState<'trade_guild' | 'property_agency' | 'mortgage_broker' | 'affiliate_creator'>('trade_guild');
  const [appWebsite, setAppWebsite] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [createdPartner, setCreatedPartner] = useState<PartnerStackPartner | null>(null);

  // Copy states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Admin Config Form State
  const [editPublicKey, setEditPublicKey] = useState('');
  const [editCompanyKey, setEditCompanyKey] = useState('');
  const [editPortalUrl, setEditPortalUrl] = useState('https://dash.partnerstack.com');
  const [editCommissionPct, setEditCommissionPct] = useState(20);
  const [editBountyGBP, setEditBountyGBP] = useState(75);
  const [editEnabled, setEditEnabled] = useState(true);
  const [editTrackEscrow, setEditTrackEscrow] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configNotice, setConfigNotice] = useState<string | null>(null);
  const [isTestingEvent, setIsTestingEvent] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'inspector';
  const token = typeof window !== 'undefined' ? localStorage.getItem('tidy_secure_token') : null;

  const fetchPartnerStackData = async () => {
    try {
      const cfgRes = await fetch('/api/partnerstack/config');
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.config) {
          setConfig(cfgData.config);
          setEditPublicKey(cfgData.config.publicKey || '');
          setEditCompanyKey(cfgData.config.companyKey || '');
          setEditPortalUrl(cfgData.config.partnerPortalUrl || 'https://dash.partnerstack.com');
          setEditCommissionPct(cfgData.config.defaultCommissionPercent ?? 20);
          setEditBountyGBP(cfgData.config.contractorBountyGBP ?? 75);
          setEditEnabled(cfgData.config.enabled !== false);
          setEditTrackEscrow(cfgData.config.trackEscrowFees !== false);
        }
      }

      if (token && currentUser) {
        const headers = { Authorization: `Bearer ${token}` };
        const [pRes, eRes] = await Promise.all([
          fetch('/api/partnerstack/partners', { headers }),
          fetch('/api/partnerstack/events', { headers })
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (Array.isArray(pData.partners)) {
            setPartners(pData.partners);
            if (!isAdmin && pData.partners.length > 0) {
              setCreatedPartner(pData.partners[0]);
            }
          }
        }
        if (eRes.ok) {
          const eData = await eRes.json();
          if (Array.isArray(eData.events)) {
            setEvents(eData.events);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load PartnerStack data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerStackData();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      if (!appName) setAppName(currentUser.name);
      if (!appEmail) setAppEmail(currentUser.email);
      if (!appCompany && currentUser.companyName) setAppCompany(currentUser.companyName);
    }
  }, [currentUser]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleApplyPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    setApplyError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/partnerstack/partners/apply', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: appName,
          email: appEmail,
          companyName: appCompany,
          partnerType: appType,
          website: appWebsite
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit PartnerStack application.');
      }

      setCreatedPartner(data.partner);
      await fetchPartnerStackData();
    } catch (err: any) {
      setApplyError(err?.message || 'Failed to register partner application.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSavingConfig(true);
    setConfigNotice(null);

    try {
      const res = await fetch('/api/partnerstack/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: editEnabled,
          publicKey: editPublicKey,
          companyKey: editCompanyKey,
          partnerPortalUrl: editPortalUrl,
          defaultCommissionPercent: editCommissionPct,
          contractorBountyGBP: editBountyGBP,
          trackEscrowFees: editTrackEscrow
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save configuration.');

      setConfig(data.config);
      setConfigNotice('PartnerStack configuration saved to Firestore.');
      setTimeout(() => setConfigNotice(null), 3500);
    } catch (err: any) {
      setConfigNotice(err?.message || 'Error saving configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleApprovePartner = async (partnerId: string, status: 'approved' | 'active') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/partnerstack/partners/${partnerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchPartnerStackData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchTestEvent = async () => {
    if (!token) return;
    setIsTestingEvent(true);
    try {
      const targetKey = partners[0]?.partnerKey || createdPartner?.partnerKey || 'ps_pk_demo_partner';
      const res = await fetch('/api/partnerstack/test-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerKey: targetKey,
          customerEmail: `referred.${Date.now().toString().slice(-4)}@tidycorp.co.uk`,
          amountGBP: 80.3
        })
      });
      if (res.ok) {
        await fetchPartnerStackData();
      }
    } finally {
      setIsTestingEvent(false);
    }
  };

  // Earnings Calculator Math
  const commissionPct = config?.defaultCommissionPercent ?? 20;
  const bountyGBP = config?.contractorBountyGBP ?? 75;
  const monthlyRecurringPerBatch =
    monthlyContractors * 80.3 * (commissionPct / 100) +
    monthlyLandlords * 99 * (commissionPct / 100);
  const monthlyBounties = monthlyContractors * bountyGBP;
  const annualRecurringCommission = monthlyRecurringPerBatch * 12 * 6.5; // compound 12-mo retention ramp
  const annualTotalBounties = monthlyBounties * 12;
  const estimatedAnnualEarnings = Math.round(annualRecurringCommission + annualTotalBounties);

  const ownPartner =
    createdPartner ||
    partners.find(p => p.email.toLowerCase() === (currentUser?.email || '').toLowerCase()) ||
    null;

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/partnerstack`
      : '/api/webhooks/partnerstack';

  return (
    <div id="partnerstack-portal-section" className="space-y-8 max-w-7xl mx-auto">
      {/* 1. HERO BANNER */}
      <div className="relative bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden text-slate-100">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#0057B8]/25 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#FF7F00]/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center space-x-2 bg-[#0057B8]/20 border border-[#0057B8]/50 text-cyan-300 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
                <Handshake className="h-4 w-4 text-cyan-400" />
                <span>Powered by PartnerStack</span>
              </span>
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold border ${
                config?.isLiveConfigured
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-700 text-amber-300'
              }`}>
                <span className={`h-2 w-2 rounded-full ${config?.isLiveConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span>{config?.isLiveConfigured ? 'PartnerStack API v2 Live' : 'PartnerStack Attribution Ready'}</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Tidy Corp B2B Partner &amp; Trade Affiliate Ecosystem
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Earn <strong className="text-white">{commissionPct}% recurring revenue share</strong> on every contractor, landlord portfolio, and enterprise OS subscription you refer—plus a <strong className="text-[#FF7F00]">£{bountyGBP} activation bounty</strong> per verified trade business, with automated global payouts via PartnerStack.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-xl bg-[#0A1128] border border-slate-800 text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>90-Day Attribution Window</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#0A1128] border border-slate-800 text-cyan-300 flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Stripe &amp; Airwallex S2S Sync</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#0A1128] border border-slate-800 text-amber-300 flex items-center space-x-1.5">
                <PoundSterling className="h-3.5 w-3.5" />
                <span>Direct GBP / Multi-Currency Payouts</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href={config?.partnerPortalUrl || 'https://dash.partnerstack.com'}
              target="_blank"
              rel="noreferrer"
              className="bg-gradient-to-r from-[#0057B8] to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-black px-6 py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>Open PartnerStack Portal</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            {!currentUser && onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-6 py-3 rounded-2xl text-xs border border-slate-700 transition-all flex items-center justify-center space-x-2"
              >
                <span>Sign In to View Partner Stats</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. COMMISSION CALCULATOR + PARTNER APPLICATION / REFERRAL LINK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Interactive Commission Calculator */}
        <div className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 text-slate-100 shadow-xl">
          <div className="space-y-5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-[#FF7F00]/20 border border-amber-500/40 text-[#FF7F00]">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">PartnerStack Earnings Calculator</h3>
                <p className="text-xs text-slate-400">Estimate annual recurring commissions &amp; trade bounties</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Contractors Referred / Month (Journeyman Pro £80.30)</span>
                  <span className="text-cyan-400 font-mono text-sm">{monthlyContractors}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={monthlyContractors}
                  onChange={e => setMonthlyContractors(Number(e.target.value))}
                  className="w-full accent-[#0057B8] cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Landlord Portfolios / Month (Pro £99.00)</span>
                  <span className="text-amber-400 font-mono text-sm">{monthlyLandlords}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={monthlyLandlords}
                  onChange={e => setMonthlyLandlords(Number(e.target.value))}
                  className="w-full accent-[#FF7F00] cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-[#0A1128] border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Monthly Contractor Bounties (£{bountyGBP} each):</span>
                <span className="font-mono font-bold text-amber-400">£{monthlyBounties.toLocaleString()}/mo</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">New Cohort SaaS Commission ({commissionPct}%):</span>
                <span className="font-mono font-bold text-cyan-300">£{monthlyRecurringPerBatch.toFixed(2)}/mo</span>
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 block">Projected Year-1 Earnings</span>
                  <span className="text-3xl font-black text-emerald-400 font-mono">
                    £{estimatedAnnualEarnings.toLocaleString()}
                  </span>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-400/80" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
              <strong className="text-white block mb-0.5">Trade Guilds &amp; Suppliers</strong>
              <span>Refer accredited plumbers, electricians, and damp specialists.</span>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
              <strong className="text-white block mb-0.5">Letting &amp; Mortgage Brokers</strong>
              <span>Earn on portfolio Awaab&apos;s Law &amp; escrow deployments.</span>
            </div>
          </div>
        </div>

        {/* Right: My Partner Dashboard OR Application Form */}
        <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-xl flex flex-col justify-between">
          {ownPartner ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider block">
                    Active PartnerStack Affiliate Profile
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {ownPartner.companyName} ({ownPartner.name})
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300 uppercase">
                  {ownPartner.status}
                </span>
              </div>

              {/* Trackable PartnerStack Referral Link */}
              <div className="bg-[#0A1128] border border-cyan-800/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                    <Link2 className="h-4 w-4" />
                    <span>Your PartnerStack Trackable Referral Link</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Code: <strong className="text-white">{ownPartner.referralCode}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={ownPartner.referralLink}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(ownPartner.referralLink, 'ref_link')}
                    className="bg-[#0057B8] hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all shrink-0"
                  >
                    {copiedKey === 'ref_link' ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedKey === 'ref_link' ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Any user visiting this URL is attributed for 90 days. Signups and Stripe/Airwallex conversions sync automatically to PartnerStack.
                </p>
              </div>

              {/* Funnel KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0A1128] border border-slate-800 rounded-2xl p-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Link Clicks</span>
                  <span className="text-2xl font-black text-white font-mono">{ownPartner.clicksCount}</span>
                </div>
                <div className="bg-[#0A1128] border border-slate-800 rounded-2xl p-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Verified Signups</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono">{ownPartner.signupsCount}</span>
                </div>
                <div className="bg-[#0A1128] border border-slate-800 rounded-2xl p-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Paid Conversions</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">{ownPartner.paidConversionsCount}</span>
                </div>
                <div className="bg-[#0A1128] border border-slate-800 rounded-2xl p-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Earned (GBP)</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    £{(ownPartner.totalCommissionsEarnedGBP || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <span>Partner Key: <code className="text-slate-200">{ownPartner.partnerKey}</code></span>
                <a
                  href={config?.partnerPortalUrl || 'https://dash.partnerstack.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
                >
                  <span>Manage Payouts on PartnerStack</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplyPartner} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-white">Join the Tidy Corp PartnerStack Program</h3>
                  <p className="text-xs text-slate-400">
                    Generate your PartnerStack referral link instantly &amp; start earning {commissionPct}% recurring commissions.
                  </p>
                </div>
                <Award className="h-6 w-6 text-[#FF7F00] shrink-0" />
              </div>

              {applyError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
                  {applyError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    placeholder="e.g. Oliver Bennett"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={appEmail}
                    onChange={e => setAppEmail(e.target.value)}
                    placeholder="e.g. oliver@uktradeguild.co.uk"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Company / Organisation</label>
                  <input
                    type="text"
                    required
                    value={appCompany}
                    onChange={e => setAppCompany(e.target.value)}
                    placeholder="e.g. UK Master Trades Network"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Partner Category</label>
                  <select
                    value={appType}
                    onChange={e => setAppType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                  >
                    <option value="trade_guild">Trade Guild / Merchant Network</option>
                    <option value="property_agency">Letting / Property Management Agency</option>
                    <option value="mortgage_broker">Mortgage &amp; Insurance Broker</option>
                    <option value="affiliate_creator">B2B Affiliate / Media Creator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Website or LinkedIn (Optional)</label>
                <input
                  type="url"
                  value={appWebsite}
                  onChange={e => setAppWebsite(e.target.value)}
                  placeholder="https://yourcompany.co.uk"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isApplying}
                className="w-full bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black py-3.5 px-5 rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isApplying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Activate PartnerStack Account &amp; Get Referral Link</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 3. ADMIN PARTNERSTACK CONTROL PLANE & EVENT LEDGER (Only visible in Dashboard for Admin/Inspector) */}
      {!embeddedInLanding && isAdmin && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <Webhook className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Admin: PartnerStack API &amp; Webhook Control Plane</h3>
                  <p className="text-xs text-slate-400">
                    Manage PartnerStackJS tracking, commission percentages, and Stripe/Airwallex conversion syncing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDispatchTestEvent}
                disabled={isTestingEvent}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isTestingEvent ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                <span>Dispatch Test S2S Conversion</span>
              </button>
            </div>

            {configNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{configNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    PartnerStack Public Key (PartnerStackJS)
                  </label>
                  <input
                    type="text"
                    value={editPublicKey}
                    onChange={e => setEditPublicKey(e.target.value)}
                    placeholder="pk_live_... (or set PARTNERSTACK_PUBLIC_KEY)"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    PartnerStack Company Key
                  </label>
                  <input
                    type="text"
                    value={editCompanyKey}
                    onChange={e => setEditCompanyKey(e.target.value)}
                    placeholder="tidycorp_uk"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    PartnerStack Portal URL
                  </label>
                  <input
                    type="url"
                    value={editPortalUrl}
                    onChange={e => setEditPortalUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Recurring Commission (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editCommissionPct}
                    onChange={e => setEditCommissionPct(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Contractor Bounty (£ GBP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editBountyGBP}
                    onChange={e => setEditBountyGBP(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center space-x-4 py-2">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editEnabled}
                      onChange={e => setEditEnabled(e.target.checked)}
                      className="accent-[#0057B8]"
                    />
                    <span>Tracking Enabled</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editTrackEscrow}
                      onChange={e => setEditTrackEscrow(e.target.checked)}
                      className="accent-[#0057B8]"
                    />
                    <span>Track Escrow Fees</span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="bg-[#0057B8] hover:bg-blue-600 text-white font-black py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {isSavingConfig ? 'Saving...' : 'Save PartnerStack Settings'}
                </button>
              </div>
            </form>

            {/* Webhook Endpoint + Secret Status */}
            <div className="bg-[#0A1128] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Inbound PartnerStack Webhook Endpoint (HMAC-SHA256 Verified)
                </span>
                <code className="text-cyan-300 font-mono break-all">{webhookUrl}</code>
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Secret Key: {config?.hasSecretKey ? 'Configured' : 'Env/Secret Pending'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyText(webhookUrl, 'webhook')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                >
                  {copiedKey === 'webhook' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'webhook' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Partner Applications Directory */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>Registered PartnerStack Partners ({partners.length})</span>
              </h3>
            </div>

            {partners.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                No partner applications recorded yet. Submit the form above to generate your first PartnerStack affiliate link.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 pr-4">Partner / Organisation</th>
                      <th className="py-2.5 pr-4">Code</th>
                      <th className="py-2.5 pr-4">Funnel (Clicks / Signups / Paid)</th>
                      <th className="py-2.5 pr-4">Commission Earned</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {partners.map(p => (
                      <tr key={p.id}>
                        <td className="py-3 pr-4">
                          <div className="font-bold text-white">{p.companyName}</div>
                          <div className="text-slate-400 text-[11px]">{p.name} • {p.email}</div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-cyan-300">{p.referralCode}</td>
                        <td className="py-3 pr-4 font-mono">
                          {p.clicksCount} / {p.signupsCount} / {p.paidConversionsCount}
                        </td>
                        <td className="py-3 pr-4 font-mono font-bold text-emerald-400">
                          £{(p.totalCommissionsEarnedGBP || 0).toFixed(2)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {p.status !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleApprovePartner(p.id, 'active')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Live PartnerStack S2S Event Ledger */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Activity className="h-4 w-4 text-[#FF7F00]" />
              <span>PartnerStack S2S Conversion &amp; Webhook Ledger ({events.length})</span>
            </h3>

            {events.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                No PartnerStack conversion events recorded yet. Click &ldquo;Dispatch Test S2S Conversion&rdquo; above to test attribution.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 pr-4">Event</th>
                      <th className="py-2.5 pr-4">Customer / Partner Key</th>
                      <th className="py-2.5 pr-4">Amount / Commission</th>
                      <th className="py-2.5 pr-4">Sync Status</th>
                      <th className="py-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {events.slice(0, 20).map(ev => (
                      <tr key={ev.id}>
                        <td className="py-2.5 pr-4 font-mono text-cyan-300">{ev.eventType}</td>
                        <td className="py-2.5 pr-4">
                          <div className="text-white">{ev.customerEmail || 'Anonymous Click'}</div>
                          <div className="text-[10px] font-mono text-slate-400">{ev.partnerKey || '-'}</div>
                        </td>
                        <td className="py-2.5 pr-4 font-mono">
                          {ev.amountGBP !== undefined ? (
                            <span className="text-emerald-400 font-bold">
                              £{ev.amountGBP.toFixed(2)} (Comm: £{(ev.commissionGBP || 0).toFixed(2)})
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                            ev.syncStatus === 'live_synced'
                              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                              : ev.syncStatus === 'failed'
                                ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                                : 'bg-amber-950/80 border-amber-700 text-amber-300'
                          }`}>
                            {ev.syncStatus}
                          </span>
                        </td>
                        <td className="py-2.5 text-[11px] font-mono text-slate-400">
                          {new Date(ev.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
