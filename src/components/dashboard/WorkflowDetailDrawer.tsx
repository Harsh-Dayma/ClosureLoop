import React, { useState } from 'react';
import type { WorkflowItem } from '../../types/workflow';
import type { UserPersona } from '../../types/role';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  X, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Network, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  User,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Code2,
  Layers
} from 'lucide-react';

interface WorkflowDetailDrawerProps {
  workflow: WorkflowItem | null;
  onClose: () => void;
  onInvestigate: (workflowTitle: string, blocker: string, workflowId?: string) => void;
  onJumpToGraph: () => void;
  onOpenExplorer?: (workflowId?: string) => void;
  onOpenActionCenter?: (actionId?: string) => void;
  currentPersona?: UserPersona;
  initialViewMode?: 'details' | 'investigation';
}

interface WorkflowTask {
  id: string;
  name: string;
  owner: string;
  system: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED' | 'PENDING';
  requirement: string;
}

export const WorkflowDetailDrawer: React.FC<WorkflowDetailDrawerProps> = ({
  workflow,
  onClose,
  onInvestigate,
  onJumpToGraph,
  onOpenExplorer,
  onOpenActionCenter,
  currentPersona,
  initialViewMode = 'details',
}) => {
  // Controlled view mode for Level 2 (Details) vs Level 3 (Investigation)
  const [viewMode, setViewMode] = useState<'details' | 'investigation'>(initialViewMode);
  const [prevInitialMode, setPrevInitialMode] = useState(initialViewMode);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Sync state if initialViewMode prop changes (Oxlint safe render-time state adjustment)
  if (initialViewMode !== prevInitialMode) {
    setPrevInitialMode(initialViewMode);
    setViewMode(initialViewMode);
  }

  if (!workflow) return null;

  const isBlocked = workflow.status === 'Blocked' || workflow.status === 'Overdue';

  // Level 2 Tasks mapped to workflow
  const tasks: WorkflowTask[] = workflow.id === 'wf-001' ? [
    {
      id: 'tsk-1',
      name: 'Workday HR Profile Creation',
      owner: 'Elena Rostova',
      system: 'Workday HCM',
      status: 'COMPLETED',
      requirement: 'Profile EMP-90214 active'
    },
    {
      id: 'tsk-2',
      name: 'Okta Identity & SSO Provisioning',
      owner: 'James Patel',
      system: 'Okta Identity',
      status: 'COMPLETED',
      requirement: 'MFA active & Google Workspace created'
    },
    {
      id: 'tsk-3',
      name: 'Manager Sprint & Tooling Setup',
      owner: 'David Chen',
      system: 'Jira Software',
      status: 'COMPLETED',
      requirement: 'Hardware received & repo access'
    },
    {
      id: 'tsk-4',
      name: 'AWS Core Dev IAM Access Sign-off',
      owner: 'Sarah Lin',
      system: 'AWS IAM / Jira',
      status: 'BLOCKED',
      requirement: 'Security ticket SEC-TKT-9912 pending (+18h SLA breach)'
    }
  ] : workflow.id === 'wf-002' ? [
    {
      id: 'tsk-201',
      name: 'Vendor Master Profile Creation',
      owner: 'Marcus Brody',
      system: 'NetSuite',
      status: 'COMPLETED',
      requirement: 'Legal entity record active'
    },
    {
      id: 'tsk-202',
      name: 'Tax Form W-9 Validation',
      owner: 'Procurement Team',
      system: 'Coupa',
      status: 'COMPLETED',
      requirement: 'EIN cryptographic match verified'
    },
    {
      id: 'tsk-203',
      name: '1-Cent Penny Deposit Settlement',
      owner: 'FinOps Banking',
      system: 'JPMorgan API',
      status: 'PENDING',
      requirement: 'ACH clearing confirmation in progress'
    }
  ] : [
    {
      id: 'tsk-gen-1',
      name: 'Prerequisite Intake & System Registration',
      owner: workflow.owner,
      system: workflow.systems?.[0] || 'System Core',
      status: 'COMPLETED',
      requirement: 'Record validation passed'
    },
    {
      id: 'tsk-gen-2',
      name: workflow.blocker || 'Secondary Approval Gate',
      owner: workflow.unresolvedEntity || 'Pending Assignee',
      system: workflow.systems?.[1] || 'Service Desk',
      status: isBlocked ? 'BLOCKED' : 'IN_PROGRESS',
      requirement: isBlocked ? 'Prerequisite dependency unresolved' : 'Review in progress'
    }
  ];

  // History timeline events for this workflow
  const historyEvents = [
    {
      time: '18h ago',
      actor: 'ClosureLoop Verification Engine',
      event: 'Outcome verification check failed: 0 production commit signatures found in GitHub.',
      type: 'warning'
    },
    {
      time: '1d ago',
      actor: 'FalkorDB Graph Traverser',
      event: `Identified unresolved prerequisite edge connecting to ${workflow.unresolvedEntity}.`,
      type: 'info'
    },
    {
      time: '2d ago',
      actor: workflow.owner,
      event: 'Initiated workflow lifecycle and intermediate tasks in Workday.',
      type: 'success'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800 shrink-0">
            <div className="pr-4 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {workflow.team}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                  workflow.urgency === 'high' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {workflow.urgency} Urgency
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight leading-snug truncate">
                {workflow.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors shrink-0"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Tabs: Level 2 (Workflow Tasks) vs Level 3 (Blocker Investigation) */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('details')}
              className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                viewMode === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Workflow Tasks (Level 2)
            </button>
            {isBlocked && (
              <button
                type="button"
                onClick={() => setViewMode('investigation')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  viewMode === 'investigation'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Why is this blocked? (Level 3)</span>
              </button>
            )}
          </div>

          {/* Drawer Body */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs text-slate-700">
            {/* LEVEL 1 SUMMARY IN HEADER: Status, Owner, Next Action */}
            <section className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Workflow Status
                  </span>
                  <div className="mt-0.5">
                    <StatusBadge status={workflow.status} size="sm" />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Owner
                  </span>
                  <div className="mt-0.5 font-semibold text-slate-900 flex items-center gap-1.5 justify-end">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{workflow.owner}</span>
                  </div>
                </div>
              </div>

              {/* Next Required Action */}
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                  Next Required Action
                </span>
                <p className="mt-0.5 text-slate-800 font-medium leading-relaxed">
                  {isBlocked
                    ? `Sign-off required from ${workflow.unresolvedEntity} to unlock prerequisite dependency.`
                    : `Await verification metric check: ${workflow.verificationGoal}.`}
                </p>
              </div>
            </section>

            {/* LEVEL 2: WORKFLOW DETAILS (Tasks, Owners, Statuses, Dependencies) */}
            {viewMode === 'details' && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold text-slate-900 tracking-wider">
                    Relevant Tasks & Dependencies ({tasks.length})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {tasks.filter(t => t.status === 'COMPLETED').length}/{tasks.length} Completed
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 bg-white">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-2.5 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {task.status === 'COMPLETED' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : task.status === 'BLOCKED' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-900 truncate">{task.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate pl-5">
                            Requirement: {task.requirement}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {task.system}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {task.owner}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* LEVEL 3: INVESTIGATION DETAILS (Identified Blocker, Dependency Path, Evidence) */}
            {viewMode === 'investigation' && isBlocked && (
              <section className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Identified Dependency Blocker</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    FalkorDB Graph Verified
                  </span>
                </div>

                {/* What is blocking it */}
                <div className="space-y-1 text-[11px]">
                  <span className="font-bold text-slate-800">What is blocking it:</span>
                  <p className="text-slate-900 bg-white p-2 rounded-md border border-amber-200 font-medium">
                    {workflow.blocker}
                  </p>
                </div>

                {/* Dependency Path */}
                <div className="space-y-1 text-[11px]">
                  <span className="font-bold text-slate-800">Dependency Path Traversed:</span>
                  <div className="p-2.5 rounded-md bg-white border border-amber-200 font-mono text-[10px] text-slate-700 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Layers className="w-3 h-3 text-blue-600" />
                      <span>(:Workflow {`{id: "${workflow.id}"}`})</span>
                    </div>
                    <div className="pl-3 text-slate-400">└─[:HAS_STAGE]──&gt; (:Task "AWS Dev IAM Role")</div>
                    <div className="pl-6 text-slate-400">└─[:REQUIRES_SECURITY_SIGNOFF]──&gt; (:Approval "SEC-TKT-9912")</div>
                    <div className="pl-9 text-amber-700 font-bold">└─[:ASSIGNED_TO]──&gt; (:Person "{workflow.unresolvedEntity}") [STALLED]</div>
                  </div>
                </div>

                {/* Next Actor & Supporting Evidence */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-white border border-amber-200">
                    <span className="font-bold text-slate-700 block">Responsible Owner:</span>
                    <span className="text-amber-900 font-semibold">{workflow.unresolvedEntity}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-amber-200">
                    <span className="font-bold text-slate-700 block">Supporting Evidence:</span>
                    <span className="text-slate-700 font-mono text-[10px]">
                      Ticket SEC-TKT-9912 • {workflow.daysStalled}d SLA breach
                    </span>
                  </div>
                </div>

                {/* LEVEL 4 TRIGGER: Explore Dependencies in Graph */}
                <div className="pt-2 border-t border-amber-200/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenExplorer) {
                        onOpenExplorer(workflow.id);
                      } else {
                        onJumpToGraph();
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Network className="w-3.5 h-3.5 text-blue-600" />
                    <span>Explore Dependencies (Level 4 Graph)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onInvestigate(workflow.title, workflow.blocker, workflow.id);
                    }}
                    className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open Case Room</span>
                  </button>
                </div>
              </section>
            )}

            {/* AUTHORIZED ACTIONS (Scoped to Persona Permissions) */}
            <section className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-900 tracking-wider">
                  Authorized Actions
                </span>
                {currentPersona && (
                  <span className="text-[10px] text-slate-500">
                    Role: <strong className="text-slate-800">{currentPersona.role}</strong>
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {currentPersona?.permissions.canSignOffSecurity && workflow.id === 'wf-001' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenActionCenter) onOpenActionCenter('ACT-2026-0901');
                    }}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sign Off Security Approval (SEC-TKT-9912)</span>
                  </button>
                ) : currentPersona?.permissions.canApproveEscalations ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenActionCenter) onOpenActionCenter('ACT-2026-0901');
                    }}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Review in Action Queue</span>
                  </button>
                ) : currentPersona?.role === 'EMPLOYEE' ? (
                  <div className="p-2.5 rounded-md bg-white border border-slate-200 text-center text-xs text-slate-500">
                    Nothing is required from you right now. Waiting on security sign-off.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenActionCenter) onOpenActionCenter();
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Assigned Actions</span>
                  </button>
                )}
              </div>
            </section>

            {/* LEVEL 5: TECHNICAL EVIDENCE (Authorized for Manager / Admin) */}
            {currentPersona?.role !== 'EMPLOYEE' && (
              <section className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left text-xs font-semibold text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Technical Details (Level 5 Diagnostics)</span>
                  </div>
                  {showTechnicalDetails ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showTechnicalDetails && (
                  <div className="p-3 bg-slate-900 text-slate-300 font-mono text-[10px] space-y-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Cypher Query Traversal:</span>
                      <code className="text-teal-300 block bg-slate-950 p-2 rounded mt-0.5 overflow-x-auto whitespace-pre-wrap">
                        {`MATCH (w:Workflow {id: "${workflow.id}"})-[:HAS_STAGE]->(t:Task)-[:REQUIRES_ACCESS]->(a:Access)-[:REQUIRES_SECURITY_SIGNOFF]->(app:Approval) RETURN w, t, a, app;`}
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800 text-[9px]">
                      <span>Engine: FalkorDB TCP (Port 6379)</span>
                      <span>Latency: 14.8ms</span>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* RECENT HISTORY & AUDIT */}
            <section className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-900 tracking-wider block">
                Verification History
              </span>

              <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                {historyEvents.map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span>{evt.actor}</span>
                        <span>{evt.time}</span>
                      </div>
                      <p className="text-slate-700 mt-0.5 leading-snug">{evt.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium rounded-lg text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
