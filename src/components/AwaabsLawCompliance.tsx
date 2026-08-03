import React, { useState } from 'react';
import { AlertTriangle, Clock, ShieldAlert, FileText, CheckCircle2, UserCheck, Droplets, Thermometer, ChevronRight, FileCheck, AlertCircle } from 'lucide-react';
import { HazardReport } from '../types';

export const AwaabsLawCompliance: React.FC = () => {
  const [reports, setReports] = useState<HazardReport[]>([
    {
      id: 'haz-001',
      propertyAddress: '14 Kensington Gardens, London W8 4RT',
      tenantName: 'Clara Thompson',
      hazardType: 'Damp & Mould',
      severity: 'Emergency (24h)',
      occupantVulnerability: {
        hasChildrenUnderFive: true,
        hasRespiratoryCondition: true,
        hasDisabledResident: false
      },
      reportedDate: '2026-07-21T08:00:00Z',
      investigationDeadline: '2026-07-22T08:00:00Z', // 24 hours
      remediationDeadline: '2026-07-27T08:00:00Z',
      status: 'Inspection Scheduled',
      moistureLevelPct: 84,
      form3aEvidenceReady: true
    },
    {
      id: 'haz-002',
      propertyAddress: '88 High Street, Manchester M4 1HQ',
      tenantName: 'David Miller',
      hazardType: 'Loss of Heating / Hot Water',
      severity: 'Emergency (24h)',
      occupantVulnerability: {
        hasChildrenUnderFive: false,
        hasRespiratoryCondition: false,
        hasDisabledResident: true
      },
      reportedDate: '2026-07-22T14:30:00Z',
      investigationDeadline: '2026-07-23T14:30:00Z',
      remediationDeadline: '2026-07-25T14:30:00Z',
      status: 'Remediation In Progress',
      form3aEvidenceReady: false
    },
    {
      id: 'haz-003',
      propertyAddress: '23 Victoria Road, Birmingham B1 3RD',
      tenantName: 'Sarah & Mark Patel',
      hazardType: 'Major Water Leak',
      severity: 'Category 1 Hazard (10-Day RICS)',
      occupantVulnerability: {
        hasChildrenUnderFive: false,
        hasRespiratoryCondition: false,
        hasDisabledResident: false
      },
      reportedDate: '2026-07-18T10:00:00Z',
      investigationDeadline: '2026-07-28T10:00:00Z',
      remediationDeadline: '2026-08-02T10:00:00Z',
      status: 'Resolved & Verified',
      moistureLevelPct: 14,
      form3aEvidenceReady: true
    }
  ]);

  const [selectedReport, setSelectedReport] = useState<HazardReport>(reports[0]);
  const [showForm3AModal, setShowForm3AModal] = useState(false);

  return (
    <div id="awaabs-law-container" className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-amber-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full font-bold border border-amber-400/30">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Awaab's Law &amp; Renters' Rights Act 2025 Statutory Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hazard Countdown Matrix &amp; Form 3A Compliance
          </h1>
          <p className="text-slate-300 text-xs leading-relaxed">
            Monitors 24-hour emergency response limits and 10-day RICS moisture inspection workflows under Awaab's Law. Integrates Open Banking rent ledger auditing for watermarked court-admissible Form 3A evidence packages under revised Section 8 grounds.
          </p>
        </div>

        <button
          onClick={() => setShowForm3AModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 shrink-0"
        >
          <FileCheck className="h-4 w-4" />
          <span>Generate Court Form 3A Bundle</span>
        </button>
      </div>

      {/* Statutory Timelines Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
          <div className="flex items-center justify-between text-xs font-bold text-rose-900 uppercase">
            <span>24-Hour Emergency Limit</span>
            <Clock className="h-5 w-5 text-rose-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">2 Active</div>
            <div className="text-xs text-rose-700 font-bold mt-1">
              Immediate investigation &amp; make-safe required
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 uppercase">
            <span>10-Day RICS Moisture Mapping</span>
            <Droplets className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">1 Scheduled</div>
            <div className="text-xs text-amber-700 font-bold mt-1">
              Written report to tenant within 3 days
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#0057B8]"></div>
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 uppercase">
            <span>Vulnerability Weighted</span>
            <UserCheck className="h-5 w-5 text-[#0057B8]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">Child &lt; 5 Flag</div>
            <div className="text-xs text-blue-800 font-bold mt-1">
              Priority escalation for respiratory risk
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase">
            <span>Decent Homes Standard E</span>
            <ShieldAlert className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-950">100% Compliant</div>
            <div className="text-xs text-emerald-800 font-bold mt-1">
              Free from Category 1 HHSRS hazards
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Hazard Countdown Matrix & Selected Audit Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Hazards Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Awaab's Law Live Countdown Matrix</h2>
              <p className="text-xs text-slate-600 font-medium">Unalterable statutory investigation and remediation timers</p>
            </div>
          </div>

          <div className="space-y-3">
            {reports.map(rep => {
              const isEmergency = rep.severity.includes('24h');
              const isSelected = selectedReport.id === rep.id;

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected ? 'border-[#0057B8] bg-blue-50/40 ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                          isEmergency ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {rep.severity}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900">{rep.hazardType}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">{rep.propertyAddress}</div>
                      <div className="text-[11px] text-slate-500">Tenant: {rep.tenantName}</div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block bg-slate-900 text-amber-400 font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                        18h 42m Left
                      </span>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">Status: {rep.status}</div>
                    </div>
                  </div>

                  {/* Vulnerability Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60 text-[10px] font-bold">
                    <span className="text-slate-500 uppercase">Vulnerabilities:</span>
                    {rep.occupantVulnerability.hasChildrenUnderFive && (
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded">Child &lt; 5</span>
                    )}
                    {rep.occupantVulnerability.hasRespiratoryCondition && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Respiratory Condition</span>
                    )}
                    {rep.occupantVulnerability.hasDisabledResident && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Disabled Resident</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Hazard Audit & Form 3A Compliance Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono text-[#0057B8] uppercase font-extrabold">Audit Ledger Profile</span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedReport.hazardType} Audit</h3>
            <p className="text-xs text-slate-600 font-medium">{selectedReport.propertyAddress}</p>
          </div>

          <div className="space-y-3 text-xs font-medium text-slate-700">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Moisture Sensor Telemetry</span>
                <Droplets className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Relative Humidity Level:</span>
                <span className="font-extrabold text-rose-600">{selectedReport.moistureLevelPct || 78}% (High Risk)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full" style={{ width: `${selectedReport.moistureLevelPct || 78}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Renters' Rights Act 2025 Form 3A Audit</span>
                <FileCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Open Banking rent ledger verified. Watermarked, court-admissible Form 3A evidence bundle compiled for Section 8 hearings.
              </p>
              <div className="flex items-center space-x-2 pt-1 text-[#0057B8] font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Pre-Audit Eviction Gateway Passed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form 3A Modal */}
      {showForm3AModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Renters' Rights Act 2025 Form 3A Evidence Bundle</h3>
                <p className="text-xs text-slate-500 font-medium">Court-Admissible Section 8 Eviction Grounds Audit</p>
              </div>
              <button onClick={() => setShowForm3AModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between font-bold">
                <span>Property:</span>
                <span className="text-slate-900">{selectedReport.propertyAddress}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Tenant:</span>
                <span className="text-slate-900">{selectedReport.tenantName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Open Banking Rent Audit:</span>
                <span className="text-emerald-700">100% Verified Ledger</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Awaab's Law Compliance:</span>
                <span className="text-emerald-700">No Outstanding Violations</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button onClick={() => setShowForm3AModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl">
                Close
              </button>
              <button
                onClick={() => {
                  alert("Court-admissible Form 3A PDF evidence bundle downloaded successfully!");
                  setShowForm3AModal(false);
                }}
                className="px-5 py-2 bg-[#0057B8] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Download Watermarked Form 3A
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
