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
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { RenovationProject, MCPRule, GatewayConfig, PaymentTransaction, User } from './types';
import { initialProjects, defaultMCPRules, defaultGatewayConfig, initialTransactions } from './data/mockData';
import { Shield, X, LogIn } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'urgent_ai' | 'quoting_agent' | 'pricing' | 'dashboard' | 'projects' | 'contractors' | 'compliance' | 'mcp' | 'checkout'>('landing');

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

  // Protect internal feature tabs if user is not logged in
  useEffect(() => {
    if (!currentUser && activeTab !== 'landing') {
      setIsAuthModalOpen(true);
      setActiveTab('landing');
    }
  }, [currentUser, activeTab]);

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
      />
    </div>
  );
}
