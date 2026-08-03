import React, { useState, useEffect } from 'react';
import { ExternalDiscoveredContractor, ContractorInvitationLog, VettedContractor, User } from '../types';
import { Search, Globe, Mail, CheckCircle2, AlertCircle, Send, Sparkles, Building2, Phone, MapPin, Award, Star, ExternalLink, RefreshCw, FileText, Check, Copy, ArrowRight, ShieldCheck, ListFilter } from 'lucide-react';

interface WebContractorDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTradeCategory?: string;
  initialLocation?: string;
  initialJobTitle?: string;
  initialBudgetGBP?: number;
  currentUser?: User | null;
  onContractorSelect?: (contractor: VettedContractor) => void;
}

export const WebContractorDiscoveryModal: React.FC<WebContractorDiscoveryModalProps> = ({
  isOpen,
  onClose,
  initialTradeCategory = 'Damp & Mould Remediation',
  initialLocation = 'Greater London & UK Region',
  initialJobTitle,
  initialBudgetGBP,
  currentUser,
  onContractorSelect
}) => {
  const [tradeCategory, setTradeCategory] = useState<string>(initialTradeCategory);
  const [location, setLocation] = useState<string>(initialLocation);
  const [jobTitle, setJobTitle] = useState<string>(initialJobTitle || `${tradeCategory} Specialist Required`);
  const [budgetGBP, setBudgetGBP] = useState<number>(initialBudgetGBP || 2500);

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [internalCount, setInternalCount] = useState<number>(0);
  const [internalContractors, setInternalContractors] = useState<VettedContractor[]>([]);
  const [discoveredContractors, setDiscoveredContractors] = useState<ExternalDiscoveredContractor[]>([]);
  const [searchSummary, setSearchSummary] = useState<string>('');
  
  // Email Invitation States
  const [invitingEmail, setInvitingEmail] = useState<string | null>(null);
  const [sentLogs, setSentLogs] = useState<ContractorInvitationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'discovered' | 'audit_logs'>('discovered');
  const [previewLog, setPreviewLog] = useState<ContractorInvitationLog | null>(null);

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [isBulkInviting, setIsBulkInviting] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync props when changed
  useEffect(() => {
    if (initialTradeCategory) setTradeCategory(initialTradeCategory);
    if (initialLocation) setLocation(initialLocation);
    if (initialJobTitle) setJobTitle(initialJobTitle);
    if (initialBudgetGBP) setBudgetGBP(initialBudgetGBP);
  }, [initialTradeCategory, initialLocation, initialJobTitle, initialBudgetGBP]);

  // Initial Auto-Search on Modal Open
  useEffect(() => {
    if (isOpen) {
      handleRunWebDiscovery(false);
      fetchInvitationLogs();
    }
  }, [isOpen]);

  const fetchInvitationLogs = async () => {
    try {
      const res = await fetch('/api/contractors/invitation-logs');
      if (res.ok) {
        const data = await res.json();
        setSentLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunWebDiscovery = async (force: boolean = true) => {
    setIsSearching(true);
    setSuccessBanner(null);
    try {
      const res = await fetch('/api/contractors/search-web-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeCategory,
          location,
          jobTitle,
          budgetGBP,
          minRequired: 3,
          forceSearch: force
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInternalCount(data.internalCount || 0);
        setInternalContractors(data.internalContractors || []);
        setDiscoveredContractors(data.discoveredContractors || []);
        setSearchSummary(data.searchSummary || '');
      }
    } catch (err) {
      console.error('Error running web discovery:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendSingleInvite = async (contractor: ExternalDiscoveredContractor) => {
    if (!contractor.email) return;
    setInvitingEmail(contractor.email);
    setSuccessBanner(null);

    try {
      const res = await fetch('/api/contractors/invite-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorEmail: contractor.email,
          companyName: contractor.companyName,
          tradeCategory: tradeCategory || contractor.tradeType,
          jobTitle,
          budgetGBP,
          invitedBy: currentUser ? `${currentUser.name} (${currentUser.companyName || 'Tidy Corp'})` : 'Tidy Corp Platform Admin'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessBanner(`Invitation email dispatched to ${contractor.email} for ${contractor.companyName}`);
        
        // Update contractor state to invited
        setDiscoveredContractors(prev => prev.map(c => c.email === contractor.email ? { ...c, invited: true, invitedAt: new Date().toISOString() } : c));
        fetchInvitationLogs();
      }
    } catch (err) {
      console.error('Invite error:', err);
    } finally {
      setInvitingEmail(null);
    }
  };

  const handleBulkInviteAll = async () => {
    const eligible = discoveredContractors.filter(c => c.hasEmail && !c.invited);
    if (eligible.length === 0) return;

    setIsBulkInviting(true);
    setSuccessBanner(null);

    try {
      const res = await fetch('/api/contractors/bulk-invite-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractors: eligible,
          jobTitle,
          budgetGBP,
          tradeCategory,
          invitedBy: currentUser ? `${currentUser.name} (${currentUser.companyName || 'Tidy Corp'})` : 'Tidy Corp Platform Admin'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessBanner(`Bulk invitations successfully dispatched to ${data.totalInvited} email-verified companies!`);
        
        // Mark all as invited
        setDiscoveredContractors(prev => prev.map(c => ({ ...c, invited: true, invitedAt: new Date().toISOString() })));
        fetchInvitationLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBulkInviting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 sm:px-8 py-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
          <div className="absolute top-0 right-0 w-64 h-full bg-[#0057B8]/10 blur-3xl pointer-events-none"></div>
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#0057B8]/20 border border-[#0057B8]/40 text-cyan-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>AI Google Search Scraper &amp; Email Dispatcher</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>External Trade Contractor Web Discovery</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              When internal database specialists are insufficient, our agent searches online, filters email-verified UK companies, and invites them to take the job with guaranteed escrow.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-2xl text-xs font-bold transition-all border border-slate-700"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                Trade Specialty Category
              </label>
              <input
                type="text"
                value={tradeCategory}
                onChange={e => setTradeCategory(e.target.value)}
                placeholder="e.g. Damp & Mould Remediation"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0057B8] font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                UK Region / Postcode
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Greater London"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0057B8] font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                Job Escrow Budget (£)
              </label>
              <input
                type="number"
                value={budgetGBP}
                onChange={e => setBudgetGBP(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0057B8] font-medium"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => handleRunWebDiscovery(true)}
                disabled={isSearching}
                className="w-full bg-[#0057B8] hover:bg-blue-600 disabled:opacity-50 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
                    <span>Scraping Web...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 text-amber-300" />
                    <span>Scrape Online (Google)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {searchSummary && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-[#FF7F00] shrink-0" />
                <span>{searchSummary}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold">
                Email Filter Active (100% Emails)
              </span>
            </div>
          )}

          {successBanner && (
            <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-300 rounded-xl p-3 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{successBanner}</span>
              </span>
              <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 text-xs">✕</button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 px-6 pt-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('discovered')}
              className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'discovered'
                  ? 'border-[#FF7F00] text-[#FF7F00]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Discovered Web Companies ({discoveredContractors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'audit_logs'
                  ? 'border-[#FF7F00] text-[#FF7F00]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Sent Invitation Email Logs ({sentLogs.length})</span>
            </button>
          </div>

          {activeTab === 'discovered' && discoveredContractors.length > 0 && (
            <button
              onClick={handleBulkInviteAll}
              disabled={isBulkInviting || discoveredContractors.every(c => c.invited)}
              className="bg-[#FF7F00] hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all mb-2"
            >
              {isBulkInviting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching Bulk Emails...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Bulk Invite All ({discoveredContractors.filter(c => !c.invited).length}) Companies</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900/60">
          
          {activeTab === 'discovered' && (
            <>
              {/* Internal Database Section (if present) */}
              {internalContractors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Matching Internal Database Contractors ({internalContractors.length})</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Pre-Vetted Platform Members</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {internalContractors.map(c => (
                      <div key={c.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <img src={c.avatarUrl} alt={c.name} className="h-10 w-10 rounded-xl object-cover border border-slate-700" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-xs text-white">{c.companyName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                                Verified Internal
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">{c.name} • {c.tradeType}</span>
                            <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-2">
                              <span className="flex items-center space-x-1 text-amber-400 font-bold">
                                <Star className="h-3 w-3 fill-amber-400" />
                                <span>{c.rating} ({c.reviewCount})</span>
                              </span>
                              <span>£{c.hourlyRateGBP}/hr</span>
                              <span>{c.email}</span>
                            </div>
                          </div>
                        </div>

                        {onContractorSelect && (
                          <button
                            onClick={() => onContractorSelect(c)}
                            className="bg-[#0057B8] hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shrink-0"
                          >
                            Assign Job
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Discovered Companies via Google Search Scraper */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      <span>Google Search Web-Scraped Companies (Email Verified)</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Companies scraped online matching {tradeCategory} with confirmed business email addresses. Send invitations to join Tidy Corp Escrow.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800">
                    {discoveredContractors.length} Discovered
                  </span>
                </div>

                {isSearching ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                    <RefreshCw className="h-8 w-8 text-[#FF7F00] animate-spin mx-auto" />
                    <p className="text-white font-black text-sm">Querying Google Search &amp; Extracting UK Trade Emails...</p>
                    <p className="text-slate-400 text-xs max-w-md mx-auto">
                      Searching online business listings, verifying email addresses for trade specialists in {location}...
                    </p>
                  </div>
                ) : discoveredContractors.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-slate-500 mx-auto" />
                    <p className="text-slate-300 font-bold text-sm">No Discovered Web Companies Yet</p>
                    <p className="text-slate-500 text-xs">Click "Scrape Online (Google)" above to query live UK trade registers.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {discoveredContractors.map(c => (
                      <div
                        key={c.id}
                        className={`bg-slate-950 border ${c.invited ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'} rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 relative`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                          <div className="flex items-start space-x-3">
                            <div className="h-11 w-11 rounded-2xl bg-[#0057B8]/20 border border-[#0057B8]/40 flex items-center justify-center text-cyan-400 shrink-0 font-black text-lg">
                              <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-black text-sm text-white">{c.companyName}</h4>
                                <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold flex items-center space-x-1">
                                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                                  <span>Email Verified</span>
                                </span>
                                {c.invited && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-mono font-bold flex items-center space-x-1">
                                    <Send className="h-3 w-3 text-amber-400" />
                                    <span>Invitation Dispatched</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 text-xs font-medium block mt-0.5">
                                Contact: {c.contactName || 'Representative'} • {c.tradeType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-black text-amber-400 flex items-center justify-end space-x-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400" />
                                <span>{c.googleRating} ({c.reviewCount} Reviews)</span>
                              </span>
                              <span className="text-[11px] text-slate-400 block font-mono">
                                ~£{c.estimatedHourlyRateGBP || 80}/hr
                              </span>
                            </div>

                            <button
                              onClick={() => handleSendSingleInvite(c)}
                              disabled={invitingEmail === c.email || c.invited}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-md ${
                                c.invited
                                  ? 'bg-slate-800 text-amber-300 border border-amber-600/50'
                                  : 'bg-[#FF7F00] hover:bg-amber-600 text-slate-950'
                              }`}
                            >
                              {invitingEmail === c.email ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  <span>Sending Email...</span>
                                </>
                              ) : c.invited ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-amber-400" />
                                  <span>Invite Sent</span>
                                </>
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5" />
                                  <span>Send Email Invitation</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400 flex items-center space-x-1.5 font-bold">
                              <Mail className="h-3.5 w-3.5 text-[#0057B8]" />
                              <span>Email:</span>
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-slate-200 font-mono text-[11px] truncate max-w-[150px]">{c.email}</span>
                              <button onClick={() => handleCopy(c.email)} className="text-slate-400 hover:text-white p-1">
                                {copiedEmail === c.email ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400 flex items-center space-x-1.5 font-bold">
                              <Phone className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Phone:</span>
                            </span>
                            <span className="text-slate-200 font-mono text-[11px]">{c.phone}</span>
                          </div>

                          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400 flex items-center space-x-1.5 font-bold">
                              <Globe className="h-3.5 w-3.5 text-cyan-400" />
                              <span>Website:</span>
                            </span>
                            <a
                              href={c.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center space-x-1"
                            >
                              <span>Official Site</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>

                        {/* Address & Certifications */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-[11px]">
                          <div className="flex items-center space-x-1.5 text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            <span>{c.address}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {c.certifications?.map((cert, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold text-[10px] border border-slate-700">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-[#FF7F00]" />
                    <span>Dispatched Invitation Email Audit Logs</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Complete audit trail of transactional email invitations sent to discovered external companies with signup tokens and escrow job parameters.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                  {sentLogs.length} Logged
                </span>
              </div>

              {sentLogs.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <Mail className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-bold text-sm">No Sent Email Logs Yet</p>
                  <p className="text-slate-500 text-xs">Invitations dispatched from the Discovered tab will record exact payloads here.</p>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 font-sans">
                      <thead className="bg-slate-900 border-b border-slate-800 font-mono text-[10px] uppercase text-slate-400">
                        <tr>
                          <th className="p-3">Sent Timestamp</th>
                          <th className="p-3">Company &amp; Email</th>
                          <th className="p-3">Job Title &amp; Budget</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {sentLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-900/50 transition-all">
                            <td className="p-3 font-mono text-[11px] text-slate-400">
                              {new Date(log.sentAt).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-white block">{log.companyName}</span>
                              <span className="text-slate-400 font-mono text-[11px]">{log.contractorEmail}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-200 block">{log.jobTitle}</span>
                              <span className="text-emerald-400 font-mono text-[11px]">£{log.budgetGBP?.toLocaleString() || 'Custom Escrow'}</span>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                <span>{log.deliveryStatus.toUpperCase()}</span>
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => setPreviewLog(log)}
                                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1 rounded-lg text-[11px] font-bold border border-slate-700"
                              >
                                Preview Email
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Tidy Corp Email Invitation Engine • Stripe &amp; Airwallex Escrow Integration</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>

      {/* Email Preview Modal */}
      {previewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 text-slate-900 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#0057B8] uppercase">Official Email Dispatch Preview</span>
                <h3 className="text-lg font-black">{previewLog.emailSubject}</h3>
              </div>
              <button onClick={() => setPreviewLog(null)} className="text-slate-500 font-bold hover:text-slate-900">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs font-mono space-y-1 text-slate-700 border">
              <div><strong>To:</strong> {previewLog.contractorEmail} ({previewLog.companyName})</div>
              <div><strong>From:</strong> {previewLog.invitedBy} via Tidy Corp Dispatcher</div>
              <div><strong>Token:</strong> <code>{previewLog.inviteToken}</code></div>
            </div>

            <div
              className="border rounded-2xl p-4 bg-white overflow-hidden"
              dangerouslySetInnerHTML={{ __html: previewLog.emailBodyHtml }}
            />

            <div className="text-right">
              <button
                onClick={() => setPreviewLog(null)}
                className="bg-[#0057B8] text-white font-bold px-5 py-2 rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
