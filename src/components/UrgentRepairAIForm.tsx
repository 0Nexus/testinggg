import React, { useState } from 'react';
import { Shield, Sparkles, Upload, X, ArrowRight, CheckCircle2, AlertTriangle, Star, Clock, MapPin, Award, Lock, FileText, PoundSterling, CreditCard, ChevronRight, Check, Globe, Search, Mail } from 'lucide-react';
import { AIRepairEstimate, VettedContractor, RenovationProject, User } from '../types';
import { WebContractorDiscoveryModal } from './WebContractorDiscoveryModal';

interface UrgentRepairAIFormProps {
  currentUser: User | null;
  onProjectCreated: (project: RenovationProject) => void;
  onNavigateToCheckout: (project: RenovationProject, milestoneId: string) => void;
}

export const UrgentRepairAIForm: React.FC<UrgentRepairAIFormProps> = ({
  currentUser,
  onProjectCreated,
  onNavigateToCheckout
}) => {
  const [step, setStep] = useState<'form' | 'loading' | 'estimate' | 'payment_confirm'>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form State
  const [repairType, setRepairType] = useState('Emergency Plumbing & Water Leak');
  const [urgency, setUrgency] = useState<'emergency' | 'priority' | 'scheduled'>('emergency');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<{ id: string; name: string; preview: string; mimeType: string; data: string }[]>([]);

  // AI Estimation Result
  const [estimate, setEstimate] = useState<AIRepairEstimate | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<VettedContractor | null>(null);
  const [agreedAmount, setAgreedAmount] = useState<number>(0);
  const [showWebDiscoveryModal, setShowWebDiscoveryModal] = useState<boolean>(false);

  // File Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setImageFiles(prev => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            preview: resultStr,
            mimeType: file.type || 'image/jpeg',
            data: resultStr
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImageFiles(prev => prev.filter(img => img.id !== id));
  };

  // Submit Repair Request to AI
  const handleSubmitAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setStep('loading');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/estimate-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repairType,
          description,
          urgency,
          images: imageFiles.map(img => ({ mimeType: img.mimeType, data: img.data }))
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'There has been an error processing your request with Gemini AI. Please try again.');
        setStep('form');
        return;
      }

      setEstimate(data);
      setAgreedAmount(data.estimatedCostMinGBP || 450);
      if (data.suggestedContractors && data.suggestedContractors.length > 0) {
        setSelectedContractor(data.suggestedContractors[0]);
      }
      setStep('estimate');
    } catch (err: any) {
      console.error('Error fetching AI estimate:', err);
      setErrorMessage(err?.message || 'There has been an error connecting to Gemini AI server.');
      setStep('form');
    }
  };

  // Proceed to Hire Contractor & Deposit Funds in Escrow
  const handleHireContractor = async () => {
    if (!estimate || !selectedContractor) return;

    const gateway = estimate.mcpRecommendedGateway || 'stripe';
    
    // Create new Renovation Project
    const newProj: RenovationProject = {
      id: `proj-rep-${Date.now().toString(36)}`,
      title: `${repairType} - ${selectedContractor.companyName}`,
      clientName: currentUser ? currentUser.name : 'Homeowner Client',
      clientEmail: currentUser ? currentUser.email : 'homeowner@example.com',
      totalAmount: agreedAmount,
      currency: 'GBP',
      startDate: new Date().toISOString().split('T')[0],
      estimatedDurationMonths: Math.max(1, Math.ceil(estimate.estimatedDurationDays / 30)),
      status: 'active',
      createdAt: new Date().toISOString(),
      notes: `Urgent repair request processed via Tidy Corp AI. ${estimate.explanation}`,
      milestones: [
        {
          id: `ms-escrow-${Date.now().toString(36)}`,
          title: `Escrow Hold Deposit (${repairType})`,
          description: `Held safely in Tidy Corp Escrow for ${selectedContractor.name} (${selectedContractor.companyName}). Released upon verified completion.`,
          amount: agreedAmount,
          percentage: 100,
          dueDate: new Date(Date.now() + 86400000 * Math.max(1, estimate.estimatedDurationDays)).toISOString().split('T')[0],
          durationDaysFromStart: estimate.estimatedDurationDays,
          status: 'escrow_locked',
          assignedGateway: gateway,
          gatewayReason: estimate.gatewayReason || `Routed via ${gateway.toUpperCase()} based on estimated duration of ${estimate.estimatedDurationDays} days.`
        }
      ]
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProj)
      });
      if (res.ok) {
        const saved = await res.json();
        onProjectCreated(saved);
        onNavigateToCheckout(saved, saved.milestones[0].id);
      } else {
        onProjectCreated(newProj);
        onNavigateToCheckout(newProj, newProj.milestones[0].id);
      }
    } catch (e) {
      onProjectCreated(newProj);
      onNavigateToCheckout(newProj, newProj.milestones[0].id);
    }
  };

  return (
    <div id="urgent-repair-ai-wrapper" className="max-w-6xl mx-auto px-4 py-8 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#0057B8]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#FF7F00]/20 border border-[#FF7F00]/40 text-amber-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#FF7F00]" />
              <span>AI Urgent Repair &amp; Escrow Dispatch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Describe Your Repair &amp; Get Vetted Contractors
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Upload site photos and describe the damage. Our AI estimates the fix cost, selects the right escrow payment protocol (Stripe or Airwallex), and matches you with pre-vetted certified UK specialists.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Escrow Security</span>
              <span className="text-xs font-black text-emerald-400 flex items-center justify-end space-x-1">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span>100% Protected</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-8 px-2">
        <div className={`flex items-center space-x-2 text-xs font-bold ${step === 'form' ? 'text-[#0057B8]' : 'text-slate-500'}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${step === 'form' ? 'bg-[#0057B8] text-white' : 'bg-slate-200 text-slate-700'}`}>1</div>
          <span>Damage &amp; Photos</span>
        </div>
        <div className="h-0.5 w-12 bg-slate-200"></div>
        <div className={`flex items-center space-x-2 text-xs font-bold ${step === 'estimate' ? 'text-[#0057B8]' : 'text-slate-500'}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${step === 'estimate' ? 'bg-[#0057B8] text-white' : 'bg-slate-200 text-slate-700'}`}>2</div>
          <span>AI Estimate &amp; Contractor Match</span>
        </div>
        <div className="h-0.5 w-12 bg-slate-200"></div>
        <div className={`flex items-center space-x-2 text-xs font-bold ${step === 'payment_confirm' ? 'text-[#0057B8]' : 'text-slate-500'}`}>
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black ${step === 'payment_confirm' ? 'bg-[#0057B8] text-white' : 'bg-slate-200 text-slate-700'}`}>3</div>
          <span>Escrow Lock</span>
        </div>
      </div>

      {/* STEP 1: FORM */}
      {step === 'form' && (
        <form onSubmit={handleSubmitAssessment} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start space-x-3 text-rose-800 text-xs font-bold">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-rose-900 mb-0.5">Gemini AI Estimation Error</p>
                <p className="text-rose-700 font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Repair Type */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Type of Repair / Damage
              </label>
              <select
                value={repairType}
                onChange={e => setRepairType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-[#0057B8] outline-none"
              >
                <option value="Emergency Plumbing & Water Leak">Emergency Plumbing &amp; Water Leak</option>
                <option value="Damp & Mould Remediation (Awaab's Law)">Damp &amp; Mould Remediation (Awaab's Law)</option>
                <option value="Electrical Fault & Circuit Repair">Electrical Fault &amp; Circuit Repair</option>
                <option value="Roof Leak & Tile Replacement">Roof Leak &amp; Tile Replacement</option>
                <option value="Boiler Breakdown & Heating Repair">Boiler Breakdown &amp; Heating Repair</option>
                <option value="Structural Wall & Kitchen Remodel">Structural Wall &amp; Kitchen Remodel</option>
                <option value="General Home Renovation & Fit-Out">General Home Renovation &amp; Fit-Out</option>
              </select>
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency('emergency')}
                  className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all ${
                    urgency === 'emergency'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Urgent 24h
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('priority')}
                  className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all ${
                    urgency === 'priority'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  3-7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setUrgency('scheduled')}
                  className={`py-3 px-2 rounded-2xl text-xs font-black border transition-all ${
                    urgency === 'scheduled'
                      ? 'bg-blue-50 border-[#0057B8] text-[#0057B8] shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Scheduled
                </button>
              </div>
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Describe the Problem / Damage
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Water leak coming through bathroom ceiling causing wet plaster work, or black damp mould spores spreading in bedroom wall behind wardrobe..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#0057B8] outline-none"
            />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Upload Site / Damage Photos (Optional but Recommended)
            </label>

            <div className="border-2 border-dashed border-slate-300 hover:border-[#0057B8] rounded-2xl p-6 text-center transition-colors bg-slate-50 relative cursor-pointer group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="h-8 w-8 text-slate-400 group-hover:text-[#0057B8] mx-auto mb-2 transition-colors" />
              <p className="text-xs font-bold text-slate-700">Click or drag site photos here to upload</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP photos of the site damage</p>
            </div>

            {/* Thumbnail Previews */}
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {imageFiles.map(img => (
                  <div key={img.id} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group aspect-video">
                    <img src={img.preview} alt="Damage site" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            id="btn-submit-ai-assessment"
            type="submit"
            className="w-full bg-[#0057B8] hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4 text-[#FF7F00]" />
            <span>Analyze Damage &amp; Match Vetted Contractors</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* STEP 2: LOADING */}
      {step === 'loading' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xl space-y-4">
          <div className="h-16 w-16 bg-[#0057B8]/10 rounded-2xl flex items-center justify-center text-[#0057B8] mx-auto animate-pulse">
            <Sparkles className="h-8 w-8 text-[#FF7F00] animate-spin" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Tidy Corp AI Estimator at Work...</h2>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Analyzing site photos, evaluating labor &amp; material requirements, checking MCP Escrow routing rules (Stripe vs Airwallex), and searching admin-vetted contractors...
          </p>
        </div>
      )}

      {/* STEP 3: ESTIMATE & CONTRACTOR MATCHING */}
      {step === 'estimate' && estimate && (
        <div className="space-y-8">
          
          {/* AI Estimate Overview Card */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                  AI Survey &amp; Price Breakdown
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">{estimate.repairType}</h2>
                <span className="inline-block text-xs font-bold text-slate-400 mt-1">
                  Severity: <span className="text-rose-400">{estimate.severityLevel}</span>
                </span>
              </div>

              <div className="bg-slate-800 border border-slate-700/80 p-4 rounded-2xl text-right shrink-0">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Estimated Cost Range</span>
                <span className="text-2xl sm:text-3xl font-black text-white">
                  £{estimate.estimatedCostMinGBP} - £{estimate.estimatedCostMaxGBP}
                </span>
                <span className="block text-[11px] text-emerald-400 font-bold mt-0.5">
                  Duration: ~{estimate.estimatedDurationDays} Day{estimate.estimatedDurationDays > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* MCP Routing Recommendation */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-start space-x-3">
              <div className="p-2.5 rounded-xl bg-[#0057B8] text-white shrink-0 mt-0.5">
                <CreditCard className="h-5 w-5 text-amber-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-white">
                    Recommended Payment Route: <span className="text-cyan-300 uppercase">{estimate.mcpRecommendedGateway} Escrow</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800 font-bold">
                    MCP Rule Auto-Match
                  </span>
                </div>
                <p className="text-xs text-slate-300">{estimate.gatewayReason}</p>
              </div>
            </div>

            {/* Cost Breakdown & Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itemized Cost Estimate</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-300">Materials &amp; Supplies:</span>
                    <span className="font-mono text-white font-bold">£{estimate.costBreakdown?.materialsGBP || 180}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-300">Certified Trade Labor:</span>
                    <span className="font-mono text-white font-bold">£{estimate.costBreakdown?.laborGBP || 240}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-300">Emergency Dispatch &amp; Inspection:</span>
                    <span className="font-mono text-white font-bold">£{estimate.costBreakdown?.inspectionEmergencyFeeGBP || 30}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Surveyor Assessment</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">{estimate.explanation}</p>
              </div>
            </div>
          </div>

          {/* SELECT RECOMMENDED VETTED CONTRACTOR */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <span>Recommended Pre-Vetted Specialists</span>
                  <span className="text-xs font-mono font-bold bg-blue-100 text-[#0057B8] px-2.5 py-0.5 rounded-full">
                    {estimate.suggestedContractors?.length || 0} In Database
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Admin-verified trade professionals ready for dispatch with Tidy Corp Escrow protection.</p>
              </div>

              <button
                id="btn-trigger-web-discovery"
                type="button"
                onClick={() => setShowWebDiscoveryModal(true)}
                className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 border border-slate-700 shrink-0"
              >
                <Globe className="h-4 w-4 text-cyan-400" />
                <span>Scrape Online &amp; Invite Companies (Google)</span>
              </button>
            </div>

            {(!estimate.suggestedContractors || estimate.suggestedContractors.length < 3) && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-4 flex items-center justify-between text-xs font-medium">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Database Limit Notice:</strong> Insufficient internal contractors for <em>"{repairType}"</em>. Trigger AI Web Scraper to search Google for email-verified trade companies and dispatch invitations.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWebDiscoveryModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black px-3 py-1.5 rounded-xl text-xs shrink-0 ml-3"
                >
                  Run Web Scraper &rarr;
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {estimate.suggestedContractors?.map(contractor => {
                const isSelected = selectedContractor?.id === contractor.id;
                return (
                  <div
                    key={contractor.id}
                    onClick={() => {
                      setSelectedContractor(contractor);
                      setAgreedAmount(contractor.fixedQuoteEstimateGBP || estimate.estimatedCostMinGBP);
                    }}
                    className={`rounded-2xl border p-5 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0057B8] bg-blue-50/50 shadow-lg ring-2 ring-[#0057B8]'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={contractor.avatarUrl}
                            alt={contractor.name}
                            className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                              <span>{contractor.name}</span>
                              <Award className="h-4 w-4 text-[#0057B8]" />
                            </h3>
                            <span className="text-xs font-bold text-slate-500 block">{contractor.companyName}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 font-mono block">
                            £{contractor.fixedQuoteEstimateGBP || contractor.hourlyRateGBP}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Estimated Quote</span>
                        </div>
                      </div>

                      {/* Trade & Rating */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-bold text-[#0057B8] text-[11px]">{contractor.tradeType}</span>
                        <div className="flex items-center space-x-1 font-bold text-slate-800">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span>{contractor.rating}</span>
                          <span className="text-slate-400 font-normal">({contractor.reviewCount})</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{contractor.bio}</p>

                      {/* Badges / Certifications */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {contractor.certifications.map((cert, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/80">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Availability Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{contractor.availability}</span>
                      </span>

                      <span className={`font-black text-xs px-3 py-1 rounded-xl transition-colors ${
                        isSelected ? 'bg-[#0057B8] text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isSelected ? 'Selected Specialist' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action to Lock Escrow */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase block">Selected Specialist Quote</span>
              <span className="text-xl font-black text-slate-900">
                {selectedContractor?.name} &bull; <span className="text-[#0057B8]">£{agreedAmount} Total</span>
              </span>
              <p className="text-xs text-slate-500 mt-0.5">Money is deposited into Tidy Corp Escrow and only released when you approve the fix.</p>
            </div>

            <button
              id="btn-proceed-escrow-payment"
              type="button"
              onClick={handleHireContractor}
              className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black px-6 py-4 rounded-2xl text-xs sm:text-sm shadow-lg transition-all flex items-center space-x-2 shrink-0"
            >
              <Lock className="h-4 w-4" />
              <span>Deposit £{agreedAmount} in Escrow &amp; Hire</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

      {/* Web Contractor Discovery & Email Invitation Modal */}
      <WebContractorDiscoveryModal
        isOpen={showWebDiscoveryModal}
        onClose={() => setShowWebDiscoveryModal(false)}
        initialTradeCategory={repairType}
        initialLocation="Greater London & UK Region"
        initialJobTitle={`Urgent Repair: ${repairType}`}
        initialBudgetGBP={agreedAmount || estimate?.estimatedCostMinGBP || 1200}
        currentUser={currentUser}
        onContractorSelect={c => {
          setSelectedContractor(c);
          setAgreedAmount(c.fixedQuoteEstimateGBP || estimate?.estimatedCostMinGBP || 1000);
          setShowWebDiscoveryModal(false);
        }}
      />

    </div>
  );
};
