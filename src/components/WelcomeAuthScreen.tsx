import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, UserCheck, ArrowRight, Building2, AlertTriangle, CheckCircle2, Sparkles, Briefcase } from 'lucide-react';
import { User } from '../types';
import { TidyCorpLogo } from './TidyCorpLogo';

interface WelcomeAuthScreenProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'homeowner' | 'contractor'>('homeowner');

  // Contractor Specific Rates & Details
  const [tradeType, setTradeType] = useState('Emergency Plumbing & Repairs');
  const [hourlyRateGBP, setHourlyRateGBP] = useState(75);
  const [fixedQuoteEstimateGBP, setFixedQuoteEstimateGBP] = useState(450);
  const [phone, setPhone] = useState('+44 20 7946 0999');
  const [certifications, setCertifications] = useState('Gas Safe Registered, TrustMark Approved');
  const [bio, setBio] = useState('10+ years experience in UK home repairs and emergency maintenance.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const contractorProfile = role === 'contractor' ? {
      companyName: companyName || `${name}'s Trade Services`,
      tradeType,
      hourlyRateGBP: Number(hourlyRateGBP),
      fixedQuoteEstimateGBP: Number(fixedQuoteEstimateGBP),
      phone,
      certifications: certifications.split(',').map(s => s.trim()).filter(Boolean),
      bio,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      availability: 'Immediate (Within 2 hrs)'
    } : undefined;

    const payload = mode === 'register'
      ? { email, password, name, companyName, role, phone, contractorProfile }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('tidy_secure_token', data.token);
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Server unreachable. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="welcome-auth-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-[#0057B8] selection:text-white">
      {/* Top Header Branding */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <TidyCorpLogo className="h-8 w-8" />
            <span className="font-black text-lg tracking-tight text-white">
              Tidy Corporation Ltd
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Security Control Online</span>
          </div>
        </div>
      </header>

      {/* Main Form & Showcase Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Platform Overview */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-[#0057B8]/20 border border-blue-500/30 text-blue-300 px-3 py-1.5 rounded-full text-xs font-bold">
              <Lock className="h-3.5 w-3.5 text-[#FF7F00]" />
              <span>UK Contractor &amp; Homeowner Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Secure Renovations, Timed Escrow &amp; Compliance
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Sign in or create an account to access contract milestones, manage 90-day pre-authorization holds via Stripe Escrow &amp; Airwallex Direct Debit, and monitor Awaab's Law statutory hazard countdowns.
            </p>

            {/* Feature Bullet Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-2">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Stripe &amp; Airwallex MCP Engine:</strong> 90-day pre-auth escrow &amp; low-cost BACS Direct Debit</span>
              </div>
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Awaab's Law Compliance:</strong> Statutory 24h emergency &amp; 10-day RICS countdowns</span>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Form Card */}
          <div className="lg:col-span-6 max-w-md w-full mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
                <button
                  id="tab-auth-login"
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${
                    mode === 'login'
                      ? 'bg-[#0057B8] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="tab-auth-register"
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all ${
                    mode === 'register'
                      ? 'bg-[#0057B8] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register Account
                </button>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Wassim Mehdaoui"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Company / Organization Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Tidy Corp UK"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Account Role</label>
                      <select
                        value={role}
                        onChange={e => setRole(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-bold"
                      >
                        <option value="homeowner">Homeowner / Customer</option>
                        <option value="contractor">Contractor / Trade Specialist</option>
                      </select>
                    </div>

                    {role === 'contractor' && (
                      <div className="space-y-3 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
                        <span className="block font-black text-amber-400 uppercase text-[10px] tracking-wider">
                          Contractor Profile &amp; Rates Setup
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Trade Specialty</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Emergency Plumbing"
                              value={tradeType}
                              onChange={e => setTradeType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Hourly Rate (£)</label>
                            <input
                              type="number"
                              required
                              value={hourlyRateGBP}
                              onChange={e => setHourlyRateGBP(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Fixed Quote Est. (£)</label>
                            <input
                              type="number"
                              required
                              value={fixedQuoteEstimateGBP}
                              onChange={e => setFixedQuoteEstimateGBP(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Phone Contact</label>
                            <input
                              type="text"
                              required
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Certifications (Comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. Gas Safe, NICEIC, TrustMark"
                            value={certifications}
                            onChange={e => setCertifications(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-0.5">Bio / Qualifications</label>
                          <textarea
                            rows={2}
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@tidycorp.co.uk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[#0057B8] outline-none font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In to Portal' : 'Create Secure Account'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-[11px] text-slate-500 text-center mt-6">
                Protected by Tidy Corp 256-Bit SSL Escrow Gateway Enclosure
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Tidy Corp AI Secure &bull; UK Renovation &amp; Construction Escrow Control Systems
      </footer>
    </div>
  );
};
