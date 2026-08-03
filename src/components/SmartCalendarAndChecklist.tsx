import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckSquare, Clock, Bell, CheckCircle2, ChevronRight, AlertCircle, Filter, Sparkles, Building, ShieldCheck } from 'lucide-react';
import { RenovationProject, Milestone } from '../types';

interface SmartCalendarAndChecklistProps {
  projects: RenovationProject[];
  onSelectProject: (proj: RenovationProject) => void;
  onOpenPortalForMilestone: (project: RenovationProject, milestoneId: string) => void;
}

interface ChecklistItem {
  id: string;
  task: string;
  category: 'Contract & Setup' | 'Site Inspection' | 'Payment Milestone' | 'Permit & Safety';
  dueDate: string;
  completed: boolean;
  assignedTo: string;
}

export const SmartCalendarAndChecklist: React.FC<SmartCalendarAndChecklistProps> = ({
  projects,
  onSelectProject,
  onOpenPortalForMilestone
}) => {
  const [selectedView, setSelectedView] = useState<'all' | 'upcoming' | 'action_required'>('upcoming');

  // Sample homeowner & tradesperson project checklist
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'chk-1',
      task: 'Confirm Upfront Deposit & Sign Contract Charter',
      category: 'Contract & Setup',
      dueDate: '2026-08-01',
      completed: true,
      assignedTo: 'Homeowner & Contractor'
    },
    {
      id: 'chk-2',
      task: 'Submit Architectural & Electrical Building Control Permits',
      category: 'Permit & Safety',
      dueDate: '2026-08-05',
      completed: true,
      assignedTo: 'Site Architect'
    },
    {
      id: 'chk-3',
      task: 'Confirm Foundation & Framing Milestone Payment ($18,000)',
      category: 'Payment Milestone',
      dueDate: '2026-08-14',
      completed: false,
      assignedTo: 'Homeowner (Stripe)'
    },
    {
      id: 'chk-4',
      task: 'On-site Joinery & Plumbing First Fix Inspection',
      category: 'Site Inspection',
      dueDate: '2026-09-02',
      completed: false,
      assignedTo: 'Lead Tradesperson'
    },
    {
      id: 'chk-5',
      task: 'Activate Airwallex Direct Debit Mandate for Month 6 Installment ($21,000)',
      category: 'Payment Milestone',
      dueDate: '2026-10-15',
      completed: false,
      assignedTo: 'Homeowner (Airwallex)'
    }
  ]);

  const toggleChecklist = (id: string) => {
    setChecklistItems(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  // Extract upcoming milestone due dates across all projects for the Calendar Timeline
  const upcomingMilestones = projects
    .flatMap(p => p.milestones.map(m => ({ milestone: m, project: p })))
    .filter(item => item.milestone.status !== 'paid')
    .sort((a, b) => (a.milestone.durationDaysFromStart || 0) - (b.milestone.durationDaysFromStart || 0));

  const completedCount = checklistItems.filter(i => i.completed).length;
  const totalChecklist = checklistItems.length;
  const checklistPct = Math.round((completedCount / totalChecklist) * 100);

  return (
    <div id="smart-calendar-checklist-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-2">
      {/* Smart Project Calendar View */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Smart Project Calendar</h2>
              <p className="text-xs text-slate-600 font-medium">
                Upcoming payment due dates, inspections, &amp; email reminder schedules
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {upcomingMilestones.length} Upcoming Dates
            </span>
          </div>
        </div>

        {/* Timeline Calendar Feed */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {upcomingMilestones.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              All renovation installments settled! No upcoming dates pending.
            </div>
          ) : (
            upcomingMilestones.map(({ milestone, project }, idx) => {
              const isAirwallex = milestone.assignedGateway === 'airwallex';
              const isReminderOn = milestone.emailReminderEnabled ?? true;

              return (
                <div
                  key={milestone.id || idx}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-900 px-2.5 py-0.5 rounded-md">
                        Due Day {milestone.durationDaysFromStart}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{milestone.title}</span>
                      {isAirwallex ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300">
                          Airwallex DD
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-300">
                          Stripe Card
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      Project: <span className="font-bold text-slate-800">{project.title}</span> ({project.clientName})
                    </div>

                    {/* Email Reminder Badge */}
                    <div className="flex items-center space-x-2 pt-1 text-[11px]">
                      {isReminderOn ? (
                        <span className="inline-flex items-center space-x-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Bell className="h-3 w-3 text-amber-600" />
                          <span>Email reminder set (7 days prior)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-slate-500 font-medium">
                          <span>Email reminders disabled</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Amount & Portal Trigger */}
                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900">
                        ${milestone.amount.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">{project.currency}</div>
                    </div>

                    <button
                      onClick={() => onOpenPortalForMilestone(project, milestone.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center space-x-1"
                    >
                      <span>Pay / Portal</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Interactive Project Checklist & Milestone Planner */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Renovation Checklist</h2>
                <p className="text-xs text-slate-600 font-medium">Essential tasks for homeowner &amp; contractor</p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {completedCount}/{totalChecklist} Done
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Overall Progress</span>
              <span className="text-emerald-700">{checklistPct}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${checklistPct}%` }}
              ></div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {checklistItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 select-none ${
                  item.completed
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-700'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-900'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}} // Handled by parent div
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5 flex-1">
                  <span
                    className={`text-xs font-bold block ${
                      item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {item.task}
                  </span>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span>Assignee: {item.assignedTo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="font-medium">Keep track of key milestones before releasing funds.</span>
          <span className="font-bold text-indigo-600">Homeowner Verified</span>
        </div>
      </div>
    </div>
  );
};
