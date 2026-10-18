import React from 'react';
import type { WorkflowItem } from '../../types/workflow';
import type { UserPersona } from '../../types/role';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  User, 
  ShieldCheck, 
  Database,
  ChevronRight,
  ListTodo,
  Network
} from 'lucide-react';
import { DependencyGraphHero } from '../graph/DependencyGraphHero';

interface SimpleOverviewDashboardProps {
  workflows: WorkflowItem[];
  currentPersona: UserPersona;
  falkorConnected: boolean;
  onSelectWorkflow: (workflow: WorkflowItem, viewMode?: 'details' | 'investigation') => void;
  onOpenActionCenter: (actionId?: string) => void;
  onOpenExplorer?: (workflowId?: string) => void;
  onOpenInvestigation?: (title?: string, blocker?: string, id?: string) => void;
  onOpenSettings: () => void;
}

export const SimpleOverviewDashboard: React.FC<SimpleOverviewDashboardProps> = ({
  workflows,
  currentPersona,
  falkorConnected,
  onSelectWorkflow,
  onOpenActionCenter,
  onOpenExplorer,
  onOpenInvestigation,
  onOpenSettings,
}) => {
  const [showGraphHero, setShowGraphHero] = React.useState(true);
  // Filter workflows according to the role's authorized visibility scope
  const getFilteredWorkflows = () => {
    switch (currentPersona.role) {
      case 'EMPLOYEE':
        // Employee sees only their personal workflow(s) & items affecting their work
        return workflows.filter(
          (w) => w.id === 'wf-001' || w.owner.toLowerCase().includes('rahul') || w.title.toLowerCase().includes('rahul')
        );
      case 'MANAGER':
        // Manager sees team engineering & product workflows
        return workflows.filter(
          (w) =>
            w.team === 'HR Operations' ||
            w.team === 'Engineering' ||
            w.team === 'DevOps' ||
            w.team === 'Customer Success'
        );
      case 'ADMIN_OPERATIONS':
        // Admin / Operations sees all enterprise workflows
        return workflows;
      default:
        return workflows;
    }
  };

  const roleWorkflows = getFilteredWorkflows();

  // Three Main Areas:
  // A. Needs Attention (Blocked or Overdue)
  const needsAttentionList = roleWorkflows.filter(
    (w) => w.status === 'Blocked' || w.status === 'Overdue'
  );

  // B. In Progress (Pending or In Progress)
  const inProgressList = roleWorkflows.filter(
    (w) => w.status === 'In Progress' || w.status === 'Pending'
  );

  // C. Recently Completed (Verified)
  const recentlyCompletedList = roleWorkflows.filter(
    (w) => w.status === 'Verified'
  );

  // 10-Second Summary Workflow: The top blocked workflow requiring immediate resolution
  const topBlockedWorkflow = needsAttentionList[0] || roleWorkflows[0];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* 1. Page Heading and Role Purpose Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-sans">
              {currentPersona.role === 'EMPLOYEE'
                ? 'My Work & Status'
                : currentPersona.role === 'MANAGER'
                ? 'Team Workflows'
                : 'Operations Dashboard'}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              {currentPersona.role === 'ADMIN_OPERATIONS' ? 'Admin / Operations' : currentPersona.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentPersona.role === 'EMPLOYEE'
              ? 'See your personal work, understand blockers, and know what to do next.'
              : currentPersona.role === 'MANAGER'
              ? 'Understand team progress, resolve bottlenecks, and coordinate work.'
              : 'Keep enterprise workflows moving, resolve operational problems, and verify outcomes.'}
          </p>
        </div>

        {/* Quiet System State & Admin Quick Action */}
        <div className="flex items-center gap-2 shrink-0">
          {currentPersona.role === 'ADMIN_OPERATIONS' && (
            <button
              type="button"
              onClick={() => onOpenActionCenter()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 transition-colors shadow-2xs font-medium"
            >
              <ListTodo className="w-3.5 h-3.5 text-blue-600" />
              <span>Action Queue</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowGraphHero(!showGraphHero)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors shadow-2xs ${
              showGraphHero
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Knowledge Graph Hero"
          >
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span>Graph Hero</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-600 transition-colors shadow-2xs"
            title={falkorConnected ? 'FalkorDB graph engine is connected' : 'FalkorDB is in fallback fixture mode'}
          >
            <Database className={`w-3.5 h-3.5 ${falkorConnected ? 'text-teal-600' : 'text-amber-500'}`} />
            <span className="text-[11px] font-medium text-slate-700">
              Graph: {falkorConnected ? 'Connected' : 'Fixture'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. THE 10-SECOND WORKFLOW MENTAL MODEL BANNER */}
      <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-3.5 md:p-4 text-xs shadow-2xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>How ClosureLoop Resolves Workflows</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-700 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
            <span>Something needs to happen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
            <span>ClosureLoop finds the blocker</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
            <span>The right person acts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">4</span>
            <span>ClosureLoop verifies completion</span>
          </div>
        </div>
      </div>

      {/* 3. 5-POINT WORKFLOW SUMMARY (UNDERSTANDABLE IN 10 SECONDS) */}
      {topBlockedWorkflow && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-900">
                Current Priority Summary
              </span>
              <span className="text-[10px] text-slate-400">
                {currentPersona.role === 'EMPLOYEE' ? '(Your active onboarding)' : '(Critical blocked item)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectWorkflow(topBlockedWorkflow, 'details')}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
              >
                <span>View Workflow</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
            {/* 1. WORKFLOW */}
            <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                1. Workflow
              </span>
              <div className="font-bold text-slate-900 leading-snug">
                {topBlockedWorkflow.title}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Owner: {topBlockedWorkflow.owner}
              </div>
            </div>

            {/* 2. STATUS */}
            <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                2. Status
              </span>
              <div>
                <StatusBadge status={topBlockedWorkflow.status} size="sm" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{topBlockedWorkflow.daysStalled}d stalled</span>
              </div>
            </div>

            {/* 3. REASON */}
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>3. Reason</span>
              </span>
              <p className="text-slate-900 font-medium leading-snug">
                {topBlockedWorkflow.blocker}
              </p>
              <div className="text-[10px] text-amber-800 mt-1 font-mono">
                Entity: {topBlockedWorkflow.unresolvedEntity}
              </div>
            </div>

            {/* 4. NEXT STEP */}
            <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                4. Next Step
              </span>
              <p className="text-slate-800 leading-snug font-medium">
                {currentPersona.role === 'EMPLOYEE'
                  ? 'The authorized security approver must review the request. Nothing required from you right now.'
                  : `Authorized approver (${topBlockedWorkflow.unresolvedEntity}) must review and grant access.`}
              </p>
            </div>

            {/* 5. OUTCOME */}
            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 md:col-span-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>5. Verified Outcome</span>
              </span>
              <p className="text-slate-800 leading-snug">
                {topBlockedWorkflow.verificationGoal}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. KNOWLEDGE GRAPH HERO */}
      {showGraphHero && (
        <section className="relative z-10 space-y-3 pt-2 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Knowledge Graph Hero — Live Dependency Topology
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                FalkorDB Property Graph
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Interactive property graph • Click any node to inspect prerequisite state
            </span>
          </div>

          <DependencyGraphHero
            currentPersona={currentPersona}
            onOpenExplorer={() => {
              if (onOpenExplorer) {
                onOpenExplorer(topBlockedWorkflow?.id);
              }
            }}
            onOpenInvestigation={(title, blocker) => {
              if (onOpenInvestigation) {
                onOpenInvestigation(title, blocker, topBlockedWorkflow?.id);
              } else {
                onSelectWorkflow(topBlockedWorkflow, 'investigation');
              }
            }}
          />
        </section>
      )}

      {/* 5. THREE MAIN AREAS */}
      <div className="space-y-6">
        {/* A. NEEDS ATTENTION */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Needs Attention ({needsAttentionList.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Workflows requiring an action or decision
            </span>
          </div>

          {needsAttentionList.length === 0 ? (
            <div className="p-6 rounded-lg bg-white border border-slate-200 text-center text-xs text-slate-500">
              No blocked workflows currently require your attention.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
              {needsAttentionList.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Level 1 Overview Information */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                        onClick={() => onSelectWorkflow(workflow, 'details')}
                      >
                        {workflow.title}
                      </span>
                      <StatusBadge status={workflow.status} size="sm" />
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {workflow.team}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                      <span className="text-amber-800 font-medium">Blocker:</span>
                      <span>{workflow.blocker}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Next actor: <strong>{workflow.unresolvedEntity}</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Level 1 Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectWorkflow(workflow, 'investigation')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                      title="Inspect identified blocker and dependency evidence"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Why is this blocked?</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectWorkflow(workflow, 'details')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <span>View Workflow</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* B. IN PROGRESS */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                In Progress ({inProgressList.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Active workflows moving toward outcome verification
            </span>
          </div>

          {inProgressList.length === 0 ? (
            <div className="p-4 rounded-lg bg-white border border-slate-200 text-center text-xs text-slate-500">
              No workflows currently in progress.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
              {inProgressList.map((workflow) => (
                <div
                  key={workflow.id}
                  className="px-4 py-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onSelectWorkflow(workflow, 'details')}
                        className="text-xs font-semibold text-slate-900 hover:text-blue-600 cursor-pointer truncate"
                      >
                        {workflow.title}
                      </span>
                      <StatusBadge status={workflow.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Owner: {workflow.owner} ({workflow.team}) • Target verification: {workflow.verificationGoal}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectWorkflow(workflow, 'details')}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 font-medium transition-colors shrink-0"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* C. RECENTLY COMPLETED */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Recently Completed ({recentlyCompletedList.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Outcome verified and cryptographically recorded
            </span>
          </div>

          {recentlyCompletedList.length === 0 ? (
            <div className="p-4 rounded-lg bg-white border border-slate-200 text-center text-xs text-slate-500">
              No workflows recently completed.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden">
              {recentlyCompletedList.map((workflow) => (
                <div
                  key={workflow.id}
                  className="px-4 py-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {workflow.title}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{workflow.verificationGoal}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectWorkflow(workflow, 'details')}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 font-medium transition-colors shrink-0"
                  >
                    View History
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
