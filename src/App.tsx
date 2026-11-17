import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { DashboardOverview } from './components/DashboardOverview';
import { ProjectManager } from './components/ProjectManager';
import { AwaabsLawCompliance } from './components/AwaabsLawCompliance';
import { NewProjectModal } from './components/NewProjectModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { MCPController } from './components/MCPController';
import { ClientCheckoutPortal } from './components/ClientCheckoutPortal';
import { WelcomeAuthScreen } from './components/WelcomeAuthScreen';
import { UrgentRepairAIForm } from './components/UrgentRepairAIForm';
import { QuotingAgent } from './components/QuotingAgent';
import { AdminContractorManager } from './components/AdminContractorManager';
import { PricingSubscriptionPortal } from './components/PricingSubscriptionPortal';
import { PartnerProgramPortal } from './components/PartnerProgramPortal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { ErrorPage, ErrorStatusCode } from './components/ErrorPage';
import { capturePartnerStackReferralFromUrl, initPartnerStackJS } from './lib/partnerStackClient';
import { RenovationProject, MCPRule, GatewayConfig, PaymentTransaction, User } from './types';
import { initialProjects, defaultMCPRules, defaultGatewayConfig, initialTransactions } from './data/mockData';
import { Shield, X, LogIn } from 'lucide-react';

type AppTab = 'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'partners' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout';

const PATH_TO_TAB: Record<string, AppTab> = {
  '/': 'landing',
  '/home': 'landing',
  '/urgent-repair': 'urgent_ai',
  '/quoting': 'quoting_agent',
  '/pricing': 'pricing',
  '/partners': 'partners',
  '/dashboard': 'dashboard',
  '/projects': 'projects',
  '/contractors': 'contractors',
  '/compliance': 'compliance',
  '/mcp': 'mcp',
  '/checkout': 'checkout'
};

function parseInitialRoute(): { tab: AppTab; errorStatus: ErrorStatusCode | null; errorPath: string } {
  if (typeof window === 'undefined') {
    return { tab: 'landing', errorStatus: null, errorPath: '/' };
  }
  const rawPath = window.location.pathname || '/';
  const normalizedPath = rawPath.length > 1 ? rawPath.replace(/\/+$/, '').toLowerCase() : '/';
  const params = new URLSearchParams(window.location.search);
  const errorParam = params.get('error');

  if (normalizedPath === '/403' || errorParam === '403') {
    return { tab: 'landing', errorStatus: 403, errorPath: rawPath };
  }
  if (normalizedPath === '/404' || errorParam === '404') {
    return { tab: 'landing', errorStatus: 404, errorPath: rawPath };
  }
  if (normalizedPath === '/500' || normalizedPath === '/error' || errorParam === '500') {
    return { tab: 'landing', errorStatus: 500, errorPath: rawPath };
  }
  if (normalizedPath === '/503' || errorParam === '503') {
    return { tab: 'landing', errorStatus: 503, errorPath: rawPath };
  }

  const matchedTab = PATH_TO_TAB[normalizedPath];
  if (matchedTab) {
    return { tab: matchedTab, errorStatus: null, errorPath: rawPath };
  }

  return { tab: 'landing', errorStatus: 404, errorPath: rawPath };
}

