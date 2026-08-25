import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Clock,
  PoundSterling,
  Upload,
  X,
  Plus,
  Trash2,
  FileText,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  TrendingDown,
  Info,
  BadgeCheck,
  Layers,
  MapPin,
  ArrowRight,
  Globe
} from 'lucide-react';
import { QuotingAgentResponse, QuoteMaterialItem, QuoteLaborItem, RenovationProject, User } from '../types';
import { WebContractorDiscoveryModal } from './WebContractorDiscoveryModal';

interface QuotingAgentProps {
  currentUser: User | null;
  onProjectCreated: (project: RenovationProject) => void;
  onOpenProjectDetail?: (project: RenovationProject) => void;
}

export const QuotingAgent: React.FC<QuotingAgentProps> = ({
  currentUser,
  onProjectCreated,
  onOpenProjectDetail
}) => {
  // Input Form States
  const [projectTitle, setProjectTitle] = useState('Damp & Mould Remediation - Social Housing Flat');
  const [tradeCategory, setTradeCategory] = useState('Damp & Mould Remediation');
  const [region, setRegion] = useState('Greater London & South East');
  const [urgency, setUrgency] = useState<'standard' | 'priority' | 'emergency'>('priority');
  const [preferredMerchant, setPreferredMerchant] = useState<'Auto-Lowest Price' | 'Travis Perkins' | 'Screwfix' | 'Jewson' | 'City Plumbing' | 'Selco'>('Auto-Lowest Price');
  const [description, setDescription] = useState(
    'Remediate severe Category 1 damp and mould in rear bedroom and kitchen. Install structural anti-mould tanking membrane, high-output humidistat extractor fan, and apply anti-fungal thermal barrier plasterboard.'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuotingAgentResponse | null>(null);

  // Modal / PO Export State
  const [showPOModal, setShowPOModal] = useState(false);
  const [showWebDiscoveryModal, setShowWebDiscoveryModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preset Template Handler
  const presetQuotes = [
    {
      title: "Awaab's Law Damp & Mould Remediation",
      category: 'Damp & Mould Remediation',
      region: 'Greater London & South East',
      urgency: 'priority' as const,
      description: 'Remediate Category 1 damp in bedroom & kitchen. Install dual anti-condensation tanking membrane, high-output humidistat extractor, thermal plasterboard lining, and moldicide wash.'
    },
    {
      title: 'Gas Safe Emergency Boiler & System Upgrade',
      category: 'Boiler & Heating Installation',
      region: 'West Midlands',
      urgency: 'emergency' as const,
      description: 'Replace faulty A-rated combi boiler with 30kW Worcester Bosch unit, flush heating circuit, install magnetic filter, wireless smart thermostat, and issue Gas Safe CP12 certificate.'
    },
    {
      title: '17th Edition Consumer Unit & Full Rewire',
      category: 'Electrical Rewire',
      region: 'North West',
      urgency: 'standard' as const,
      description: 'Upgrade legacy fuse box to Metal RCD Consumer Unit with Surge Protection Device. Complete 1st & 2nd fix wiring for 3-bed terraced house and issue NIC EIC Electrical Installation Certificate.'
    },
    {
      title: 'Structural Steel RSJ & Open-Plan Kitchen',
      category: 'Structural Steel & Open Plan',
      region: 'Greater London & South East',
      urgency: 'standard' as const,
      description: 'Remove load-bearing partition wall, supply & install structural steel RSJ beam, temporary acrow props support, padstones, fire-cladding, and building control inspection sign-off.'
    }
  ];

  const handleSelectPreset = (preset: typeof presetQuotes[0]) => {
    setProjectTitle(preset.title);
    setTradeCategory(preset.category);
    setRegion(preset.region);
    setUrgency(preset.urgency);
    setDescription(preset.description);
  };

  // Generate Quote API Call
  const handleGenerateQuote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem('tidy_secure_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/ai/quoting-agent', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectTitle,
          tradeCategory,
          region,
          description,
          urgency,
          preferredMerchant
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Failed to calculate trade quote.');
      } else {
        setQuoteResult(data);
        if (data.remainingCredits !== undefined && currentUser?.subscription) {
          currentUser.subscription.remainingCredits = data.remainingCredits;
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Network error connecting to Quoting Agent.');
    } finally {
      setIsLoading(false);
    }
  };

  // Line Item Modifications
  const handleUpdateMaterialQty = (id: string, newQty: number) => {
    if (!quoteResult) return;
    const updatedList = quoteResult.materialsList.map(item => {
      if (item.id === id) {
        const qty = Math.max(1, newQty);
        return {
          ...item,
          quantity: qty,
          totalPriceGBP: Math.round(qty * item.unitPriceGBP)
        };
      }
      return item;
    });

    const newMatTotal = updatedList.reduce((sum, item) => sum + item.totalPriceGBP, 0);
    const newRecommended = newMatTotal + quoteResult.laborTotalGBP + quoteResult.statutoryContingencyGBP + quoteResult.platformFeeGBP;

    setQuoteResult({
      ...quoteResult,
      materialsList: updatedList,
      materialsTotalGBP: newMatTotal,
      recommendedTotalGBP: newRecommended
    });
  };

  const handleUpdateLaborHours = (id: string, newHours: number) => {
    if (!quoteResult) return;
    const updatedList = quoteResult.laborList.map(item => {
      if (item.id === id) {
        const hrs = Math.max(1, newHours);
        return {
          ...item,
          requiredHours: hrs,
          totalLaborGBP: Math.round(hrs * item.hourlyRateGBP)
        };
      }
      return item;
    });

    const newLaborTotal = updatedList.reduce((sum, item) => sum + item.totalLaborGBP, 0);
    const newRecommended = quoteResult.materialsTotalGBP + newLaborTotal + quoteResult.statutoryContingencyGBP + quoteResult.platformFeeGBP;

    setQuoteResult({
      ...quoteResult,
      laborList: updatedList,
      laborTotalGBP: newLaborTotal,
      recommendedTotalGBP: newRecommended
    });
  };

  // Convert Quote to Active Escrow Project
  const handleConvertToEscrowProject = async () => {
    if (!quoteResult) return;

    try {
      const token = localStorage.getItem('tidy_secure_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: quoteResult.projectTitle,
          clientName: currentUser?.name || 'Homeowner Client',
          clientEmail: currentUser?.email || '',
          clientId: currentUser?.id || '',
          totalAmount: quoteResult.recommendedTotalGBP,
          currency: 'GBP',
          startDate: new Date().toISOString().split('T')[0],
          estimatedDurationMonths: Math.max(1, Math.ceil(quoteResult.estimatedDaysToComplete / 30)),
          notes: `Created via Tidy AI Quoting Agent. Trade: ${quoteResult.tradeCategory}. Region: ${quoteResult.region}.`,
          milestones: quoteResult.suggestedMilestones.map((m, idx) => ({
            id: `ms-q-${Date.now()}-${idx}`,
            title: m.title,
            description: m.reason,
            amount: m.amountGBP,
            percentage: m.percentage,
            dueDate: new Date(Date.now() + (m.durationDaysFromStart || idx * 7) * 86400000).toISOString().split('T')[0],
            durationDaysFromStart: m.durationDaysFromStart,
            status: 'pending' as const,
            assignedGateway: m.recommendedGateway,
            gatewayReason: m.reason
          }))
        })
      });

      if (res.ok) {
        const newProject = await res.json();
        onProjectCreated(newProject);
        setToastMessage('Quote successfully converted into active Tidy Secure Pay escrow project!');
        setTimeout(() => setToastMessage(null), 4000);
        if (onOpenProjectDetail) {
          onOpenProjectDetail(newProject);
        }
      }
    } catch (err) {
      console.error('Error creating project from quote:', err);
    }
  };

  return (
    <div id="quoting-agent-container" className="max-w-6xl mx-auto space-y-8 font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-bold text-xs">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-[#FF7F00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-3 relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-[#FF7F00]/20 text-[#FF7F00] text-xs px-3 py-1 rounded-full font-extrabold border border-[#FF7F00]/30 uppercase tracking-wider">
            <Calculator className="h-3.5 w-3.5 text-[#FF7F00]" />
            <span>Google AI Studio Multi-Agent Mesh: Quoting Agent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trade Merchant API &amp; Fair-Market Quoting Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Evaluates real-time UK trade merchant pricing across <strong>Travis Perkins, Screwfix, Jewson, City Plumbing, &amp; Selco</strong>. Combines regional labor rate matrices, BSA 2022 statutory compliance buffers, and predatory pricing detection with 1-click escrow contract creation.
          </p>
        </div>
      </div>

      {/* Preset Scope Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              PRESET UK TRADE SCOPES
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Select a benchmark trade project to populate merchant materials and labor matrices
            </p>
          </div>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
            Live Pricing API Connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presetQuotes.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className="text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-all group space-y-2 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0057B8] bg-blue-100 px-2 py-0.5 rounded-md">
                  {preset.category}
                </span>
                <h3 className="font-extrabold text-slate-900 text-xs mt-2 group-hover:text-[#0057B8] transition-colors line-clamp-2">
                  {preset.title}
                </h3>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold pt-2 border-t border-slate-200/60">
                <span>{preset.region}</span>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scope Input Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-[#0057B8]" />
            <h2 className="text-base font-black text-slate-900">Calculate AI Fair-Market Quote</h2>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Step 1 of 2: Define Job &amp; Merchant Preference
          </span>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs p-4 rounded-2xl flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleGenerateQuote} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Project / Job Title</label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                placeholder="e.g. Category 1 Damp & Mould Remediation"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Trade Category</label>
              <select
                value={tradeCategory}
                onChange={e => setTradeCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
              >
                <option value="Damp & Mould Remediation">Damp &amp; Mould Remediation (Awaab's Law)</option>
                <option value="Boiler & Heating Installation">Boiler &amp; Heating Installation (Gas Safe)</option>
                <option value="Electrical Rewire">Electrical Rewire (NIC EIC / 17th Ed)</option>
                <option value="Structural Steel & Open Plan">Structural Steel RSJ &amp; Open Plan (BSA 2022)</option>
                <option value="Bathroom Overhaul">Bathroom Overhaul &amp; Plumbing</option>
                <option value="Kitchen Renovation">Kitchen Renovation &amp; Cabinetry</option>
                <option value="Roofing & Waterproofing">Roofing &amp; Waterproofing</option>
                <option value="General Trades">General Trade &amp; Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">UK Region (Labour Index)</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
              >
                <option value="Greater London & South East">Greater London &amp; South East (+25% Rate)</option>
                <option value="West Midlands">West Midlands (Standard Rate)</option>
                <option value="North West">North West (Standard Rate)</option>
                <option value="Yorkshire & Humber">Yorkshire &amp; Humber</option>
                <option value="Scotland">Scotland</option>
                <option value="Wales">Wales</option>
                <option value="Northern Ireland">Northern Ireland</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Urgency &amp; SLA Mandate</label>
              <select
                value={urgency}
                onChange={e => setUrgency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
              >
                <option value="standard">Standard Renovation (30 Days)</option>
                <option value="priority">Priority Repair (3-7 Days)</option>
                <option value="emergency">Emergency Hazard (24h Turnaround)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Preferred Trade Merchant</label>
              <select
                value={preferredMerchant}
                onChange={e => setPreferredMerchant(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
              >
                <option value="Auto-Lowest Price">Auto-Lowest Price (API Compare)</option>
                <option value="Travis Perkins">Travis Perkins</option>
                <option value="Screwfix">Screwfix</option>
                <option value="Jewson">Jewson</option>
                <option value="City Plumbing">City Plumbing</option>
                <option value="Selco">Selco Builders Warehouse</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Detailed Scope &amp; Technical Requirements
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe dimensions, materials, wall surfaces, access limitations, or statutory requirements..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Includes BSA 2022 &amp; Awaab's Law statutory compliance buffer</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-[#0057B8] to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg transition-all flex items-center space-x-2 shrink-0 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Querying Merchant APIs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#FF7F00]" />
                  <span>Generate AI Fair-Market Quote</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Quote Result Display */}
      {quoteResult && (
        <div id="quote-results-display" className="space-y-8 animate-fadeIn">
          {/* Executive Overview Header */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-[#0057B8] text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-md">
                    Verified AI Quote #{quoteResult.id.substring(0, 12)}
                  </span>
                  {quoteResult.fairMarketStatus === 'fair_market' && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Fair Market Compliant</span>
                    </span>
                  )}
                  {quoteResult.fairMarketStatus === 'under_scoped_risk' && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span>Under-Scoped Risk</span>
                    </span>
                  )}
                  {quoteResult.fairMarketStatus === 'predatory_overcharge' && (
                    <span className="bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span>Predatory Pricing Warning</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900">{quoteResult.projectTitle}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Trade Category: <strong>{quoteResult.tradeCategory}</strong> | Location Index: <strong>{quoteResult.region}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => setShowWebDiscoveryModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <span>Scrape Online &amp; Invite Companies</span>
                </button>

                <button
                  onClick={() => setShowPOModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-all"
                >
                  <FileText className="h-4 w-4 text-slate-700" />
                  <span>Export Purchase Order</span>
                </button>

                <button
                  onClick={handleConvertToEscrowProject}
                  className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                >
                  <span>Convert to Escrow Contract</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Total</span>
                <div className="text-2xl font-black text-white">
                  £{quoteResult.recommendedTotalGBP.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-400 font-bold block">
                  Fair Range: £{quoteResult.fairMarketRangeMinGBP.toLocaleString()} - £{quoteResult.fairMarketRangeMaxGBP.toLocaleString()}
                </span>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">Trade Materials</span>
                <div className="text-xl font-black text-slate-900">
                  £{quoteResult.materialsTotalGBP.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {quoteResult.materialsList.length} Merchant Line Items
                </span>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">Labor &amp; Trade Rates</span>
                <div className="text-xl font-black text-slate-900">
                  £{quoteResult.laborTotalGBP.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {quoteResult.laborList.reduce((acc, l) => acc + l.requiredHours, 0)} Total Labor Hours
                </span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">Statutory Buffer &amp; Fee</span>
                <div className="text-xl font-black text-slate-900">
                  £{(quoteResult.statutoryContingencyGBP + quoteResult.platformFeeGBP).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  15% Escrow Hold + BSA Buffer
                </span>
              </div>
            </div>
          </div>

          {/* Trade Merchant API Comparison Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-[#0057B8]" />
                <h3 className="text-sm font-black text-slate-900">
                  UK Trade Merchant Pricing Comparison
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                Evaluated for local branch availability
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {quoteResult.merchantComparisons.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    m.recommended
                      ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400/30'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{m.merchantName}</span>
                    {m.recommended && (
                      <span className="bg-emerald-600 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-md">
                        Lowest Cost
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    £{m.totalMaterialsGBP.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/50">
                    <span>{m.deliveryTime}</span>
                    <span className={`font-bold ${m.priceDifferencePct < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {m.priceDifferencePct > 0 ? `+${m.priceDifferencePct}%` : `${m.priceDifferencePct}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Bill of Quantities (BOQ) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-[#0057B8]" />
                <span>Itemized Bill of Quantities (Materials)</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                Editable Quantity &amp; Unit Rates
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-black text-[10px]">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Merchant &amp; SKU</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total (£)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteResult.materialsList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 font-medium">
                      <td className="py-3 px-3 font-bold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{item.merchant}</span>
                        <span className="text-[10px] text-slate-400 block">{item.sku}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{item.category}</td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => handleUpdateMaterialQty(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 bg-slate-100 border border-slate-300 rounded-lg py-1 px-2 text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        £{item.unitPriceGBP.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        £{item.totalPriceGBP.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Labor & Specialist Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#0057B8]" />
                <span>Trade Labor &amp; Specialist Qualifications</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                Calibrated to regional rate index ({quoteResult.region})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-black text-[10px]">
                    <th className="py-2.5 px-3">Trade Specialist Role</th>
                    <th className="py-2.5 px-3">Required Qualification</th>
                    <th className="py-2.5 px-3 text-center">Hours</th>
                    <th className="py-2.5 px-3 text-right">Hourly Rate</th>
                    <th className="py-2.5 px-3 text-right">Subtotal (£)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quoteResult.laborList.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 font-medium">
                      <td className="py-3 px-3 font-bold text-slate-900">{item.tradeRole}</td>
                      <td className="py-3 px-3 text-slate-600">
                        <span className="inline-flex items-center space-x-1 bg-cyan-50 text-cyan-900 border border-cyan-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          <BadgeCheck className="h-3 w-3 text-cyan-600" />
                          <span>{item.qualificationRequired}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.requiredHours}
                          onChange={e => handleUpdateLaborHours(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 bg-slate-100 border border-slate-300 rounded-lg py-1 px-2 text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        £{item.hourlyRateGBP}/hr
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        £{item.totalLaborGBP.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Escrow Milestone & Gateway Auto-Routing */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Tidy Secure Pay Escrow Milestone Schedule
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Auto-routed to Stripe (&le;90d) or Airwallex (&gt;90d) based on installment duration
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quoteResult.suggestedMilestones.map((m, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-900">{m.title}</span>
                    <span className="bg-[#0057B8]/10 text-[#0057B8] font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                      {m.recommendedGateway}
                    </span>
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    £{m.amountGBP.toLocaleString()} <span className="text-xs text-slate-500 font-semibold">({m.percentage}%)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{m.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Printable Purchase Order (PO) Modal */}
      {showPOModal && quoteResult && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-[#0057B8] text-white rounded-xl flex items-center justify-center font-black">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Formal Purchase Order &amp; Trade Specification
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">PO #{quoteResult.id.toUpperCase()}</p>
                </div>
              </div>

              <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Project Title: {quoteResult.projectTitle}</span>
                <span>Date: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <p className="text-slate-600">Location Index: {quoteResult.region} | Category: {quoteResult.tradeCategory}</p>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900">Materials Bill of Quantities</h4>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {quoteResult.materialsList.map(m => (
                  <li key={m.id} className="p-3 flex justify-between items-center bg-white">
                    <div>
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-[10px] text-slate-500 block">{m.merchant} SKU: {m.sku} | Qty: {m.quantity} {m.unit}</span>
                    </div>
                    <span className="font-black text-slate-900">£{m.totalPriceGBP.toLocaleString()}</span>
                  </li>
                ))}
              </ul>

              <h4 className="font-extrabold text-slate-900 pt-2">Labor Schedule</h4>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {quoteResult.laborList.map(l => (
                  <li key={l.id} className="p-3 flex justify-between items-center bg-white">
                    <div>
                      <span className="font-bold text-slate-900">{l.tradeRole} ({l.qualificationRequired})</span>
                      <span className="text-[10px] text-slate-500 block">{l.requiredHours} Hours @ £{l.hourlyRateGBP}/hr</span>
                    </div>
                    <span className="font-black text-slate-900">£{l.totalLaborGBP.toLocaleString()}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Escrow Quote:</span>
                <span className="text-xl text-[#0057B8]">£{quoteResult.recommendedTotalGBP.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => {
                  setShowPOModal(false);
                  handleConvertToEscrowProject();
                }}
                className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all"
              >
                Create Escrow Contract Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Contractor Discovery Modal */}
      <WebContractorDiscoveryModal
        isOpen={showWebDiscoveryModal}
        onClose={() => setShowWebDiscoveryModal(false)}
        initialTradeCategory={quoteResult?.tradeCategory || tradeCategory}
        initialLocation={quoteResult?.region || region}
        initialJobTitle={quoteResult?.projectTitle || projectTitle}
        initialBudgetGBP={quoteResult?.recommendedTotalGBP || 3500}
        currentUser={currentUser}
      />
    </div>
  );
};
