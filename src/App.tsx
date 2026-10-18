import { useState, useRef, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ModulePlaceholder } from './components/layout/ModulePlaceholder';
import { WorkflowRegistryView } from './components/workflows/WorkflowRegistryView';
import { DependencyInvestigationView } from './components/investigations/DependencyInvestigationView';
import { GraphExplorerView } from './components/explorer/GraphExplorerView';
import { ActionCenterView } from './components/actions/ActionCenterView';
import { VerificationMemoryView } from './components/verification/VerificationMemoryView';
import { SettingsView } from './components/settings/SettingsView';
import { KpiCardsSection } from './components/dashboard/KpiCard';
import { WorkflowTable } from './components/dashboard/WorkflowTable';
import { WorkflowDetailDrawer } from './components/dashboard/WorkflowDetailDrawer';
import { InvestigationModal } from './components/dashboard/InvestigationModal';
import type { WorkflowItem, DashboardMetrics } from './types/workflow';
import type { NavModuleId } from './types/navigation';
import { type UserPersona, type UserRole, USER_PERSONAS } from './types/role';
import { sampleWorkflows, dashboardMetrics } from './data/mockWorkflows';
import { 
  Database, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { GraphService, type FalkorHealthResponse } from './services/graphService';

export function App() {
  // Navigation state
  const [activeModule, setActiveModule] = useState<NavModuleId>('overview');

  // Role persona state
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(USER_PERSONAS.MANAGER);

  // Collapsible sidebar state (Tremor Planner pattern)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Search & Filter state
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Data state
  const [workflows] = useState<WorkflowItem[]>(sampleWorkflows);
  const [metrics] = useState<DashboardMetrics>(dashboardMetrics);

  // Selected workflow for slide-over drawer
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);

  // Investigation modal state
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState<boolean>(false);
  const [investigationContext, setInvestigationContext] = useState<{
    workflowTitle: string;
    blocker: string;
    workflowId?: string;
  }>({
    workflowTitle: 'Employee onboarding incomplete',
    blocker: 'Application access approval missing from Sarah Lin',
    workflowId: 'wf-001'
  });

  // Reference for scrolling to graph if invoked
  const graphSectionRef = useRef<HTMLDivElement>(null);

  // Live FalkorDB connectivity state
  const [falkorHealth, setFalkorHealth] = useState<FalkorHealthResponse | null>(null);

  useEffect(() => {
    GraphService.checkHealth().then(setFalkorHealth).catch(() => {});
  }, [activeModule]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleSelectPersona = (role: UserRole) => {
    setCurrentPersona(USER_PERSONAS[role]);
  };

  const handleOpenInvestigation = (
    workflowTitle: string = 'Employee onboarding incomplete',
    blocker: string = 'Application access approval missing',
    workflowId?: string
  ) => {
    setInvestigationContext({ workflowTitle, blocker, workflowId });
    setIsInvestigationModalOpen(true);
  };

  const handleJumpToGraph = () => {
    setActiveModule('graph_explorer');
  };

  const handleKpiFilterClick = (status: string) => {
    setStatusFilter(status);
  };

  // Keyboard shortcut listeners (⌘I for Investigation, ⌘B for Sidebar toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleOpenInvestigation();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppShell
      activeModule={activeModule}
      onSelectModule={(id) => setActiveModule(id)}
      onOpenInvestigation={() => handleOpenInvestigation()}
      onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
      onJumpToGraph={handleJumpToGraph}
      searchQuery={globalSearch}
      onSearchChange={(q) => setGlobalSearch(q)}
      isSidebarCollapsed={isSidebarCollapsed}
      onToggleSidebar={handleToggleSidebar}
      currentPersona={currentPersona}
      onSelectPersona={handleSelectPersona}
    >
      {/* Module 2: Dedicated Workflow Registry View */}
      {activeModule === 'workflows' ? (
        <WorkflowRegistryView
          onBackToOverview={() => setActiveModule('overview')}
          onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
          onInvestigateWorkflow={(title, blocker, id) => handleOpenInvestigation(title, blocker, id)}
          onJumpToGraph={handleJumpToGraph}
          onOpenInvestigation={() => handleOpenInvestigation()}
        />
      ) : activeModule === 'investigations' ? (
        /* Module 3: Dependency Investigation View */
        <DependencyInvestigationView
          onBackToOverview={() => setActiveModule('overview')}
          onJumpToGraph={handleJumpToGraph}
          onOpenExplorer={() => setActiveModule('graph_explorer')}
          onOpenActionCenter={() => setActiveModule('tasks')}
          selectedWorkflowId={investigationContext.workflowId}
        />
      ) : activeModule === 'graph_explorer' ? (
        /* Module 4: Graph Explorer View */
        <GraphExplorerView
          onBackToOverview={() => setActiveModule('overview')}
          onOpenInvestigation={(title, blocker, wfId) => {
            handleOpenInvestigation(title, blocker, wfId);
            setActiveModule('investigations');
          }}
          onOpenActionCenter={() => setActiveModule('tasks')}
          initialWorkflowId={investigationContext.workflowId || 'wf-001'}
        />
      ) : activeModule === 'tasks' || activeModule === 'action_center' ? (
        /* Module 5: My Tasks / Action Center View */
        <ActionCenterView
          onBackToOverview={() => setActiveModule('overview')}
          onOpenInvestigation={(title, blocker, wfId) => {
            handleOpenInvestigation(title, blocker, wfId);
            setActiveModule('investigations');
          }}
          onOpenExplorer={(wfId) => {
            if (wfId) setInvestigationContext((prev) => ({ ...prev, workflowId: wfId }));
            setActiveModule('graph_explorer');
          }}
          onOpenVerification={(wfId) => {
            if (wfId) setInvestigationContext((prev) => ({ ...prev, workflowId: wfId }));
            setActiveModule('history');
          }}
          initialWorkflowId={investigationContext.workflowId}
        />
      ) : activeModule === 'history' || activeModule === 'verification_memory' ? (
        /* Module 6: History & Verification Memory View */
        <VerificationMemoryView
          onBackToOverview={() => setActiveModule('overview')}
          onOpenExplorer={(wfId) => {
            if (wfId) setInvestigationContext((prev) => ({ ...prev, workflowId: wfId }));
            setActiveModule('graph_explorer');
          }}
          onOpenActionCenter={(_actionId) => {
            setActiveModule('tasks');
          }}
          onOpenInvestigation={(title, blocker, wfId) => {
            handleOpenInvestigation(title, blocker, wfId);
            setActiveModule('investigations');
          }}
          initialWorkflowId={investigationContext.workflowId}
        />
      ) : activeModule === 'settings' ? (
        /* Module 7: Settings & Integrations View */
        <SettingsView
          onBackToOverview={() => setActiveModule('overview')}
          onOpenExplorer={() => setActiveModule('graph_explorer')}
        />
      ) : activeModule !== 'overview' ? (
        <ModulePlaceholder
          moduleId={activeModule}
          onReturnToOverview={() => setActiveModule('overview')}
        />
      ) : (
        /* Module 1: Main Dashboard (Overview) — Answers: What is happening? What needs attention? What should I do next? */
        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-5">
          {/* Calm Page Heading and Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  Workflow Operations
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {currentPersona.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring business outcome completion and prerequisite dependencies.
              </p>
            </div>

            {/* Quiet Engine State */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModule('settings')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 transition-colors"
                title={falkorHealth?.falkorConnected ? "FalkorDB is online" : "FalkorDB offline; serving fallback fixture"}
              >
                <Database className={`w-3.5 h-3.5 ${falkorHealth?.falkorConnected ? 'text-teal-600' : 'text-amber-500'}`} />
                <span className="text-[11px] font-medium text-slate-700">
                  Graph: {falkorHealth?.falkorConnected ? 'Online' : 'Fallback'}
                </span>
              </button>
            </div>
          </div>

          {/* 1. What is happening? Compact overview of important workflow statuses */}
          <KpiCardsSection
            metrics={metrics}
            activeStatusFilter={statusFilter}
            onFilterClick={handleKpiFilterClick}
          />

          {/* 3. What should I do next? Prominent, calm next-action card tailored to current persona */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    Next Action Required
                  </span>
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {currentPersona.nextActionPrompt.headline}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {currentPersona.nextActionPrompt.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (currentPersona.nextActionPrompt.actionId) {
                    setActiveModule('tasks');
                  } else {
                    const target = workflows.find((w) => w.id === currentPersona.nextActionPrompt.workflowId);
                    if (target) setSelectedWorkflow(target);
                  }
                }}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{currentPersona.nextActionPrompt.buttonLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. What needs attention? Full-width clear list of workflows */}
          <div className="pt-1">
            <WorkflowTable
              workflows={workflows}
              searchQuery={globalSearch}
              onSearchChange={(q) => setGlobalSearch(q)}
              statusFilter={statusFilter}
              onStatusFilterChange={(status) => setStatusFilter(status)}
              onSelectWorkflow={(item) => setSelectedWorkflow(item)}
              onInvestigateWorkflow={(title, blocker, id) => handleOpenInvestigation(title, blocker, id)}
              onJumpToGraph={handleJumpToGraph}
            />
          </div>

          {/* Invisible ref anchor if needed */}
          <div ref={graphSectionRef} className="h-0" />
        </div>
      )}

      {/* Slide-over Workflow Details Drawer */}
      <WorkflowDetailDrawer
        workflow={selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
        onInvestigate={(title, blocker, id) => handleOpenInvestigation(title, blocker, id)}
        onJumpToGraph={handleJumpToGraph}
        onOpenExplorer={(wfId) => {
          if (wfId) setInvestigationContext((prev) => ({ ...prev, workflowId: wfId }));
          setActiveModule('graph_explorer');
        }}
        onOpenActionCenter={(_actionId) => {
          setActiveModule('tasks');
        }}
        currentPersona={currentPersona}
      />

      {/* Investigation Intake Modal */}
      <InvestigationModal
        isOpen={isInvestigationModalOpen}
        onClose={() => setIsInvestigationModalOpen(false)}
        preselectedWorkflowTitle={investigationContext.workflowTitle}
        preselectedBlocker={investigationContext.blocker}
        onOpenInvestigationRoom={() => {
          setIsInvestigationModalOpen(false);
          setActiveModule('investigations');
        }}
      />
    </AppShell>
  );
}

export default App;

