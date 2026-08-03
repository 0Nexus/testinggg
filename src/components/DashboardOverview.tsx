import React from 'react';
import { RenovationProject, PaymentTransaction } from '../types';
import { DollarSign, Calendar, ShieldAlert, ArrowUpRight, CheckCircle2, Zap, Clock, ShieldCheck, ChevronRight, Layers, Sparkles, AlertTriangle, Shield } from 'lucide-react';
import { SmartCalendarAndChecklist } from './SmartCalendarAndChecklist';

interface DashboardOverviewProps {
  projects: RenovationProject[];
  transactions: PaymentTransaction[];
  onOpenNewProject: () => void;
  onSelectProject: (proj: RenovationProject) => void;
  onOpenPortalForMilestone: (project: RenovationProject, milestoneId: string) => void;
  onNavigateTab: (tab: 'urgent_ai' | 'quoting_agent' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  projects,
  transactions,
  onOpenNewProject,
  onSelectProject,
  onOpenPortalForMilestone,
  onNavigateTab
}) => {
  // Financial calculations
  const totalContractValue = projects.reduce((acc, p) => acc + p.totalAmount, 0);

  let totalCollected = 0;
  let totalPendingAirwallex = 0;
  let totalPendingStripe = 0;
  let airwallexMilestoneCount = 0;
  let stripeMilestoneCount = 0;

  projects.forEach(p => {
    p.milestones.forEach(m => {
      if (m.status === 'paid') {
        totalCollected += m.amount;
      } else {
        if (m.assignedGateway === 'airwallex') {
          totalPendingAirwallex += m.amount;
          airwallexMilestoneCount++;
        } else {
          totalPendingStripe += m.amount;
          stripeMilestoneCount++;
        }
      }
    });
  });

  const estimatedFeeSavings = Math.round(totalPendingAirwallex * 0.015);

  return (
    <div id="dashboard-overview-container" className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner with Tidy Corp Palette & Refactored Copy */}
      <div id="mcp-solution-banner" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#0057B8]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-[#0057B8]/30 text-blue-300 text-xs px-3 py-1 rounded-full font-bold border border-blue-400/30">
              <Shield className="h-3.5 w-3.5 text-[#FF7F00]" />
              <span>Tidy Secure Pay &bull; Your Business Performance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              UK Renovation &amp; Property Maintenance Hub
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed">
              Track progress payments, manage 90-day milestone escrows, monitor Awaab's law statutory response countdowns, and equalize gateway fees across all renovation projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              id="btn-create-project-banner"
              onClick={onOpenNewProject}
              className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center space-x-2 shrink-0"
            >
              <span>+ New Contract Plan</span>
            </button>
            <button
              onClick={() => onNavigateTab('compliance')}
              className="bg-[#0057B8] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow transition-all flex items-center space-x-1.5 shrink-0"
            >
              <AlertTriangle className="h-4 w-4 text-[#FF7F00]" />
              <span>Awaab's Law Hazards</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div id="kpi-card-total-pipeline" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Contract Pipeline</span>
            <div className="p-2.5 bg-blue-50 text-[#0057B8] rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">£{totalContractValue.toLocaleString()}</div>
            <div className="mt-1 flex items-center text-xs text-slate-600 font-medium">
              <span className="text-emerald-600 font-bold flex items-center mr-1">
                <ArrowUpRight className="h-3.5 w-3.5" /> £{totalCollected.toLocaleString()}
              </span>
              collected in escrow
            </div>
          </div>
        </div>

        <div id="kpi-card-airwallex-longterm" className="bg-white rounded-2xl p-5 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-cyan-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider">Long-Term Schedule (&gt;90d)</span>
            <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">£{totalPendingAirwallex.toLocaleString()}</div>
            <div className="mt-1 text-xs text-cyan-800 font-bold">
              {airwallexMilestoneCount} Airwallex Direct Debit installments
            </div>
          </div>
        </div>

        <div id="kpi-card-stripe-shortterm" className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#0057B8]"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Short-Term Escrow (&le;90d)</span>
            <div className="p-2.5 bg-blue-50 text-[#0057B8] rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">£{totalPendingStripe.toLocaleString()}</div>
            <div className="mt-1 text-xs text-blue-800 font-bold">
              {stripeMilestoneCount} Stripe Connect deposit milestones
            </div>
          </div>
        </div>

        <div id="kpi-card-fee-savings" className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Projected Fee Savings</span>
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-950">£{estimatedFeeSavings.toLocaleString()}</div>
            <div className="mt-1 text-xs text-emerald-800 font-bold">
              Equalized cost-sharing applied
            </div>
          </div>
        </div>
      </div>

      {/* Awaab's Law Live Quick Triage Notice */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
              Awaab's Law Emergency Hazards Active
            </h3>
            <p className="text-xs text-amber-900 font-medium">
              2 properties require 24-hour emergency make-safe interventions and damp/mould moisture mapping.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('compliance')}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shrink-0"
        >
          Assess My Repair Needs &rarr;
        </button>
      </div>

      {/* PROMOTED: Smart Calendar and Checklist Block */}
      <SmartCalendarAndChecklist
        projects={projects}
        onSelectProject={onSelectProject}
        onOpenPortalForMilestone={onOpenPortalForMilestone}
      />

      {/* Main Grid: Active Renovation Projects & Upcoming Installments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Projects List */}
        <div id="active-projects-panel" className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Track Project Progress</h2>
              <p className="text-xs text-slate-600 font-medium">Click any project to view site photos, milestones, or dispute logs</p>
            </div>
            <button
              id="btn-add-project-overview"
              onClick={onOpenNewProject}
              className="text-xs font-bold text-[#0057B8] hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Project
            </button>
          </div>

          <div className="space-y-4">
            {projects.map(proj => {
              const paidAmount = proj.milestones.filter(m => m.status === 'paid').reduce((a, b) => a + b.amount, 0);
              const progressPct = Math.round((paidAmount / proj.totalAmount) * 100);

              return (
                <div
                  key={proj.id}
                  id={`project-card-${proj.id}`}
                  className="group bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl p-5 transition-all cursor-pointer hover:border-[#0057B8]"
                  onClick={() => onSelectProject(proj)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-base group-hover:text-[#0057B8] transition-colors">
                          {proj.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-800">
                          {proj.estimatedDurationMonths} mo contract
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Client: <span className="font-bold text-slate-800">{proj.clientName}</span> ({proj.clientEmail})
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="font-extrabold text-slate-900 text-base">
                          £{proj.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-700 font-extrabold">
                          £{paidAmount.toLocaleString()} paid ({progressPct}%)
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-[#0057B8] transition-colors" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 space-y-1">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Routing Feed */}
        <div id="routing-milestones-panel" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">Upcoming Escrows</h2>
            <p className="text-xs text-slate-600 font-medium font-sans">Payment status per milestone stage</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {projects.flatMap(p => p.milestones.map(m => ({ milestone: m, project: p })))
              .filter(item => item.milestone.status !== 'paid')
              .slice(0, 6)
              .map(({ milestone, project }) => (
                <div
                  key={milestone.id}
                  id={`milestone-item-${milestone.id}`}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 space-y-2 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1">{milestone.title}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{project.title}</div>
                    </div>
                    <div className="text-right font-black text-xs text-slate-900">
                      £{milestone.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center space-x-1">
                      {milestone.assignedGateway === 'airwallex' ? (
                        <span className="inline-flex items-center space-x-1 text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded font-bold border border-cyan-300">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Direct Debit (&gt;90d)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-blue-900 bg-blue-100 px-2 py-0.5 rounded font-bold border border-blue-300">
                          <Clock className="h-3 w-3" />
                          <span>90d Escrow</span>
                        </span>
                      )}
                    </div>

                    <button
                      id={`btn-pay-link-${milestone.id}`}
                      onClick={() => onOpenPortalForMilestone(project, milestone.id)}
                      className="text-[#0057B8] font-bold hover:underline flex items-center space-x-0.5"
                    >
                      <span>Checkout Link</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Transactions History Feed */}
      <div id="recent-transactions-panel" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Recent Settled Payments &amp; Fee Equalization</h2>
            <p className="text-xs text-slate-600 font-medium">Verified payment settlements with equalized cost-sharing breakdown</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Ref ID</th>
                <th className="p-3">Project &amp; Client</th>
                <th className="p-3">Milestone Stage</th>
                <th className="p-3">Method</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.map(tx => (
                <tr key={tx.id} id={`tx-row-${tx.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-600">{tx.gatewayRef}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{tx.projectTitle}</div>
                    <div className="text-[11px] text-slate-500">{tx.clientName}</div>
                  </td>
                  <td className="p-3 text-slate-800 font-semibold">{tx.milestoneTitle}</td>
                  <td className="p-3">
                    {tx.gateway === 'airwallex' ? (
                      <span className="inline-flex items-center space-x-1 text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded font-bold border border-cyan-300">
                        <span>Direct Debit</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-blue-900 bg-blue-100 px-2 py-0.5 rounded font-bold border border-blue-300">
                        <span>Stripe Escrow</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-extrabold text-slate-900">
                    £{tx.amount.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Settled</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


