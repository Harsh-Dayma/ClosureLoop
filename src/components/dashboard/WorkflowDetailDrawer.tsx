import React from 'react';
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
  ExternalLink
} from 'lucide-react';

interface WorkflowDetailDrawerProps {
  workflow: WorkflowItem | null;
  onClose: () => void;
  onInvestigate: (workflowTitle: string, blocker: string, workflowId?: string) => void;
  onJumpToGraph: () => void;
  onOpenExplorer?: (workflowId?: string) => void;
  onOpenActionCenter?: (actionId?: string) => void;
  currentPersona?: UserPersona;
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
}) => {
  if (!workflow) return null;

  const isBlocked = workflow.status === 'Blocked' || workflow.status === 'Overdue';

  // Specific tasks mapped to workflow entity or generated from system metadata
  const tasks: WorkflowTask[] = workflow.id === 'wf-001' ? [
    {
      id: 'tsk-1',
      name: 'Workday HR Profile Creation',
      owner: 'Elena Rostova',
      system: 'Workday',
      status: 'COMPLETED',
      requirement: 'Employee profile EMP-90214 active'
    },
    {
      id: 'tsk-2',
      name: 'Okta Identity & SSO Provisioning',
      owner: 'James Patel',
      system: 'Okta',
      status: 'COMPLETED',
      requirement: 'MFA active & Google Workspace created'
    },
    {
      id: 'tsk-3',
      name: 'Manager Sprint & Tooling Setup',
      owner: 'David Chen',
      system: 'Jira',
      status: 'COMPLETED',
      requirement: 'Hardware received & team repo access'
    },
    {
      id: 'tsk-4',
      name: 'AWS Core Dev IAM Access Sign-off',
      owner: 'Sarah Lin',
      system: 'AWS IAM / JIRA',
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
      actor: 'System Telemetry',
      event: 'Outcome verification check failed: 0 production commit signatures found.',
      type: 'warning'
    },
    {
      time: '1d ago',
      actor: 'ClosureLoop Graph Traverser',
      event: `Identified bottleneck dependency on ${workflow.unresolvedEntity}.`,
      type: 'info'
    },
    {
      time: '2d ago',
      actor: workflow.owner,
      event: 'Initiated workflow lifecycle and intermediate tasks.',
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

          {/* Drawer Body: Strict A -> B -> C -> D -> E Order */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs text-slate-700">
            {/* A. Current Status & Next Action */}
            <section className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/90 space-y-2.5">
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

            {/* B. Tasks List */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-slate-900 tracking-wider">
                  Workflow Tasks ({tasks.length})
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
                          {task.requirement}
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

            {/* C. Blocker Explanation (Only shown if blocked) */}
            {isBlocked && (
              <section className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Identified Dependency Blocker</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-700">What is blocking it:</span>
                    <p className="text-slate-900 font-medium mt-0.5">{workflow.blocker}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Why it is blocking completion:</span>
                    <p className="text-slate-600 mt-0.5">
                      Intermediate tasks are satisfied, but the final business outcome requires verification. Missing access prevents telemetry verification from executing.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60">
                    <div>
                      <span className="font-semibold text-slate-700">Next Actor:</span>
                      <p className="text-amber-900 font-medium">{workflow.unresolvedEntity}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Evidence:</span>
                      <p className="text-slate-600 font-mono text-[10px]">
                        {workflow.daysStalled}d stalled • SLA breach
                      </p>
                    </div>
                  </div>
                </div>

                {/* On-demand Dependency Investigation / Graph trigger */}
                <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenExplorer) {
                        onOpenExplorer(workflow.id);
                      } else {
                        onJumpToGraph();
                      }
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-semibold rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Network className="w-3.5 h-3.5 text-blue-600" />
                    <span>Investigate in Graph</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onInvestigate(workflow.title, workflow.blocker, workflow.id);
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open Case</span>
                  </button>
                </div>
              </section>
            )}

            {/* D. Authorized Actions */}
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
                    onClick={() => {
                      onClose();
                      if (onOpenActionCenter) onOpenActionCenter('ACT-2026-0901');
                    }}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Review in Action Center</span>
                  </button>
                ) : (
                  <button
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

            {/* E. History & Verification Audit */}
            <section className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-900 tracking-wider block">
                Workflow History & Verification
              </span>

              <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2.5">
                {historyEvents.map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[11px]">
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