export default function App() {
  const initialRoute = parseInitialRoute();
  const [activeTab, setActiveTab] = useState<AppTab>(initialRoute.tab);
  const [routeError, setRouteError] = useState<{ statusCode: ErrorStatusCode; path: string } | null>(
    initialRoute.errorStatus
      ? { statusCode: initialRoute.errorStatus, path: initialRoute.errorPath }
      : null
  );

  // User Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [projects, setProjects] = useState<RenovationProject[]>([]);
  const [mcpRules, setMcpRules] = useState<MCPRule[]>(defaultMCPRules);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig>(defaultGatewayConfig);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<RenovationProject | null>(null);

  // Selected milestone for Client Portal simulation
  const [checkoutMilestoneId, setCheckoutMilestoneId] = useState<string | null>(null);

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Cookie Consent Preferences Modal state
  const [isCookieModalOpen, setIsCookieModalOpen] = useState<boolean>(false);

  // Smart Day/Night Theme Mode state ('light' by default or stored)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tidy_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('tidy_theme', nextTheme);
  };

  const [paymentBanner, setPaymentBanner] = useState<{ type: 'success' | 'cancelled'; message: string } | null>(null);
  const [partnerStackPublicKey, setPartnerStackPublicKey] = useState<string>('');

  // Initialize PartnerStack URL referral capture & PartnerStackJS loader (respecting UK GDPR consent)
  useEffect(() => {
    capturePartnerStackReferralFromUrl();
    fetch('/api/partnerstack/config')
      .then(res => res.json())
      .then(data => {
        const pubKey = data?.config?.publicKey;
        if (data?.config?.enabled && pubKey) {
          setPartnerStackPublicKey(pubKey);
          initPartnerStackJS(pubKey, true);
        }
      })
      .catch(() => {
        // Non-blocking PartnerStack bootstrap
      });
  }, []);

  // Check for Stripe Checkout redirect returns (?payment_status=success&session_id=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const sessionId = params.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setPaymentBanner({
        type: 'success',
        message: 'Verifying payment with Stripe Payments UK...'
      });

      fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.verified && data.paymentStatus === 'paid') {
            setPaymentBanner({
              type: 'success',
              message: `Payment of £${data.receipt?.amount?.toFixed(2) || ''} GBP verified via Stripe! Subscription is now active.`
            });
            if (data.subscription) {
              setCurrentUser(prev => prev ? { ...prev, subscription: data.subscription } : prev);
            }
          } else {
            setPaymentBanner({
              type: 'success',
              message: 'Stripe payment received and processed successfully!'
            });
          }
        })
        .catch(err => {
          console.error('Session verify error:', err);
          setPaymentBanner({
            type: 'success',
            message: 'Stripe checkout complete. Subscription updated!'
          });
        });
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setPaymentBanner({
        type: 'cancelled',
        message: 'Stripe Hosted Checkout was cancelled. No charges were made.'
      });
    }
  }, []);

  // Keep browser history navigation synced with active route & custom error page
  useEffect(() => {
    const handlePopState = () => {
      const next = parseInitialRoute();
      if (next.errorStatus) {
        setRouteError({ statusCode: next.errorStatus, path: next.errorPath });
      } else {
        setRouteError(null);
        setActiveTab(next.tab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protect internal feature tabs if user is not logged in
  useEffect(() => {
    if (!routeError && !currentUser && activeTab !== 'landing') {
      setIsAuthModalOpen(true);
      setActiveTab('landing');
    }
  }, [currentUser, activeTab, routeError]);

  // Check auth session on mount
  useEffect(() => {
    const token = localStorage.getItem('tidy_secure_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('tidy_secure_token');
          }
        })
        .catch(() => {
          console.log('Session check fallback');
        })
        .finally(() => setIsLoadingAuth(false));
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  // Fetch app data from API whenever currentUser changes & auto-poll every 5s for real-time client-contractor sync
  useEffect(() => {
    const refreshData = () => {
      const token = localStorage.getItem('tidy_secure_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (currentUser) {
        fetch('/api/projects', { headers })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setProjects(data);
              // Update selected project if active
              setSelectedProject(prev => {
                if (!prev) return null;
                const match = data.find(p => p.id === prev.id);
                return match || prev;
              });
            } else {
              setProjects([]);
            }
          })
          .catch(() => setProjects([]));

        fetch('/api/transactions', { headers })
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setTransactions(data); else setTransactions([]); })
          .catch(() => setTransactions([]));
      } else {
        setProjects([]);
        setTransactions([]);
      }

      fetch('/api/mcp/rules', { headers })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setMcpRules(data); })
        .catch(() => console.log('Using local initial rules state'));

      fetch('/api/gateways/config', { headers })
        .then(res => res.json())
        .then(data => { if (data && data.stripe) setGatewayConfig(data); })
        .catch(() => console.log('Using local initial config state'));
    };

    refreshData();

    if (currentUser) {
      const interval = setInterval(refreshData, 5000);
      window.addEventListener('focus', refreshData);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', refreshData);
      };
    }
  }, [currentUser]);

  // Logout Handler
  const handleLogout = async () => {
    const token = localStorage.getItem('tidy_secure_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem('tidy_secure_token');
    setCurrentUser(null);
  };

  // Handler: Save New Project
  const handleSaveProject = async (newProjData: Partial<RenovationProject>) => {
    try {
      const token = localStorage.getItem('tidy_secure_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify(newProjData)
      });
      if (res.ok) {
        const created = await res.json();
        setProjects(prev => [created, ...prev]);
      } else {
        // Fallback local update
        const fallbackProject: RenovationProject = {
          id: `proj-${Date.now()}`,
          title: newProjData.title || 'Untitled Renovation',
          clientName: newProjData.clientName || 'Client',
          clientEmail: newProjData.clientEmail || 'client@example.com',
          totalAmount: newProjData.totalAmount || 50000,
          currency: newProjData.currency || 'USD',
          startDate: newProjData.startDate || new Date().toISOString().split('T')[0],
          estimatedDurationMonths: newProjData.estimatedDurationMonths || 12,
          status: 'active',
          milestones: newProjData.milestones as any || [],
          createdAt: new Date().toISOString()
        };
        setProjects(prev => [fallbackProject, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Toggle MCP Rule
  const handleToggleRule = async (ruleId: string, active: boolean) => {
    setMcpRules(prev =>
      prev.map(r => r.id === ruleId ? { ...r, isActive: active } : r)
    );
    try {
      await fetch(`/api/mcp/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Update Gateway Config
  const handleUpdateGatewayConfig = async (newCfg: Partial<GatewayConfig>) => {
    const updated = { ...gatewayConfig, ...newCfg };
    setGatewayConfig(updated);
    try {
      await fetch('/api/gateways/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Process Milestone Payment
  const handlePayMilestone = async (
    projectId: string,
    milestoneId: string,
    method: string,
    cardDetails?: any
  ) => {
    try {
      const token = localStorage.getItem('tidy_secure_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/payments/pay', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId,
          milestoneId,
          paymentMethod: method,
          cardDetails
        })
      });

      if (res.ok) {
        const result = await res.json();
        // Update local state
        setProjects(prev =>
          prev.map(p => p.id === projectId ? result.project : p)
        );
        setTransactions(prev => [result.transaction, ...prev]);
      } else {
        // Fallback local state update
        setProjects(prev =>
          prev.map(p => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              milestones: p.milestones.map(m => m.id === milestoneId ? { ...m, status: 'paid', paidAt: new Date().toISOString() } : m)
            };
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Update Project (e.g. reminders, schedule type)
  const handleUpdateProject = async (updatedProject: RenovationProject) => {
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    try {
      const token = localStorage.getItem('tidy_secure_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedProject)
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to jump directly to client portal with a specific milestone selected
  const handleOpenPortalForMilestone = (project: RenovationProject, milestoneId: string) => {
    setSelectedProject(project);
    setCheckoutMilestoneId(milestoneId);
    setActiveTab('checkout');
  };

  const handleReturnFromErrorPage = (targetTab: AppTab = 'landing', openAuthIfLoggedOut = false) => {
    setRouteError(null);
    try {
      window.history.pushState({}, document.title, '/');
    } catch {
      // ignore history errors
    }
    if (targetTab !== 'landing' && !currentUser) {
      setActiveTab('landing');
      if (openAuthIfLoggedOut) {
        setIsAuthModalOpen(true);
      }
      return;
    }
    setActiveTab(targetTab);
  };

  // Loading screen during auth check
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#0057B8] to-[#FF7F00] flex items-center justify-center text-white shadow-xl animate-pulse mb-4">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-xl font-black tracking-tight">tidy corporation LTD</h2>
        <p className="text-slate-400 text-xs mt-1">Verifying Escrow Portal Authentication...</p>
      </div>
    );
  }

  if (routeError) {
    return (
      <ErrorPage
        statusCode={routeError.statusCode}
        path={routeError.path}
        theme={theme}
        onReturnHome={() => handleReturnFromErrorPage('landing')}
        onOpenPricing={() => handleReturnFromErrorPage('pricing', true)}
        onOpenPartners={() => {
          handleReturnFromErrorPage('partners', false);
          if (!currentUser) {
            setTimeout(() => {
              const el = document.getElementById('partnerstack-landing-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }}
      />
    );
  }

  return (
    <div id="app-root" className={`min-h-screen font-sans antialiased flex flex-col lg:flex-row transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#0A1128] text-slate-100'
    }`}>
      {/* Sidebar Navigation (Only shown when user is logged in) */}
      {currentUser && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          gatewayConfig={gatewayConfig}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCookieSettings={() => setIsCookieModalOpen(true)}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Main View Container (with left offset on desktop when sidebar is rendered) */}
      <main className={`flex-1 w-full transition-all duration-300 ${currentUser ? (isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64') : ''} ${activeTab === 'landing' ? 'px-0 py-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        
        {/* Stripe Hosted Checkout Notification Banner */}
        {paymentBanner && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between shadow-lg transition-all animate-fade-in ${
            paymentBanner.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-100'
              : 'bg-amber-950/80 border-amber-700 text-amber-100'
          }`}>
            <div className="flex items-center space-x-3">
              <span className={`h-2.5 w-2.5 rounded-full ${paymentBanner.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-sm font-semibold">{paymentBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setPaymentBanner(null)}
              className="text-xs px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'landing' && (
          <LandingPage
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenCookieSettings={() => setIsCookieModalOpen(true)}
          />
        )}

        {activeTab === 'urgent_ai' && (
          <UrgentRepairAIForm
            currentUser={currentUser}
            onProjectCreated={newProj => {
              setProjects(prev => [newProj, ...prev]);
            }}
            onNavigateToCheckout={(proj, msId) => {
              setSelectedProject(proj);
              setCheckoutMilestoneId(msId);
              setActiveTab('checkout');
            }}
          />
        )}

        {activeTab === 'quoting_agent' && (
          <QuotingAgent
            currentUser={currentUser}
            onProjectCreated={newProj => {
              setProjects(prev => [newProj, ...prev]);
            }}
            onOpenProjectDetail={proj => {
              setSelectedProject(proj);
            }}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingSubscriptionPortal
            currentUser={currentUser}
            onUserUpdate={setCurrentUser}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'partners' && (
          <PartnerProgramPortal
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview
            projects={projects}
            transactions={transactions}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
            onSelectProject={p => setSelectedProject(p)}
            onOpenPortalForMilestone={handleOpenPortalForMilestone}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManager
            projects={projects}
            onOpenNewProject={() => setIsNewProjectOpen(true)}
            onSelectProject={p => setSelectedProject(p)}
            onOpenPortalForMilestone={handleOpenPortalForMilestone}
          />
        )}

        {activeTab === 'contractors' && (
          <AdminContractorManager />
        )}

        {activeTab === 'compliance' && (
          <AwaabsLawCompliance />
        )}

        {activeTab === 'mcp' && (
          <MCPController
            mcpRules={mcpRules}
            gatewayConfig={gatewayConfig}
            onUpdateGatewayConfig={handleUpdateGatewayConfig}
            onToggleRule={handleToggleRule}
          />
        )}

        {activeTab === 'checkout' && (
          <ClientCheckoutPortal
            projects={projects}
            selectedProject={selectedProject}
            selectedMilestoneId={checkoutMilestoneId}
            onPayMilestone={handlePayMilestone}
          />
        )}
      </main>

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSaveProject={handleSaveProject}
      />

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onOpenPortalForMilestone={handleOpenPortalForMilestone}
        onUpdateProject={handleUpdateProject}
      />

      {/* Auth Modal Overlay */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-4xl w-full my-8">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full transition-all"
              title="Close Modal"
            >
              <X className="h-5 w-5" />
            </button>
            <WelcomeAuthScreen
              onLoginSuccess={(user, token) => {
                setCurrentUser(user);
                setIsAuthModalOpen(false);
                setActiveTab('dashboard');
              }}
            />
          </div>
        </div>
      )}
      {/* UK GDPR & PECR Cookie Consent Banner & Preferences Modal */}
      <CookieConsentBanner
        forceOpenModal={isCookieModalOpen}
        onCloseModal={() => setIsCookieModalOpen(false)}
        onConsentUpdated={prefs => {
          if (prefs.marketing && partnerStackPublicKey) {
            initPartnerStackJS(partnerStackPublicKey, false);
          }
        }}
      />
    </div>
  );
}
