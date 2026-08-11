import React, { useState, useEffect } from 'react';
import { RenovationProject, Milestone } from '../types';
import { StructuredFrictionHoldButton } from './StructuredFrictionHoldButton';
import {
  X,
  User,
  Mail,
  MapPin,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Bell,
  BellOff,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Check,
  Camera,
  ShieldAlert,
  Coins,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: RenovationProject | null;
  onClose: () => void;
  onOpenPortalForMilestone: (project: RenovationProject, milestoneId: string) => void;
  onUpdateProject?: (updatedProject: RenovationProject) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onOpenPortalForMilestone,
  onUpdateProject
}) => {
  if (!project) return null;

  // Local state for schedule mode selection: 'standard' vs 'long_term'
  const [scheduleMode, setScheduleMode] = useState<'standard' | 'long_term'>(
    project.scheduleType || 'standard'
  );

  // Toast feedback message when toggling reminders or changing settings
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State for Extra Pay Request Form Modal
  const [showExtraPayModal, setShowExtraPayModal] = useState(false);
  const [extraAmount, setExtraAmount] = useState(150);
  const [extraReason, setExtraReason] = useState('');
  const [extraMediaUrl, setExtraMediaUrl] = useState('');
  const [extraMediaType, setExtraMediaType] = useState<'image' | 'video'>('image');
  const [isSubmittingExtra, setIsSubmittingExtra] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('tidy_secure_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const handleContractorResponse = async (status: 'accepted' | 'declined') => {
    try {
      const res = await fetch(`/api/projects/${project.id}/contractor-status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const updatedProj = await res.json();
        if (onUpdateProject) onUpdateProject(updatedProj);
        setToastMessage(`Job request ${status.toUpperCase()} successfully.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateExtraPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraReason.trim() || !extraAmount) return;

    setIsSubmittingExtra(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/extra-pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          requestedBy: project.assignedContractorName || 'Assigned Contractor',
          contractorId: project.assignedContractorId,
          amountGBP: Number(extraAmount),
          reason: extraReason,
          media: extraMediaUrl ? [{
            id: `media-${Date.now()}`,
            url: extraMediaUrl,
            type: extraMediaType,
            caption: 'Contractor uploaded evidence of additional required scope'
          }] : []
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (onUpdateProject) onUpdateProject(data.project);
        setShowExtraPayModal(false);
        setExtraReason('');
        setToastMessage('Extra Pay Request submitted to Homeowner for escrow approval.');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingExtra(false);
    }
  };

  const handleReviewExtraPay = async (extraId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/projects/${project.id}/extra-pay/${extraId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        if (onUpdateProject) onUpdateProject(data.project);
        setToastMessage(`Extra Pay Request ${status.toUpperCase()}. Total budget updated.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dispute Modal state & handlers
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputingMilestoneId, setDisputingMilestoneId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('Substandard Work Quality / Incomplete Work');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeImageUrl, setDisputeImageUrl] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}/complete`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (onUpdateProject) onUpdateProject(data.project);
        setToastMessage('Work marked as completed. 48-Hour Escrow Release timer started!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseEscrow = async (milestoneId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}/release`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (onUpdateProject) onUpdateProject(data.project);
        setToastMessage('Payment Released! 15% Platform Fee deducted, 85% transferred to contractor.');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDispute = (milestoneId: string) => {
    setDisputingMilestoneId(milestoneId);
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputingMilestoneId || !disputeDescription.trim()) return;

    setIsSubmittingDispute(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${disputingMilestoneId}/dispute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          reason: disputeReason,
          description: disputeDescription,
          images: disputeImageUrl ? [disputeImageUrl] : []
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (onUpdateProject) onUpdateProject(data.project);
        setShowDisputeModal(false);
        setDisputeDescription('');
        setDisputeImageUrl('');
        setToastMessage('Work contested. Escalated to Admin for 48h dispute review.');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleAdminResolveDispute = async (milestoneId: string, adminDecision: 'contractor_revisit' | 'release_funds' | 'refund_client', adminNotes: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}/admin-resolve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminDecision, adminNotes })
      });
      if (res.ok) {
        const data = await res.json();
        if (onUpdateProject) onUpdateProject(data.project);
        setToastMessage(`Admin Decision applied: ${adminDecision.replace('_', ' ').toUpperCase()}`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to generate a long-term extended installment schedule if requested
  const generateLongTermSchedule = (proj: RenovationProject): Milestone[] => {
    const totalMonths = proj.estimatedDurationMonths || 12;
    const numInstallments = Math.max(6, Math.min(totalMonths, 18));
    const depositPct = 15;
    const remainingPct = 100 - depositPct;
    const monthlyPct = Math.round((remainingPct / (numInstallments - 1)) * 100) / 100;

    const depositAmount = Math.round(proj.totalAmount * (depositPct / 100));
    const monthlyAmount = Math.round((proj.totalAmount - depositAmount) / (numInstallments - 1));

    const startDateObj = new Date(proj.startDate || Date.now());

    const result: Milestone[] = [];

    // Deposit installment (Month 0 / Day 0)
    result.push({
      id: `${proj.id}-lt-01`,
      title: 'Month 1: Upfront Deposit & Site Commencement',
      description: 'Initial project setup, architectural submittals, and material orders.',
      amount: depositAmount,
      percentage: depositPct,
      dueDate: proj.startDate,
      durationDaysFromStart: 0,
      status: proj.milestones[0]?.status || 'paid',
      assignedGateway: 'stripe',
      gatewayReason: 'Short-term initial deposit (< 30 days) processed via Stripe Escrow.',
      emailReminderEnabled: true
    });

    // Monthly extended installments
    for (let i = 1; i < numInstallments; i++) {
      const days = i * 30;
      const dueDate = new Date(startDateObj.getTime() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const isAirwallex = days > 90;

      result.push({
        id: `${proj.id}-lt-${i + 1}`,
        title: `Month ${i + 1}: Extended Installment #${i}`,
        description: `Scheduled monthly installment for Phase ${i} works.`,
        amount: monthlyAmount,
        percentage: monthlyPct,
        dueDate,
        durationDaysFromStart: days,
        status: i === 1 && proj.milestones[1]?.status === 'paid' ? 'paid' : 'pending',
        assignedGateway: isAirwallex ? 'airwallex' : 'stripe',
        gatewayReason: isAirwallex
          ? `Duration ${days} days (> 90 days limit). Airwallex Direct Debit locks in long-term schedule.`
          : `Duration ${days} days (<= 90 days). Stripe short-term escrow processing.`,
        emailReminderEnabled: i <= 3
      });
    }

    return result;
  };

  // Determine active milestones based on toggle schedule mode
  const displayedMilestones =
    scheduleMode === 'long_term'
      ? generateLongTermSchedule(project)
      : project.milestones;

  // Calculate stats
  const paidAmount = displayedMilestones
    .filter(m => m.status === 'paid')
    .reduce((a, b) => a + b.amount, 0);
  const remainingAmount = project.totalAmount - paidAmount;
  const progressPct = Math.round((paidAmount / project.totalAmount) * 100);
  const activeRemindersCount = displayedMilestones.filter(m => m.emailReminderEnabled).length;

  // Toggle email reminder checkbox handler
  const handleToggleReminder = (milestoneId: string) => {
    let milestoneTitle = '';
    let newStatus = false;

    const updatedMilestones = project.milestones.map(m => {
      if (m.id === milestoneId) {
        milestoneTitle = m.title;
        newStatus = !m.emailReminderEnabled;
        return { ...m, emailReminderEnabled: newStatus };
      }
      return m;
    });

    // If milestone isn't in standard project.milestones yet (e.g. in long-term mode), add/update it
    const exists = project.milestones.some(m => m.id === milestoneId);
    let finalMilestones = updatedMilestones;

    if (!exists) {
      const target = displayedMilestones.find(m => m.id === milestoneId);
      if (target) {
        milestoneTitle = target.title;
        newStatus = !target.emailReminderEnabled;
        const updatedTarget = { ...target, emailReminderEnabled: newStatus };
        finalMilestones = [...project.milestones, updatedTarget];
      }
    }

    const updatedProject: RenovationProject = {
      ...project,
      milestones: finalMilestones
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }

    setToastMessage(
      `Automated email reminder ${newStatus ? 'ENABLED' : 'DISABLED'} for "${milestoneTitle}"`
    );
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Apply schedule mode to project
  const handleApplyScheduleType = (mode: 'standard' | 'long_term') => {
    setScheduleMode(mode);
    const updatedProject: RenovationProject = {
      ...project,
      scheduleType: mode,
      milestones: mode === 'long_term' ? generateLongTermSchedule(project) : project.milestones
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }

    setToastMessage(`Project schedule set to ${mode === 'long_term' ? 'Long-Term Extended' : 'Standard Progress'} Schedule`);
    setTimeout(() => setToastMessage(null), 3200);
  };

  return (
    <div
      id="project-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="project-detail-modal-content"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-[#0057B8]/30 text-blue-300 font-mono px-2.5 py-0.5 rounded border border-blue-400/30">
                {project.id}
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
                {project.status}
              </span>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 font-bold px-2.5 py-0.5 rounded border border-cyan-400/30">
                {scheduleMode === 'long_term' ? 'Long-Term Schedule' : 'Standard Schedule'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{project.title}</h2>
            <p className="text-xs text-slate-300">
              Contract Duration: <span className="text-white font-bold">{project.estimatedDurationMonths} Months</span> | Started {project.startDate}
            </p>
          </div>
          <button
            id="btn-close-project-detail"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div
            id="modal-toast-notification"
            className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-inner animate-fade-in"
          >
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 animate-bounce" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-100 hover:text-white text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          
          {/* CONTRACTOR PENDING ACCEPTANCE BANNER */}
          {project.contractorStatus === 'pending_acceptance' && (
            <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full inline-block">
                  Action Required: Incoming Job Request
                </span>
                <h3 className="font-black text-slate-900 text-base">Accept or Decline Repair Job Assignment</h3>
                <p className="text-slate-600 text-xs">
                  Homeowner <span className="font-bold text-slate-900">{project.clientName}</span> selected you for this repair project (£{project.totalAmount.toLocaleString()} Escrow). Please confirm acceptance to begin work.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleContractorResponse('declined')}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
                >
                  Decline Job
                </button>

                <button
                  onClick={() => handleContractorResponse('accepted')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all"
                >
                  <Check className="h-4 w-4" />
                  <span>Accept Repair Job</span>
                </button>
              </div>
            </div>
          )}

          {/* Client & Financial Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase flex items-center space-x-1">
                <User className="h-3.5 w-3.5" />
                <span>Client Contact</span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{project.clientName}</div>
              <div className="text-xs text-slate-500 flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>{project.clientEmail}</span>
              </div>
              {project.address && (
                <div className="text-xs text-slate-500 flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{project.address}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase flex items-center space-x-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Financial Progress</span>
              </div>
              <div className="font-extrabold text-slate-900 text-xl">
                £{project.totalAmount.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-600 font-semibold">
                £{paidAmount.toLocaleString()} paid | £{remainingAmount.toLocaleString()} in escrow
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0057B8]" />
                <span>Escrow Gateway Protection</span>
              </div>
              <div className="text-xs text-slate-700 leading-relaxed font-medium">
                {project.estimatedDurationMonths > 3
                  ? 'Hybrid Routing: Short-term deposit on Stripe Escrow; 90d+ installments on Airwallex Direct Debit.'
                  : 'Stripe Escrow Mode: Duration <= 90 days.'}
              </div>
              <div className="text-[11px] text-[#0057B8] font-bold flex items-center space-x-1 pt-1 border-t border-slate-200">
                <Coins className="h-3 w-3 text-[#FF7F00]" />
                <span>Equalized Cost-Sharing Fee Logic Active</span>
              </div>
            </div>
          </div>

          {/* Schedule Mode Selector Controls */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-[#FF7F00]" />
                  <h3 className="text-sm font-bold text-white">Payment Schedule Schedule Mode</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toggle between milestone progress payments or extended long-term monthly installments.
                </p>
              </div>

              {/* Toggle Tab Buttons */}
              <div className="inline-flex p-1 bg-slate-800 rounded-lg border border-slate-700 self-start sm:self-center">
                <button
                  id="tab-toggle-standard-schedule"
                  onClick={() => handleApplyScheduleType('standard')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    scheduleMode === 'standard'
                      ? 'bg-[#0057B8] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Standard Schedule</span>
                </button>
                <button
                  id="tab-toggle-longterm-schedule"
                  onClick={() => handleApplyScheduleType('long_term')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    scheduleMode === 'long_term'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Long-Term Schedule</span>
                </button>
              </div>
            </div>

            {/* Mode Explanatory Notice */}
            <div className="text-xs bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 text-slate-300 flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                {scheduleMode === 'standard' ? (
                  <span>
                    <strong>Standard Progress Schedule:</strong> Lump sums tied to physical construction stages with photographic evidence required prior to escrow release.
                  </span>
                ) : (
                  <span>
                    <strong>Long-Term Extended Schedule:</strong> Spreads payments over {project.estimatedDurationMonths} months. Installments past 90 days are automatically routed to Airwallex Direct Debit.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual Breakdown & Timeline Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#0057B8]" />
                <span>Visual Installment Breakdown ({displayedMilestones.length} Installments)</span>
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                Avg. £{Math.round(project.totalAmount / displayedMilestones.length).toLocaleString()} / installment
              </span>
            </div>

            {/* Segmented Timeline Bar */}
            <div className="w-full bg-slate-200 h-5 rounded-lg overflow-hidden flex border border-slate-300 shadow-inner">
              {displayedMilestones.map((m, idx) => {
                const isPaid = m.status === 'paid';
                const isAirwallex = m.assignedGateway === 'airwallex';

                let bgClass = 'bg-slate-300 border-r border-slate-400';
                if (isPaid) bgClass = 'bg-emerald-500 border-r border-emerald-600';
                else if (isAirwallex) bgClass = 'bg-cyan-500 border-r border-cyan-600';
                else bgClass = 'bg-[#0057B8] border-r border-blue-600';

                return (
                  <div
                    key={m.id || idx}
                    className={`${bgClass} h-full relative group cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center text-[10px] font-bold text-white`}
                    style={{ width: `${Math.max(m.percentage, 8)}%` }}
                    title={`${m.title}: £${m.amount.toLocaleString()} (${m.percentage}%) - ${m.assignedGateway.toUpperCase()}`}
                  >
                    <span className="truncate px-1">{idx + 1}</span>
                  </div>
                );
              })}
            </div>

            {/* Timeline Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2 pt-1">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Paid ({displayedMilestones.filter(m => m.status === 'paid').length})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]"></span>
                  <span>Stripe Short-term (&lt;=90d)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                  <span>Airwallex Long-term (&gt;90d)</span>
                </div>
              </div>

              <div className="text-slate-500 italic">
                {activeRemindersCount} of {displayedMilestones.length} email reminders active
              </div>
            </div>
          </div>

          {/* Notes / Special Instructions */}
          {project.notes && (
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900">
              <span className="font-bold">Project Notes:</span> {project.notes}
            </div>
          )}

          {/* Installment Rows Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Installment Payment Breakdown &amp; Site Photo Verification
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Photo evidence required prior to releasing escrow funds
              </span>
            </div>

            <div className="space-y-3">
              {displayedMilestones.map((m, idx) => {
                const isAirwallex = m.assignedGateway === 'airwallex';
                const isPaid = m.status === 'paid';
                const isReminderEnabled = m.emailReminderEnabled ?? false;

                return (
                  <div
                    key={m.id}
                    id={`detail-milestone-card-${m.id}`}
                    className={`p-4 rounded-xl border transition-all ${
                      isPaid
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isAirwallex
                        ? 'bg-cyan-50/40 border-cyan-200'
                        : 'bg-blue-50/40 border-blue-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left Details & Email Reminder Checkbox */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {idx + 1}. {m.title}
                          </span>

                          {isPaid ? (
                            <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Paid &amp; Settled</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              Due: {m.dueDate} (Day {m.durationDaysFromStart})
                            </span>
                          )}

                          {/* Gateway Badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                              isAirwallex
                                ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                                : 'bg-blue-100 text-blue-900 border-blue-300'
                            }`}
                          >
                            {m.assignedGateway.toUpperCase()}
                          </span>
                        </div>

                        {m.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
                        )}

                        {/* Photo Evidence Indicator */}
                        {m.photoEvidence && m.photoEvidence.length > 0 && (
                          <div className="flex items-center space-x-2 bg-white/90 p-2 rounded-lg border border-slate-200 text-xs">
                            <Camera className="h-3.5 w-3.5 text-[#0057B8]" />
                            <span className="font-bold text-slate-800">{m.photoEvidence.length} Site Inspection Photo(s) Attached</span>
                            <span className="text-emerald-600 font-bold text-[10px]">&bull; Verified</span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500 font-medium italic">
                          MCP Reason: {m.gatewayReason}
                        </p>

                        {/* Automated Email Reminder Checkbox Toggle Row */}
                        <div className="pt-1.5 flex items-center space-x-3">
                          <label
                            htmlFor={`checkbox-reminder-${m.id}`}
                            className="inline-flex items-center space-x-2 cursor-pointer select-none group bg-white/80 hover:bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-xs transition-all"
                          >
                            <input
                              type="checkbox"
                              id={`checkbox-reminder-${m.id}`}
                              checked={isReminderEnabled}
                              onChange={() => handleToggleReminder(m.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#0057B8] focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                              Automated Email Reminder
                            </span>
                          </label>

                          {isReminderEnabled ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              <Bell className="h-3 w-3 text-amber-600 fill-amber-500" />
                              <span>Reminder Active (7 days prior)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-400">
                              <BellOff className="h-3 w-3" />
                              <span>Reminders Off</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Amount & Action Buttons */}
                      <div className="flex flex-col items-end space-y-2 shrink-0">
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900 text-base">
                            £{m.amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {m.percentage}% of project &bull; Net Payout: £{(m.contractorPayoutGBP || Math.round(m.amount * 0.85)).toLocaleString()} (15% Fee: £{(m.platformFeeGBP || Math.round(m.amount * 0.15)).toLocaleString()})
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Contractor: Mark Work Completed */}
                          {m.status !== 'paid' && m.status !== 'awaiting_approval' && m.status !== 'disputed' && (
                            <button
                              onClick={() => handleCompleteMilestone(m.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center space-x-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Mark Work Completed</span>
                            </button>
                          )}

                          {/* Client Checkout Portal Link */}
                          {!isPaid && (
                            <button
                              id={`btn-open-payment-link-${m.id}`}
                              onClick={() => {
                                onClose();
                                onOpenPortalForMilestone(project, m.id);
                              }}
                              className="bg-[#0057B8] hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-xs transition-all"
                            >
                              <span>Payment Portal</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 48-HOUR ESCROW WITHHOLDING BANNER (when awaiting_approval) */}
                    {m.status === 'awaiting_approval' && (
                      <div className="mt-3 bg-amber-500/10 border-2 border-amber-500 rounded-xl p-3.5 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full">
                              <Clock className="h-3 w-3" />
                              <span>48-Hour Escrow Hold Active</span>
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-xs mt-1">
                              Funds Withheld for 48 Hours Pending Homeowner Approval
                            </h4>
                            <p className="text-[11px] text-slate-600">
                              Total Escrow: <strong>£{m.amount.toLocaleString()}</strong> | Platform Fee (15%): <strong className="text-amber-800">£{(m.platformFeeGBP || Math.round(m.amount * 0.15)).toLocaleString()}</strong> | Net Contractor Payout: <strong className="text-emerald-700">£{(m.contractorPayoutGBP || Math.round(m.amount * 0.85)).toLocaleString()}</strong>
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => handleOpenDispute(m.id)}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                              <span>Contest Work</span>
                            </button>

                            <div className="min-w-[200px]">
                              <StructuredFrictionHoldButton
                                amount={m.amount}
                                label="Approve & Release Funds Now"
                                reason={`AI inspection verified site photos, milestone scope, and Building Safety Act compliance for ${m.title}.`}
                                onConfirm={() => handleReleaseEscrow(m.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DISPUTE ALERT & ADMIN JUDGMENT PANEL */}
                    {m.status === 'disputed' && (
                      <div className="mt-3 bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-rose-600 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Contested Work / Escalated to Admin</span>
                          </span>
                          <span className="text-[10px] font-bold text-rose-800">Escrow Frozen</span>
                        </div>

                        {m.disputeDetails && (
                          <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs space-y-1">
                            <p className="font-bold text-slate-900">Reason: {m.disputeDetails.reason}</p>
                            <p className="text-slate-700 leading-relaxed">{m.disputeDetails.description}</p>
                            {m.disputeDetails.images && m.disputeDetails.images.length > 0 && (
                              <div className="pt-1 flex gap-2">
                                {m.disputeDetails.images.map((img, i) => (
                                  <a key={i} href={img} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline">
                                    View Proof Photo #{i + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Admin Action Buttons */}
                        <div className="bg-slate-900 text-white p-3 rounded-xl space-y-2">
                          <span className="font-black text-amber-400 text-[10px] uppercase tracking-wider block">
                            Admin Dispute Escalation Controls
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleAdminResolveDispute(m.id, 'contractor_revisit', 'Admin instructed contractor to revisit site and fix defects.')}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Require Contractor Re-visit
                            </button>
                            <button
                              onClick={() => handleAdminResolveDispute(m.id, 'release_funds', 'Admin approved work after review. Released net funds to contractor.')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Overrule &amp; Release Funds (Net 85%)
                            </button>
                            <button
                              onClick={() => handleAdminResolveDispute(m.id, 'refund_client', 'Admin determined work incomplete. Full refund issued to client.')}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                            >
                              Refund Homeowner
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXTRA PAY / VARIATION QUOTES SECTION */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-2xl">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Extra Pay &amp; Unforeseen Scope Variations</h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  If work exceeds initial inspection, contractors can request variation pay with attached photo/video proof.
                </p>
              </div>

              <button
                onClick={() => setShowExtraPayModal(true)}
                className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md transition-all shrink-0"
              >
                <span>+ Request Extra Pay (Variation)</span>
              </button>
            </div>

            {/* List of Extra Pay Requests */}
            {project.extraPayRequests && project.extraPayRequests.length > 0 ? (
              <div className="space-y-3">
                {project.extraPayRequests.map(req => (
                  <div key={req.id} className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm">Variation Request: £{req.amountGBP}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            req.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 font-medium">{req.reason}</p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Requested by {req.requestedBy} &bull; {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Approval Buttons for Homeowner / Admin */}
                      {req.status === 'pending' && (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleReviewExtraPay(req.id, 'rejected')}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleReviewExtraPay(req.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-1.5 rounded-xl text-xs shadow-md"
                          >
                            Approve Extra Pay
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Media Attachments */}
                    {req.media && req.media.length > 0 && (
                      <div className="pt-2 border-t border-amber-200/60 flex flex-wrap gap-2">
                        {req.media.map((item, idx) => (
                          <a
                            key={idx}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-xs text-[#0057B8] font-bold hover:underline"
                          >
                            <Camera className="h-3.5 w-3.5 text-amber-600" />
                            <span>View {item.type === 'video' ? 'Video Evidence' : 'Photo Evidence'}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                No extra pay variation requests filed for this project.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* EXTRA PAY FORM MODAL */}
      {showExtraPayModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <ShieldAlert className="h-5 w-5 text-[#FF7F00]" />
                <span>Request Extra Pay (Variation Quote)</span>
              </h3>
              <button onClick={() => setShowExtraPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExtraPay} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Cost (£ GBP)</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={extraAmount}
                  onChange={e => setExtraAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0057B8]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Reason &amp; Unforeseen Scope</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why extra work is necessary (e.g., Hidden dry rot detected under floorboards requiring replacement timbers)."
                  value={extraReason}
                  onChange={e => setExtraReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Photo / Video Media Link</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or video link"
                    value={extraMediaUrl}
                    onChange={e => setExtraMediaUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Media Type</label>
                  <select
                    value={extraMediaType}
                    onChange={e => setExtraMediaType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#0057B8] font-bold"
                  >
                    <option value="image">Photo</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingExtra}
                className="w-full bg-[#0057B8] hover:bg-blue-700 text-white font-black py-3 rounded-2xl shadow-lg transition-all"
              >
                {isSubmittingExtra ? 'Submitting Request...' : 'Submit Extra Pay Request to Homeowner'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONTEST WORK / DISPUTE FORM MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-rose-900 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Contest Work &amp; Escalate to Admin</span>
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
              <strong>48-Hour Guarantee Notice:</strong> Escrow payment will be immediately frozen. An Admin inspector will review your explanation and attached evidence to make a binding determination.
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Dispute</label>
                <select
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Substandard Work Quality / Defect">Substandard Work Quality / Defect</option>
                  <option value="Incomplete Work Scope">Incomplete Work Scope</option>
                  <option value="Property Damage During Work">Property Damage During Work</option>
                  <option value="Unapproved Material Substitution">Unapproved Material Substitution</option>
                  <option value="Safety / Code Non-Compliance">Safety / Code Non-Compliance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Explanation</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe exactly why you are unhappy with the completed work (e.g., Grouting is unlevel and tile edges are chipped behind the basin)."
                  value={disputeDescription}
                  onChange={e => setDisputeDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo or Video Proof Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or media link"
                  value={disputeImageUrl}
                  onChange={e => setDisputeImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingDispute}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-2xl shadow-lg transition-all"
              >
                {isSubmittingDispute ? 'Submitting Dispute...' : 'Escalate Dispute & Freeze Escrow Funds'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


