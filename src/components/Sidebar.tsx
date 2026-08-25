import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Layers,
  AlertTriangle,
  Settings2,
  LogOut,
  Sparkles,
  UserCheck,
  Calculator,
  Crown,
  Home,
  LogIn,
  Menu,
  X,
  Sun,
  Moon,
  Cookie,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react';
import { GatewayConfig, User } from '../types';
import { TidyCorpLogo } from './TidyCorpLogo';

interface SidebarProps {
  activeTab: 'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout';
  setActiveTab: (tab: 'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout') => void;
  gatewayConfig: GatewayConfig;
  currentUser?: User | null;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenCookieSettings?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  tab: SidebarProps['activeTab'];
  label: string;
  icon: any;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  gatewayConfig,
  currentUser,
  onLogout,
  onOpenAuthModal,
  theme = 'dark',
  onToggleTheme,
  onOpenCookieSettings,
  collapsed: controlledCollapsed,
  onToggleCollapse
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const navItems: NavItem[] = [
    { id: 'nav-tab-landing', tab: 'landing', label: 'Overview', icon: Home, iconColor: 'text-cyan-300' },
    { id: 'nav-tab-urgent-ai', tab: 'urgent_ai', label: 'AI Urgent Repair', icon: Sparkles, iconColor: 'text-[#FF7F00]', badge: 'Emergency', badgeColor: 'bg-[#FF7F00] text-slate-950' },
    { id: 'nav-tab-quoting-agent', tab: 'quoting_agent', label: 'Quoting Agent', icon: Calculator, iconColor: 'text-amber-400' },
    { id: 'nav-tab-dashboard', tab: 'dashboard', label: 'Dashboard', icon: Layers, iconColor: 'text-blue-400' },
    { id: 'nav-tab-projects', tab: 'projects', label: 'Track Escrows', icon: CreditCard, iconColor: 'text-indigo-400' },
    { id: 'nav-tab-contractors', tab: 'contractors', label: 'Vetted Contractors', icon: UserCheck, iconColor: 'text-cyan-300' },
    { id: 'nav-tab-compliance', tab: 'compliance', label: "Awaab's Law", icon: AlertTriangle, iconColor: 'text-amber-400' },
    { id: 'nav-tab-pricing', tab: 'pricing', label: 'Pricing & Plans', icon: Crown, iconColor: 'text-amber-300' },
    { id: 'nav-tab-checkout', tab: 'checkout', label: 'Escrow Portal', icon: ShieldCheck, iconColor: 'text-emerald-400' },
    { id: 'nav-tab-mcp', tab: 'mcp', label: 'Settings', icon: Settings2, iconColor: 'text-cyan-400' },
  ];

  const handleSelectTab = (tab: SidebarProps['activeTab']) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Bar with Hamburger */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => handleSelectTab('landing')}
        >
          <TidyCorpLogo className="h-8 w-8" />
          <span className="font-black text-base text-white tracking-tight">
            tidy corporation LTD
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-cyan-300" />}
            </button>
          )}
          <button
            id="mobile-sidebar-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
            aria-label="Toggle Sidebar"
          >
            {mobileOpen ? <X className="h-5 w-5 text-amber-400" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Container (Desktop Persistent + Mobile Slide-out Drawer) */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-100 transition-all duration-300 ease-in-out shadow-2xl lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Sidebar Header: Logo & Branding */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <div
            className="flex items-center space-x-3 cursor-pointer select-none overflow-hidden"
            onClick={() => handleSelectTab('landing')}
          >
            <TidyCorpLogo className="h-9 w-9 shrink-0" />
            {!collapsed && (
              <span className="font-black text-sm tracking-tight text-white whitespace-nowrap truncate">
                tidy corporation LTD
              </span>
            )}
          </div>

          {/* Desktop Collapse/Expand Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-auto"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
          {!collapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                id={item.id}
                onClick={() => handleSelectTab(item.tab as any)}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all group ${
                  collapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#0057B8] text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : item.iconColor}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                      item.badgeColor || 'bg-[#FF7F00] text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: User Details, Theme Toggle, Privacy & Sign Out */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2 shrink-0">
          {currentUser ? (
            <div
              onClick={() => handleSelectTab('pricing')}
              className={`flex items-center rounded-xl bg-slate-800/70 border border-slate-700/60 cursor-pointer hover:border-amber-500/50 transition-all ${
                collapsed ? 'justify-center p-2' : 'p-2.5 space-x-2.5'
              }`}
              title="Subscription & Plan Details"
            >
              <div className="h-7 w-7 rounded-full bg-[#0057B8] flex items-center justify-center text-[10px] font-black text-white uppercase shrink-0">
                {currentUser.name.slice(0, 2)}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-bold text-slate-100 truncate">
                      {currentUser.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#FF7F00]/20 text-[#FF7F00] text-[9px] font-mono font-bold border border-[#FF7F00]/30 shrink-0">
                      {currentUser.subscription?.planName || 'Apprentice'}
                    </span>
                  </div>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    {(currentUser.subscription?.remainingCredits || 5000).toLocaleString()} Credits
                  </span>
                </div>
              )}
            </div>
          ) : (
            onOpenAuthModal && (
              <button
                id="btn-login-sidebar"
                onClick={onOpenAuthModal}
                className={`w-full bg-[#FF7F00] hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center shadow-md ${
                  collapsed ? 'p-2.5' : 'py-2.5 px-3 space-x-1.5'
                }`}
                title="Sign In"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Sign In</span>}
              </button>
            )
          )}

          {/* Action buttons row: Theme, Cookie Settings, Logout */}
          <div className={`flex items-center ${collapsed ? 'flex-col space-y-1.5' : 'justify-between space-x-1'}`}>
            {onToggleTheme && (
              <button
                id="btn-theme-toggle"
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center justify-center border border-slate-700/80 shrink-0"
                title={theme === 'dark' ? 'Switch to Magazine Light Mode' : 'Switch to Outdoor Site Dark Mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-cyan-300" />
                )}
              </button>
            )}

            {onOpenCookieSettings && (
              <button
                id="btn-cookie-settings-sidebar"
                onClick={onOpenCookieSettings}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-all border border-slate-700/80 shrink-0"
                title="Cookie & UK Privacy Preferences"
              >
                <Cookie className="h-3.5 w-3.5" />
              </button>
            )}

            {currentUser && onLogout && (
              <button
                id="btn-logout-sidebar"
                onClick={onLogout}
                className={`p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-all border border-slate-700/80 flex items-center justify-center ${
                  !collapsed ? 'flex-1 space-x-1 text-xs' : ''
                }`}
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
