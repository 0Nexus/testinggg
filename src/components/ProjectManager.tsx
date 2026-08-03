import React, { useState } from 'react';
import { RenovationProject } from '../types';
import { Search, Plus, Filter, Calendar, ShieldCheck, Clock, ChevronRight, User, DollarSign, ArrowUpRight } from 'lucide-react';

interface ProjectManagerProps {
  projects: RenovationProject[];
  onOpenNewProject: () => void;
  onSelectProject: (proj: RenovationProject) => void;
  onOpenPortalForMilestone: (project: RenovationProject, milestoneId: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  onOpenNewProject,
  onSelectProject,
  onOpenPortalForMilestone
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'long'>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());

    if (durationFilter === 'short') {
      return matchesSearch && p.estimatedDurationMonths <= 3;
    }
    if (durationFilter === 'long') {
      return matchesSearch && p.estimatedDurationMonths > 3;
    }
    return matchesSearch;
  });

  return (
    <div id="project-manager-container" className="space-y-6 max-w-7xl mx-auto">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="input-search-projects"
            type="text"
            placeholder="Search by renovation name, client name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              id="filter-duration-all"
              onClick={() => setDurationFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                durationFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Projects
            </button>
            <button
              id="filter-duration-short"
              onClick={() => setDurationFilter('short')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                durationFilter === 'short' ? 'bg-white text-[#0057B8] shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              &le;90 Days (Stripe Escrow)
            </button>
            <button
              id="filter-duration-long"
              onClick={() => setDurationFilter('long')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                durationFilter === 'long' ? 'bg-white text-cyan-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              90d+ (Airwallex)
            </button>
          </div>

          <button
            id="btn-create-project-manager"
            onClick={onOpenNewProject}
            className="bg-[#0057B8] hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-2 shadow transition-all whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(proj => {
          const paidAmount = proj.milestones.filter(m => m.status === 'paid').reduce((a, b) => a + b.amount, 0);
          const progressPct = Math.round((paidAmount / proj.totalAmount) * 100);

          const isLongTerm = proj.estimatedDurationMonths > 3;

          return (
            <div
              key={proj.id}
              id={`project-grid-card-${proj.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-4 hover:border-[#0057B8] group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {isLongTerm ? (
                        <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-300">
                          Airwallex 90d+
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300">
                          Stripe Escrow
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500">
                        {proj.estimatedDurationMonths} mo contract
                      </span>
                    </div>
                    <h3
                      onClick={() => onSelectProject(proj)}
                      className="font-black text-slate-900 text-base hover:text-[#0057B8] transition-colors cursor-pointer line-clamp-1"
                    >
                      {proj.title}
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{proj.clientName}</span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px] pl-5">{proj.clientEmail}</div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Milestone Released</span>
                    <span className="text-emerald-600 font-bold">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Total Budget</div>
                  <div className="text-base font-black text-slate-900">
                    £{proj.totalAmount.toLocaleString()}
                  </div>
                </div>

                <button
                  id={`btn-view-project-${proj.id}`}
                  onClick={() => onSelectProject(proj)}
                  className="bg-slate-100 hover:bg-blue-50 hover:text-[#0057B8] text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1"
                >
                  <span>Milestones</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

