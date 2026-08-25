import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Layers, AlertTriangle, Settings2, Shield, LogOut, Sparkles, UserCheck, Calculator, Crown, Home, LogIn, Menu, X, Sun, Moon, Cookie } from 'lucide-react';
import { GatewayConfig, User } from '../types';
import { TidyCorpLogo } from './TidyCorpLogo';

interface NavbarProps {
  activeTab: 'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout';
  setActiveTab: (tab: 'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout') => void;
  gatewayConfig: GatewayConfig;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenCookieSettings?: () => void;
}

interface NavItem {
  id: string;
  tab: NavbarProps['activeTab'];
  label: string;
  icon: any;
  iconColor: string;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  gatewayConfig,
  currentUser,
  onLogout,
  onOpenAuthModal,
  theme = 'dark',
  onToggleTheme,
  onOpenCookieSettings
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'nav-tab-landing', tab: 'landing', label: 'Overview', icon: Home, iconColor: 'text-cyan-300' },
    { id: 'nav-tab-urgent-ai', tab: 'urgent_ai', label: 'AI Urgent Repair', icon: Sparkles, iconColor: 'text-[#FF7F00]', badge: 'Emergency' },
    { id: 'nav-tab-quoting-agent', tab: 'quoting_agent', label: 'Quoting Agent', icon: Calculator, iconColor: 'text-amber-400' },
    { id: 'nav-tab-dashboard', tab: 'dashboard', label: 'Dashboard', icon: Layers, iconColor: 'text-blue-400' },
    { id: 'nav-tab-projects', tab: 'projects', label: 'Track Escrows', icon: CreditCard, iconColor: 'text-indigo-400' },
    { id: 'nav-tab-contractors', tab: 'contractors', label: 'Vetted Contractors', icon: UserCheck, iconColor: 'text-cyan-300' },
    { id: 'nav-tab-compliance', tab: 'compliance', label: "Awaab's Law", icon: AlertTriangle, iconColor: 'text-amber-400' },
    { id: 'nav-tab-mcp', tab: 'mcp', label: 'Settings', icon: Settings2, iconColor: 'text-cyan-400' },
    { id: 'nav-tab-pricing', tab: 'pricing', label: 'Pricing & Plans', icon: Crown, iconColor: 'text-amber-300' },
    { id: 'nav-tab-checkout', tab: 'checkout', label: 'Escrow Portal', icon: ShieldCheck, iconColor: 'text-emerald-400' },
  ];

  const handleSelectTab = (tab: NavbarProps['activeTab']) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header id="main-navbar" className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" onClick={() => handleSelectTab('landing')}>
            <TidyCorpLogo className="h-8 w-8 sm:h-10 sm:w-10" />
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-black text-sm sm:text-lg tracking-tight text-white whitespace-nowrap">
                  Tidy Corp <span className="text-[#FF7F00]">AI Secure</span>
                </span>
                <span className="hidden sm:inline-block bg-[#0057B8]/30 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-blue-400/30 whitespace-nowrap">
                  Tidy Secure Pay
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden xl:block font-medium">
                UK Property Renovations, 90d Escrow &amp; Statutory Compliance Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Visible on XL screens) */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  id={item.id}
                  onClick={() => handleSelectTab(item.tab as any)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0057B8] text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Medium Screens Tablet Nav Bar (Visible on lg & md screens, compact mode) */}
          <nav className="hidden md:flex xl:hidden items-center space-x-1 overflow-x-auto max-w-[50vw] scrollbar-none py-1">
            <button
              id="nav-tab-landing"
              onClick={() => handleSelectTab('landing')}
              className={`p-2 rounded-lg transition-all ${activeTab === 'landing' ? 'bg-[#0057B8] text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              title="Overview"
            >
              <Home className="h-4 w-4 text-cyan-300" />
            </button>
            <button
              id="nav-tab-urgent-ai"
              onClick={() => handleSelectTab('urgent_ai')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1 transition-all ${activeTab === 'urgent_ai' ? 'bg-[#0057B8] text-white' : 'text-amber-300 hover:bg-slate-800'}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF7F00]" />
              <span>Urgent</span>
            </button>
            <button
              id="nav-tab-quoting-agent"
              onClick={() => handleSelectTab('quoting_agent')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1 transition-all ${activeTab === 'quoting_agent' ? 'bg-[#FF7F00] text-slate-950' : 'text-amber-400 hover:bg-slate-800'}`}
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>Quotes</span>
            </button>
            <button
              id="nav-tab-dashboard"
              onClick={() => handleSelectTab('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${activeTab === 'dashboard' ? 'bg-[#0057B8] text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-tab-projects"
              onClick={() => handleSelectTab('projects')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${activeTab === 'projects' ? 'bg-[#0057B8] text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
              <span>Escrows</span>
            </button>
          </nav>

          {/* User Profile / Auth Button & Hamburger Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentUser ? (
              <div
                onClick={() => handleSelectTab('pricing')}
                className="flex items-center space-x-2 bg-slate-800/90 pl-2 sm:pl-3 pr-1.5 sm:pr-2 py-1 sm:py-1.5 rounded-xl border border-slate-700/80 cursor-pointer hover:border-amber-500/50 transition-all shrink-0"
                title="View Subscription & Plan Details"
              >
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-[#0057B8] flex items-center justify-center text-[10px] sm:text-xs font-black text-white uppercase shrink-0">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="block text-xs font-black text-slate-100 leading-tight truncate max-w-[100px]">
                      {currentUser.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#FF7F00]/20 text-[#FF7F00] text-[9px] font-mono font-bold border border-[#FF7F00]/30 whitespace-nowrap">
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
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-amber-400 rounded-lg transition-colors ml-0.5"
                  >
                    <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>
            ) : (
              onOpenAuthModal && (
                <button
                  id="btn-login-navbar"
                  onClick={onOpenAuthModal}
                  className="bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-md shrink-0"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              )
            )}

            {/* Day / Night Theme Mode Switcher Toggle Button */}
            {onToggleTheme && (
              <button
                id="btn-theme-toggle"
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center space-x-1.5 border border-slate-700/80 shrink-0"
                title={theme === 'dark' ? 'Switch to Magazine Light Mode' : 'Switch to Outdoor Site Dark Mode (#0A1128)'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-400" />
                    <span className="hidden lg:inline text-[10px] font-bold text-amber-300">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-cyan-300" />
                    <span className="hidden lg:inline text-[10px] font-bold text-cyan-200">Site Dark</span>
                  </>
                )}
              </button>
            )}

            {/* Cookie & Privacy Preferences Button */}
            {onOpenCookieSettings && (
              <button
                id="btn-cookie-settings-nav"
                onClick={onOpenCookieSettings}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-all border border-slate-700/80 shrink-0"
                title="Cookie & UK Privacy Preferences"
              >
                <Cookie className="h-4 w-4" />
              </button>
            )}

            {/* Hamburger Button for Mobile & Tablet */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0057B8] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-amber-400" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-900/98 backdrop-blur-xl border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400 px-2 py-1 font-bold">
            Navigation Menu
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  id={`mobile-${item.id}`}
                  onClick={() => handleSelectTab(item.tab as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-[#0057B8] text-white shadow-md'
                      : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] bg-[#FF7F00] text-slate-950 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile User Profile Summary & Actions */}
          {currentUser && (
            <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between px-2">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-[#0057B8] flex items-center justify-center text-xs font-black text-white uppercase">
                  {currentUser.name.slice(0, 2)}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400">{currentUser.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono font-bold">
                  {(currentUser.subscription?.remainingCredits || 5000).toLocaleString()} CR
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

