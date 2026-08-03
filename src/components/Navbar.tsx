import React from 'react';
import { CreditCard, ShieldCheck, Layers, AlertTriangle, Settings2, Shield, LogOut, Sparkles, UserCheck, Calculator, Crown, Home, LogIn } from 'lucide-react';
import { GatewayConfig, User } from '../types';
import { TidyCorpLogo } from './TidyCorpLogo';

interface NavbarProps {
  activeTab: 'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout';
  setActiveTab: (tab: 'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout') => void;
  gatewayConfig: GatewayConfig;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, gatewayConfig, currentUser, onLogout, onOpenAuthModal }) => {
  return (
    <header id="main-navbar" className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <TidyCorpLogo className="h-10 w-10" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white">
                  Tidy Corp <span className="text-[#FF7F00]">AI Secure</span>
                </span>
                <span className="bg-[#0057B8]/30 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-400/30">
                  Tidy Secure Pay
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                UK Property Renovations, 90d Escrow &amp; Statutory Compliance Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-1.5">
            <button
              id="nav-tab-landing"
              onClick={() => setActiveTab('landing')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'landing'
                  ? 'bg-[#0057B8] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Home className="h-4 w-4 text-cyan-300" />
              <span className="hidden sm:inline">Overview</span>
            </button>

            <button
              id="nav-tab-urgent-ai"
              onClick={() => setActiveTab('urgent_ai')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'urgent_ai'
                  ? 'bg-gradient-to-r from-[#0057B8] to-[#00428c] text-white shadow-md ring-2 ring-amber-400/40'
                  : 'text-amber-300 hover:bg-slate-800 hover:text-amber-200'
              }`}
            >
              <Sparkles className="h-4 w-4 text-[#FF7F00]" />
              <span className="hidden sm:inline">AI Urgent Repair</span>
              <span className="sm:hidden">Urgent</span>
            </button>

            <button
              id="nav-tab-quoting-agent"
              onClick={() => setActiveTab('quoting_agent')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'quoting_agent'
                  ? 'bg-[#FF7F00] text-slate-950 shadow-md font-black'
                  : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300'
              }`}
            >
              <Calculator className="h-4 w-4 text-[#0057B8]" />
              <span>Quoting Agent</span>
            </button>

            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#0057B8] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              id="nav-tab-projects"
              onClick={() => setActiveTab('projects')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'projects'
                  ? 'bg-[#0057B8] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Track Escrows</span>
            </button>

            <button
              id="nav-tab-contractors"
              onClick={() => setActiveTab('contractors')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'contractors'
                  ? 'bg-[#0057B8] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="h-4 w-4 text-cyan-300" />
              <span className="hidden lg:inline">Vetted Contractors</span>
            </button>

            <button
              id="nav-tab-compliance"
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'compliance'
                  ? 'bg-[#0057B8] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="hidden xl:inline">Awaab's Law</span>
            </button>

            <button
              id="nav-tab-mcp"
              onClick={() => setActiveTab('mcp')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'mcp'
                  ? 'bg-[#0057B8] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings2 className="h-4 w-4 text-cyan-400" />
              <span className="hidden xl:inline">Settings</span>
            </button>

            <button
              id="nav-tab-pricing"
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-black transition-all ${
                activeTab === 'pricing'
                  ? 'bg-[#FF7F00] text-slate-950 shadow-md'
                  : 'text-amber-400 hover:bg-slate-800 hover:text-amber-300'
              }`}
            >
              <Crown className="h-4 w-4 text-amber-300" />
              <span className="hidden sm:inline">Pricing &amp; Plans</span>
            </button>

            <button
              id="nav-tab-checkout"
              onClick={() => setActiveTab('checkout')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'checkout'
                  ? 'bg-[#0057B8] text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="hidden sm:inline">Escrow Portal</span>
            </button>
          </nav>

          {/* User Profile Pill & Logout / Sign In button */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div
                onClick={() => setActiveTab('pricing')}
                className="flex items-center space-x-2 bg-slate-800/90 pl-3 pr-2 py-1.5 rounded-xl border border-slate-700/80 cursor-pointer hover:border-amber-500/50 transition-all"
                title="View Subscription & Plan Details"
              >
                <div className="h-6 w-6 rounded-full bg-[#0057B8] flex items-center justify-center text-[10px] font-black text-white uppercase">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="block text-xs font-black text-slate-100 leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#FF7F00]/20 text-[#FF7F00] text-[9px] font-mono font-bold border border-[#FF7F00]/30">
                      {currentUser.subscription?.planName || 'Apprentice'}
                    </span>
                  </div>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    {(currentUser.subscription?.remainingCredits || 5000).toLocaleString()} Credits
                  </span>
                </div>
                {onLogout && (
                  <button
                    id="btn-logout-navbar"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogout();
                    }}
                    title="Sign Out"
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded-lg transition-colors ml-1"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              onOpenAuthModal && (
                <button
                  id="btn-login-navbar"
                  onClick={onOpenAuthModal}
                  className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-md"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

