import React, { useState } from 'react';
import { Bot, Sparkles, Send, ShieldCheck, Clock, Zap, ArrowRight, CheckCircle2, Search, Home, Palette } from 'lucide-react';
import { AIAdvisorResponse } from '../types';

export const AIAdvisor: React.FC = () => {
  const [projectTitle, setProjectTitle] = useState('Boutique Kitchen & Living Area Renovation');
  const [totalAmount, setTotalAmount] = useState<number>(45000);
  const [currency, setCurrency] = useState('USD');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [description, setDescription] = useState(
    'Full Scandinavian kitchen renovation with handle-less matte white cabinets, quartz worktops, oak wood cladding, and dimmable LEDs.'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('kitchen');

  const [isLoading, setIsLoading] = useState(false);
  const [advisorData, setAdvisorData] = useState<AIAdvisorResponse | null>(null);

  const presetConcepts = [
    {
      id: 'kitchen',
      title: 'Modern Scandinavian Kitchen',
      budget: '$25,000 - $45,000',
      duration: '6-12 Months',
      prompt: 'Renovate current kitchen in Scandinavian style: handle-less matte white cabinets, premium natural white quartz worktops, light oak wood cladding, integrated under-cabinet warm dimmable LEDs, and minimalist brass hardware.'
    },
    {
      id: 'bathroom',
      title: 'Urban Spa Bathroom Overhaul',
      budget: '$15,000 - $30,000',
      duration: '3-6 Months',
      prompt: 'Transform master bathroom into luxury spa sanctuary: walk-in rain shower, micro-cement walls, brushed brass fixtures, floating vanity, and heated porcelain floor tiles.'
    },
    {
      id: 'loft',
      title: 'Architectural Restructured Loft',
      budget: '$50,000 - $90,000',
      duration: '12-18 Months',
      prompt: 'Convert attic into master suite loft: structural steel beams, exposed brick feature wall, double skylights, bespoke fitted oak wardrobes, and ensuite shower room.'
    }
  ];

  const popularSearches = [
    { label: 'Boiler Service', tag: 'Curated' },
    { label: 'Pipe Leak Repair', tag: 'Seasonal' },
    { label: 'Electrical Wiring', tag: 'High Match' },
    { label: 'Room Design Visualizer', tag: 'New Tool' }
  ];

  const handleSelectPreset = (preset: typeof presetConcepts[0]) => {
    setSelectedPreset(preset.id);
    setProjectTitle(preset.title);
    setDescription(preset.prompt);
  };

  const handleConsultAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          totalAmount,
          currency,
          durationMonths,
          description
        })
      });

      const data = await res.json();
      setAdvisorData(data);
    } catch (err) {
      console.error(err);
      alert('Failed to consult AI advisor. Check server logs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-advisor-container" className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div id="ai-advisor-banner" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/50 flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/20 text-cyan-300 text-xs px-3 py-1 rounded-full font-medium border border-cyan-400/30">
            <Bot className="h-3.5 w-3.5 text-cyan-400" />
            <span>Gemini AI Financial Engineering Advisor</span>
          </div>
          <h1 className="text-2xl font-black">AI Renovation Contract &amp; Gateway Optimizer</h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Enter your project budget, timeline, and scope. Gemini AI generates risk-optimized milestone schedules and selects the ideal combination of Stripe (&le;90d) and Airwallex (&gt;90d) rails.
          </p>
        </div>
      </div>

      {/* Unified Search & Popular Topics Bar with Matching Sans-Serif Font */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 font-sans">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="What service, guide, or renovation tool do you need today?"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-28 py-3.5 text-sm font-sans text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs px-5 py-2 rounded-lg shadow-sm">
            Search
          </button>
        </div>

        {/* Popular Search Pill Badges - Standardized Sans-Serif Font & High Contrast */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans mr-1">
            POPULAR SEARCHES:
          </span>
          {popularSearches.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSearchQuery(item.label)}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-900 hover:text-indigo-950 border border-slate-300 px-3 py-1.5 rounded-full text-xs font-sans font-bold transition-all shadow-2xs"
            >
              <span>{item.label}</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                {item.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Design Concept Selector - HIGH CONTRAST & ACCESSIBLE TEXT */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 font-sans">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-sans">
            SELECT A DESIGN CONCEPT
          </h2>
          <p className="text-xs text-slate-700 font-semibold font-sans mt-0.5">
            Click on the preset rooms below to see how our generative AI models restructure scope &amp; milestone plans
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetConcepts.map(concept => {
            const isSelected = selectedPreset === concept.id;
            return (
              <div
                key={concept.id}
                onClick={() => handleSelectPreset(concept)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 font-sans ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-md'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 uppercase">
                      {concept.id}
                    </span>
                    <Home className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </div>
                  <h3 className="font-extrabold text-slate-950 text-sm">
                    {concept.title}
                  </h3>
                </div>

                <div className="pt-2 border-t border-slate-200 text-xs text-slate-800 font-semibold space-y-1">
                  <div>Est. Budget: <strong className="text-slate-950">{concept.budget}</strong></div>
                  <div>Duration: <strong className="text-slate-950">{concept.duration}</strong></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Scope / Prompt Editor Box - HIGH CONTRAST DARK TEXT */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300 uppercase font-sans">
            <span>PROMPT EDITOR</span>
            <span className="text-[10px] text-amber-400 font-semibold">1200dpi Lossless Preview</span>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full text-xs font-sans text-slate-100 bg-slate-800/90 p-3.5 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
          ></textarea>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <form onSubmit={handleConsultAI} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Renovation Project Name</label>
              <input
                id="ai-project-title"
                type="text"
                required
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contract Value &amp; Currency</label>
              <div className="flex space-x-2">
                <select
                  id="ai-currency"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (&pound;)</option>
                  <option value="EUR">EUR (&euro;)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
                <input
                  id="ai-amount"
                  type="number"
                  required
                  value={totalAmount}
                  onChange={e => setTotalAmount(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contract Duration (Months)</label>
              <input
                id="ai-duration"
                type="number"
                required
                min="1"
                max="36"
                value={durationMonths}
                onChange={e => setDurationMonths(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scope Description</label>
              <input
                id="ai-description"
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-run-ai-advisor"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <span>Analyzing contract risk with Gemini AI...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generate AI Milestone &amp; Gateway Optimization Plan</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* AI Output Display */}
      {advisorData && (
        <div id="ai-output-container" className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold">Executive AI Summary</span>
              <p className="text-sm text-slate-800 font-medium leading-relaxed mt-1">
                {advisorData.summary}
              </p>
            </div>

            {/* Suggested Milestones Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">AI Recommended Installment Structure</h3>

              <div className="space-y-3">
                {advisorData.suggestedMilestones.map((m, idx) => {
                  const isAirwallex = m.recommendedGateway === 'airwallex';
                  const amount = Math.round((totalAmount * m.percentage) / 100);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        isAirwallex ? 'bg-cyan-50/50 border-cyan-200' : 'bg-indigo-50/50 border-indigo-200'
                      } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {idx + 1}. {m.title}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            (Day {m.durationDaysFromStart})
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic">
                          Reason: {m.reason}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {currency} ${amount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">{m.percentage}%</div>
                        </div>

                        {isAirwallex ? (
                          <span className="bg-cyan-100 text-cyan-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-cyan-300 inline-flex items-center space-x-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Airwallex</span>
                          </span>
                        ) : (
                          <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-indigo-300 inline-flex items-center space-x-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Stripe</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk & Strategy Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 space-y-1">
                <span className="text-xs font-bold text-amber-900 uppercase">Risk Assessment</span>
                <p className="text-xs text-amber-900 leading-relaxed">
                  {advisorData.riskAssessment}
                </p>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200/80 space-y-1">
                <span className="text-xs font-bold text-emerald-900 uppercase">Projected Fee Savings</span>
                <p className="text-xl font-black text-emerald-950">
                  +${advisorData.projectedFeeSavings?.toLocaleString() || 350} Saved
                </p>
                <p className="text-xs text-emerald-800">
                  Savings achieved by routing long-term milestones via Airwallex direct debit rails.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
