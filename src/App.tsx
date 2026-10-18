import { useState, useRef, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ModulePlaceholder } from './components/layout/ModulePlaceholder';
import { SimpleOverviewDashboard } from './components/dashboard/SimpleOverviewDashboard';
import { WorkflowRegistryView } from './components/workflows/WorkflowRegistryView';
import { DependencyInvestigationView } from './components/investigations/DependencyInvestigationView';
import { GraphExplorerView } from './components/explorer/GraphExplorerView';
import { ActionCenterView } from './components/actions/ActionCenterView';
import { VerificationMemoryView } from './components/verification/VerificationMemoryView';
import { SettingsView } from './components/settings/SettingsView';
import { WorkflowDetailDrawer } from './components/dashboard/WorkflowDetailDrawer';
import { InvestigationModal } from './components/dashboard/InvestigationModal';
import type { WorkflowItem } from './types/workflow';
import type { NavModuleId } from './types/navigation';
import { type UserPersona, type UserRole, USER_PERSONAS } from './types/role';
import { sampleWorkflows } from './data/mockWorkflows';
import { GraphService, type FalkorHealthResponse } from './services/graphService';

export function App() {
  // Navigation state
  const [activeModule, setActiveModule] = useState<NavModuleId>('overview');

  // Role persona state: Consolidated 3 roles (EMPLOYEE, MANAGER, ADMIN_OPERATIONS)
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(USER_PERSONAS.MANAGER);

  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Search state
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Data state
  const [workflows] = useState<WorkflowItem[]>(sampleWorkflows);

  // Selected workflow for slide-over drawer & progressive disclosure level
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [drawerInitialMode, setDrawerInitialMode] = useState<'details' | 'investigation'>('details');

  // Investigation modal state
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState<boolean>(false);
  const [investigationContext, setInvestigationContext] = useState<{
    workflowTitle: string;
    blocker: string;
    workflowId?: string;
  }>({
    workflowTitle: 'Employee onboarding — Rahul Sharma',
    blocker: 'Application access approval missing from Sarah Lin',
    workflowId: 'wf-001'
  });

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
    // Reset view to Home when switching persona
    setActiveModule('overview');
  };

  const handleSelectWorkflow = (wf: WorkflowItem, mode: 'details' | 'investigation' = 'details') => {
    setSelectedWorkflow(wf);
    setDrawerInitialMode(mode);
  };

  const handleOpenInvestigation = (
    workflowTitle: string = 'Employee onboarding — Rahul Sharma',
    blocker: string = 'Application access approval missing',
    workflowId?: string
  ) => {
    setInvestigationContext({ workflowTitle, blocker, workflowId });
    setIsInvestigationModalOpen(true);
  };

  const handleJumpToGraph = () => {
    setActiveModule('graph_explorer');
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
      onSelectWorkflow={(wf) => handleSelectWorkflow(wf, 'details')}
      onJumpToGraph={handleJumpToGraph}
      searchQuery={globalSearch}
      onSearchChange={(q) => setGlobalSearch(q)}
      isSidebarCollapsed={isSidebarCollapsed}
      onToggleSidebar={handleToggleSidebar}
      currentPersona={currentPersona}
      onSelectPersona={handleSelectPersona}
    >
      {/* 1. Main Home Dashboard: 10-Second Mental Model + 3 Areas (Needs Attention, In Progress, Recently Completed) */}
      {activeModule === 'overview' ? (
        <SimpleOverviewDashboard
          workflows={workflows}
          currentPersona={currentPersona}
          falkorConnected={Boolean(falkorHealth?.falkorConnected)}
          onSelectWorkflow={handleSelectWorkflow}
          onOpenActionCenter={(_id) => setActiveModule('tasks')}
          onOpenExplorer={(wfId) => {
            if (wfId) setInvestigationContext((prev) => ({ ...prev, workflowId: wfId }));
            setActiveModule('graph_explorer');
          }}
          onOpenSettings={() => setActiveModule('settings')}
        />
      ) : activeModule === 'attention_needed' ? (
        /* Attention Needed: Filtered view of blocked items for Managers */
        <WorkflowRegistryView
          initialStatusFilter="Blocked"
          onBackToOverview={() => setActiveModule('overview')}
          onSelectWorkflow={(wf) => handleSelectWorkflow(wf, 'details')}
          onInvestigateWorkflow={(title, blocker, id) => handleOpenInvestigation(title, blocker, id)}
          onJumpToGraph={handleJumpToGraph}
          onOpenInvestigation={() => handleOpenInvestigation()}
        />
      ) : activeModule === 'workflows' ? (
        /* Workflows / Team Workflows Registry View */
        <WorkflowRegistryView
          onBackToOverview={() => setActiveModule('overview')}
          onSelectWorkflow={(wf) => handleSelectWorkflow(wf, 'details')}
          onInvestigateWorkflow={(title, blocker, id) => handleOpenInvestigation(title, blocker, id)}
          onJumpToGraph={handleJumpToGraph}
          onOpenInvestigation={() => handleOpenInvestigation()}
        />
      ) : activeModule === 'tasks' || activeModule === 'action_center' ? (
        /* My Work (Employee) or Action Queue (Admin / Operations) */
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
        /* History & Cryptographic Verification Ledger */
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
        /* System Health & Connector Diagnostics (Admin / Operations) */
        <SettingsView
          onBackToOverview={() => setActiveModule('overview')}
          onOpenExplorer={() => setActiveModule('graph_explorer')}
        />
      ) : activeModule === 'investigations' ? (
        /* Contextual Dependency Investigation (Level 3 / Deep Investigation) */
        <DependencyInvestigationView
          onBackToOverview={() => setActiveModule('overview')}
          onJumpToGraph={handleJumpToGraph}
          onOpenExplorer={() => setActiveModule('graph_explorer')}
          onOpenActionCenter={() => setActiveModule('tasks')}
          selectedWorkflowId={investigationContext.workflowId}
        />
      ) : activeModule === 'graph_explorer' ? (
        /* Level 4: Focused Dependency Graph Visualization */
        <GraphExplorerView
          onBackToOverview={() => setActiveModule('overview')}
          onOpenInvestigation={(title, blocker, wfId) => {
            handleOpenInvestigation(title, blocker, wfId);
            setActiveModule('investigations');
          }}
          onOpenActionCenter={() => setActiveModule('tasks')}
          initialWorkflowId={investigationContext.workflowId || 'wf-001'}
        />
      ) : (
        <ModulePlaceholder
          moduleId={activeModule}
          onReturnToOverview={() => setActiveModule('overview')}
        />
      )}

      {/* Slide-over Workflow Details Drawer: Progressive Levels 1-5 */}
      <WorkflowDetailDrawer
        workflow={selectedWorkflow}
        initialViewMode={drawerInitialMode}
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

      {/* Invisible ref anchor */}
      <div ref={graphSectionRef} className="h-0" />
    </AppShell>
  );
}

export default App;
