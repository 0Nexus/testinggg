import React, { useState } from 'react';
import { RenovationProject, Milestone, PaymentGateway } from '../types';
import { X, Calendar, DollarSign, Plus, Trash2, Zap, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (project: Partial<RenovationProject>) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSaveProject }) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(60000);
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [notes, setNotes] = useState('');

  // Initial milestone templates
  const [milestones, setMilestones] = useState<Partial<Milestone>[]>([
    {
      title: 'Initial Architectural & Deposit',
      percentage: 15,
      amount: 9000,
      durationDaysFromStart: 0,
      assignedGateway: 'stripe',
      gatewayReason: 'Immediate short term deposit (<30d) processed via Stripe Card.'
    },
    {
      title: 'Foundation & Framing Stage',
      percentage: 30,
      amount: 18000,
      durationDaysFromStart: 60,
      assignedGateway: 'stripe',
      gatewayReason: 'Within 90d threshold. Stripe Card/Intent.'
    },
    {
      title: 'Interior Fit-Out & Joinery',
      percentage: 35,
      amount: 21000,
      durationDaysFromStart: 180,
      assignedGateway: 'airwallex',
      gatewayReason: 'Duration 180d (>90d Stripe authorization limit). Routed to Airwallex Direct Debit schedule.'
    },
    {
      title: 'Final Handover & Quality Sign-Off',
      percentage: 20,
      amount: 12000,
      durationDaysFromStart: 360,
      assignedGateway: 'airwallex',
      gatewayReason: '12-month long-term installment (>90d limit). Airwallex recurring mandate.'
    }
  ]);

  if (!isOpen) return null;

  const handleTotalAmountChange = (newAmount: number) => {
    setTotalAmount(newAmount);
    // Recalculate milestone amounts based on percentage
    setMilestones(prev =>
      prev.map(m => ({
        ...m,
        amount: Math.round((newAmount * (m.percentage || 0)) / 100)
      }))
    );
  };

  const handleDurationMonthsChange = (newMonths: number) => {
    setDurationMonths(newMonths);
    // Recalculate durationDaysFromStart and update gateways using MCP rule (>90d -> Airwallex)
    setMilestones(prev =>
      prev.map((m, idx) => {
        const days = Math.round((newMonths * 30 * (idx + 1)) / prev.length) - Math.round((newMonths * 30) / prev.length);
        const actualDays = idx === 0 ? 0 : days;
        const gateway: PaymentGateway = actualDays > 90 ? 'airwallex' : 'stripe';
        const reason = actualDays > 90
          ? `Duration ${actualDays}d exceeds Stripe 90-day authorization hold limit. Routed to Airwallex Direct Debit.`
          : `Duration ${actualDays}d is within 90-day Stripe limit.`;

        return {
          ...m,
          durationDaysFromStart: actualDays,
          assignedGateway: gateway,
          gatewayReason: reason
        };
      })
    );
  };

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      {
        title: `Stage ${prev.length + 1} Milestone`,
        percentage: 10,
        amount: Math.round(totalAmount * 0.1),
        durationDaysFromStart: 120,
        assignedGateway: 'airwallex',
        gatewayReason: 'Custom installment scheduled >90d.'
      }
    ]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName || !clientEmail || totalAmount <= 0) return;

    onSaveProject({
      title,
      clientName,
      clientEmail,
      clientPhone,
      address,
      totalAmount,
      currency,
      startDate,
      estimatedDurationMonths: durationMonths,
      notes,
      milestones: milestones as Milestone[]
    });
    onClose();
  };

  return (
    <div id="new-project-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div id="new-project-modal-content" className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold">Create New Renovation Contract</h2>
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded font-mono">
                MCP Auto-Router
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Specify contract details. RenovaPay automatically assigns Stripe (&le;90d) or Airwallex (&gt;90d) per milestone.
            </p>
          </div>
          <button
            id="btn-close-new-project-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contract / Project Title *</label>
              <input
                id="input-project-title"
                type="text"
                required
                placeholder="e.g. Luxury Kitchen & Master Suite Renovation"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Contract Budget *</label>
              <div className="flex space-x-2">
                <select
                  id="select-project-currency"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-slate-50 font-bold text-slate-700"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (&pound;)</option>
                  <option value="EUR">EUR (&euro;)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
                <input
                  id="input-project-amount"
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={totalAmount}
                  onChange={e => handleTotalAmountChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Client Full Name *</label>
              <input
                id="input-client-name"
                type="text"
                required
                placeholder="e.g. John &amp; Sarah Jenkins"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Client Email (For Payment Links) *</label>
              <input
                id="input-client-email"
                type="email"
                required
                placeholder="client@example.com"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                id="input-start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Duration (Months) *</label>
              <select
                id="select-duration-months"
                value={durationMonths}
                onChange={e => handleDurationMonthsChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
              >
                <option value={2}>2 Months (Short-term remodeling - Stripe)</option>
                <option value={6}>6 Months (Mid-term renovation - Hybrid)</option>
                <option value={12}>12 Months (Full year renovation - Airwallex Heavy)</option>
                <option value={18}>18 Months (Multi-year extension - Airwallex Heavy)</option>
                <option value={24}>24 Months (2-Year estate project - Airwallex Heavy)</option>
              </select>
            </div>
          </div>

          {/* MCP Routing Explanation Box */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-xl text-xs space-y-1 border border-indigo-800/60">
            <div className="font-bold flex items-center space-x-2 text-amber-300">
              <Zap className="h-4 w-4" />
              <span>MCP Installment Router Logic Applied:</span>
            </div>
            <p className="text-slate-300">
              Contract duration is set to <span className="text-white font-bold">{durationMonths} months</span>. Milestones scheduled past Day 90 are automatically routed to <span className="text-cyan-300 font-bold">Airwallex</span> to ensure client direct debit mandate setup without Stripe's 90-day pre-authorization expiry.
            </p>
          </div>

          {/* Milestones Breakdown Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Milestone Payment Schedule</h3>
              <button
                type="button"
                id="btn-add-milestone-form"
                onClick={addMilestone}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center space-x-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map((m, idx) => {
                const isAirwallex = m.assignedGateway === 'airwallex';
                return (
                  <div
                    key={idx}
                    id={`milestone-form-row-${idx}`}
                    className={`p-4 rounded-xl border ${
                      isAirwallex ? 'bg-cyan-50/50 border-cyan-200' : 'bg-indigo-50/50 border-indigo-200'
                    } space-y-3`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Stage Title</label>
                        <input
                          type="text"
                          value={m.title || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setMilestones(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                          }}
                          className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount ({currency})</label>
                        <input
                          type="number"
                          value={m.amount || 0}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setMilestones(prev => prev.map((item, i) => i === idx ? { ...item, amount: val, percentage: Math.round((val / totalAmount) * 100) } : item));
                          }}
                          className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Due (Days)</label>
                        <input
                          type="number"
                          value={m.durationDaysFromStart || 0}
                          onChange={e => {
                            const days = Number(e.target.value);
                            const gateway: PaymentGateway = days > 90 ? 'airwallex' : 'stripe';
                            const reason = days > 90
                              ? `Duration ${days}d exceeds Stripe 90d authorization limit. Airwallex Direct Debit.`
                              : `Duration ${days}d within 90d limit. Stripe Card.`;

                            setMilestones(prev => prev.map((item, i) => i === idx ? {
                              ...item,
                              durationDaysFromStart: days,
                              assignedGateway: gateway,
                              gatewayReason: reason
                            } : item));
                          }}
                          className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned MCP Gateway</label>
                        {isAirwallex ? (
                          <span className="inline-flex items-center space-x-1 text-cyan-800 bg-cyan-100 font-bold px-2 py-1.5 rounded-lg text-xs border border-cyan-300">
                            <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />
                            <span>Airwallex</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-indigo-800 bg-indigo-100 font-bold px-2 py-1.5 rounded-lg text-xs border border-indigo-300">
                            <Clock className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Stripe</span>
                          </span>
                        )}
                      </div>

                      <div className="md:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeMilestone(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              id="btn-cancel-project-modal"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-project"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              Save &amp; Generate Gateway Schedules
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
