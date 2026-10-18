import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  ActionItem, 
  ActionStatus, 
  ActionUrgency, 
  ActionFilters,
  ActionActor 
} from '../../types/action.js';
import { ActionService, type ActionStats } from '../../services/actionService.js';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ChevronRight,
  RefreshCw,
  X,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Check,
  Eye,
  MessageSquare,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';

interface ActionCenterViewProps {
  onBackToOverview: () => void;
  onOpenInvestigation: (workflowTitle: string, blocker: string, workflowId?: string) => void;
  onOpenExplorer: (workflowId?: string) => void;
  onOpenVerification?: (workflowId?: string) => void;
  initialWorkflowId?: string;
}

export const ActionCenterView: React.FC<ActionCenterViewProps> = ({
  onBackToOverview,
  onOpenInvestigation,
  onOpenExplorer,
  onOpenVerification,
  initialWorkflowId
}) => {
  // State
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [stats, setStats] = useState<ActionStats>({
    total: 0,
    pendingReview: 0,
    readyForExecution: 0,
    awaitingVerification: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>('ACT-2026-0901');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'evidence' | 'integration' | 'audit'>('overview');

  // Filters
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'ALL'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<ActionUrgency | 'ALL'>('ALL');
  const [workflowFilter, setWorkflowFilter] = useState<string>(initialWorkflowId || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync workflowFilter when navigating from other modules
  const [prevInitialWorkflowId, setPrevInitialWorkflowId] = useState(initialWorkflowId);
  if (initialWorkflowId !== prevInitialWorkflowId) {
    setPrevInitialWorkflowId(initialWorkflowId);
    if (initialWorkflowId) {
      setWorkflowFilter(initialWorkflowId);
    }
  }

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'EXECUTE';
    action: ActionItem | null;
  }>({
    isOpen: false,
    type: 'APPROVE',
    action: null
  });
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Execution Progress Animation State
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Current authorized user persona for demo review operations
  const currentActor: ActionActor = useMemo(() => ({
    id: 'usr-104',
    name: 'David Chen',
    role: 'Engineering Director & Delegated Reviewer',
    email: 'david.chen@closureloop.io',
    avatarInitials: 'DC'
  }), []);

  // Manual refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Synchronize actions from backend
  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const filters: ActionFilters = {
          status: statusFilter,
          urgency: urgencyFilter,
          workflowId: workflowFilter,
          searchQuery: searchQuery.trim() || undefined
        };
        const res = await ActionService.getActions(filters);
        if (isCancelled) return;
        setActions(res.actions);
        setStats(res.stats);

        if (res.actions.length > 0) {
          setSelectedActionId((prev) => (prev && res.actions.some((a) => a.id === prev) ? prev : res.actions[0].id));
        } else {
          setSelectedActionId(null);
        }
      } catch (err: any) {
        console.error('Failed to load actions:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, urgencyFilter, workflowFilter, searchQuery, refreshTrigger]);

  // Selected Action Item
  const selectedAction = useMemo(() => {
    return actions.find((a) => a.id === selectedActionId) || null;
  }, [actions, selectedActionId]);

  // Open Decision Modal
  const handleOpenDecision = (type: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'EXECUTE', action: ActionItem) => {
    setDecisionNotes('');
    setDecisionModal({ isOpen: true, type, action });
  };

  // Submit Decision
  const handleConfirmDecision = async () => {
    if (!decisionModal.action) return;
    setIsSubmittingDecision(true);

    const actionId = decisionModal.action.id;

    try {
      if (decisionModal.type === 'EXECUTE') {
        // Trigger realistic step-by-step execution animation
        setIsExecutingAction(true);
        setExecutionStep(1);
        await new Promise((r) => setTimeout(r, 600));
        setExecutionStep(2);
        await new Promise((r) => setTimeout(r, 700));
        setExecutionStep(3);
        await new Promise((r) => setTimeout(r, 600));

        const res = await ActionService.executeAction(actionId, currentActor);
        setIsExecutingAction(false);
        setExecutionStep(0);

        if (res.success) {
          setFeedbackNotice({
            type: 'success',
            message: `Dispatched action '${actionId}'! Status transitioned to AWAITING_VERIFICATION.`
          });
        } else {
          setFeedbackNotice({
            type: 'error',
            message: res.message
          });
        }
      } else {
        // Review transition (APPROVE, REJECT, REQUEST_INFO)
        const res = await ActionService.reviewAction(
          actionId,
          decisionModal.type,
          currentActor,
          decisionNotes.trim() || undefined
        );

        if (res.success) {
          setFeedbackNotice({
            type: 'success',
            message: `Action '${actionId}' successfully updated: Decision '${decisionModal.type}' recorded in audit trail.`
          });
        } else {
          setFeedbackNotice({
            type: 'error',
            message: res.error || 'Failed to submit review decision.'
          });
        }
      }

      setDecisionModal({ isOpen: false, type: 'APPROVE', action: null });
      handleRefresh();
      setTimeout(() => setFeedbackNotice(null), 5000);
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        message: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Reset demo repository state
  const handleResetDemoState = async () => {
    setIsRefreshing(true);
    await ActionService.resetActions();
    handleRefresh();
    setFeedbackNotice({
      type: 'success',
      message: 'Action Center reset to clean demonstration baseline.'
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Urgency styling helper
  const getUrgencyBadge = (urgency: ActionUrgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  // Status styling helper
  const getStatusBadge = (status: ActionStatus) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'READY_FOR_EXECUTION':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-300">
            <Play className="w-3 h-3 text-blue-600" />
            Ready for Execution
          </span>
        );
      case 'AWAITING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-300">
            <Zap className="w-3 h-3 text-purple-600" />
            Awaiting Verification
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-900 border border-rose-300">
            <X className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden select-none">
      {/* 1. Header & Navigation Shell (adapted from shadcn-admin & next-shadcn-dashboard-starter) */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Breadcrumb & Title */}
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-1">
              <button 
                onClick={onBackToOverview}
                className="hover:text-blue-600 transition-colors"
              >
                ClosureLoop
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Operations</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-semibold">Action Center (Module 5)</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Action Review & Execution Center
              </h1>
              <span className="text-xs text-slate-500 hidden sm:inline">·</span>
              <p className="text-xs text-slate-500 hidden sm:inline">
                Human-in-the-loop review, automated dispatch, and immutable audit logging.
              </p>
            </div>
          </div>

          {/* Quick Stats Pills & Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetDemoState}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Reset action repository to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset State</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Feedback Notice */}
        {feedbackNotice && (
          <div
            className={`mt-2.5 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between gap-2 border ${
              feedbackNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackNotice.message}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Top Metric Cards (from shadcndashboard) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3 pt-3 border-t border-slate-100">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Actions</span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5">{stats.total}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80">
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Pending Review</span>
            <div className="text-base font-extrabold text-amber-900 mt-0.5">{stats.pendingReview}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200/80">
            <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Ready to Execute</span>
            <div className="text-base font-extrabold text-blue-900 mt-0.5">{stats.readyForExecution}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200/80">
            <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">Awaiting Telemetry</span>
            <div className="text-base font-extrabold text-purple-900 mt-0.5">{stats.awaitingVerification}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Completed</span>
            <div className="text-base font-extrabold text-emerald-900 mt-0.5">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar (from satnaing/shadcn-admin data table toolbar) */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 text-[11px] font-medium overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'PENDING_REVIEW', label: 'Pending Review' },
            { id: 'READY_FOR_EXECUTION', label: 'Ready' },
            { id: 'AWAITING_VERIFICATION', label: 'Awaiting Telemetry' },
            { id: 'COMPLETED', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Search & Facet Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value as any)}
            className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Workflow Filter */}
          <select
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[160px] truncate"
          >
            <option value="ALL">All Workflows</option>
            <option value="wf-001">Jordan Hayes Onboarding (wf-001)</option>
            <option value="wf-002">Release v2.14.0 (wf-002)</option>
            <option value="wf-003">Vendor Setup (wf-003)</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actions or blockers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-6 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 md:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Body: Actions Table + Slide-Over Review Drawer (Master-Detail) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Action Queue Table (from satnaing/shadcn-admin) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-xs font-medium">Loading action queue...</p>
            </div>
          ) : actions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Actions Match the Current Filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting "All Actions" or resetting your search query to view other resolution items.
              </p>
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setUrgencyFilter('ALL');
                  setWorkflowFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Action Item & Workflow</th>
                      <th className="py-3 px-4">Unresolved Dependency / Blocker</th>
                      <th className="py-3 px-4">Responsible Owner</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actions.map((action) => {
                      const isSelected = selectedActionId === action.id;
                      return (
                        <tr
                          key={action.id}
                          onClick={() => {
                            setSelectedActionId(action.id);
                            setIsDrawerOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/50 hover:bg-blue-50/70'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Title & Workflow */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                {action.id}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {action.investigationId}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 line-clamp-1">{action.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span>{action.workflowTitle}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-400">{action.department}</span>
                            </div>
                          </td>

                          {/* Blocker */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-800 line-clamp-1">
                              {action.blocker.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              System: <span className="font-medium text-slate-700">{action.blocker.system}</span>
                            </div>
                            <div className="text-[10px] text-amber-700 font-mono font-semibold mt-0.5">
                              Stalled: {action.blocker.durationStalled}
                            </div>
                          </td>

                          {/* Responsible Party */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {action.blocker.responsibleParty.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{action.blocker.responsibleParty}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                                  {action.blocker.responsibleRole}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Urgency */}
                          <td className="py-3.5 px-4">
                            {getUrgencyBadge(action.urgency)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {getStatusBadge(action.status)}
                          </td>

                          {/* Review CTA */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActionId(action.id);
                                setIsDrawerOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Action Details Review Drawer (from shadcndashboard & satnaing/shadcn-admin) */}
        {isDrawerOpen && selectedAction && (
          <aside className="w-96 md:w-[440px] border-l border-slate-200 bg-white flex flex-col shrink-0 z-10 shadow-xl overflow-hidden text-xs">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between">
              <div className="space-y-1 min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    {selectedAction.id}
                  </span>
                  {getUrgencyBadge(selectedAction.urgency)}
                  {getStatusBadge(selectedAction.status)}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {selectedAction.title}
                </h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Close review panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cross-Module Navigation Shortcuts */}
            <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-[11px]">
              <button
                onClick={() => onOpenInvestigation(
                  selectedAction.workflowTitle,
                  selectedAction.blocker.name,
                  selectedAction.workflowId
                )}
                className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline"
              >
                <Eye className="w-3 h-3" />
                <span>Source Investigation ({selectedAction.investigationId})</span>
              </button>
              <button
                onClick={() => onOpenExplorer(selectedAction.workflowId)}
                className="text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Graph Canvas</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-white px-3">
              {[
                { id: 'overview', label: 'Overview & Blocker' },
                { id: 'evidence', label: `Evidence (${selectedAction.evidenceReferences.length})` },
                { id: 'integration', label: 'Integration' },
                { id: 'audit', label: `Audit Trail (${selectedAction.auditTrail.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id as any)}
                  className={`py-2 px-2.5 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    drawerTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {drawerTab === 'overview' && (
                <div className="space-y-4">
                  {/* Blocker Breakdown Card */}
                  <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Motivating Unresolved Blocker</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      {selectedAction.blocker.name}
                    </div>
                    <div className="text-[11px] text-amber-900 leading-relaxed">
                      System: <strong>{selectedAction.blocker.system}</strong> (Ticket: {selectedAction.blocker.ticketId || 'N/A'})
                    </div>
                    <div className="text-[11px] text-amber-900">
                      Duration Stalled: <strong className="text-amber-950 font-mono">{selectedAction.blocker.durationStalled}</strong>
                    </div>
                    <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-amber-800">Responsible Decision Maker:</span>
                      <strong className="text-slate-900 font-semibold">{selectedAction.blocker.responsibleParty} ({selectedAction.blocker.responsibleRole})</strong>
                    </div>
                  </div>

                  {/* Proposed Resolution */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Proposed Resolution Action
                    </h4>
                    <p className="text-[11px] text-slate-700 leading-relaxed p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      {selectedAction.proposedResolution}
                    </p>
                  </div>

                  {/* Expected Business Outcome */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Expected Business Outcome
                    </h4>
                    <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>{selectedAction.expectedOutcome}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Required Authorizations Checklist */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Required Authorizations & Policy Gates
                    </h4>
                    <div className="space-y-1">
                      {selectedAction.requiredAuthorizations.map((auth, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{auth}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outcome Verification Gate Notice */}
                  <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 space-y-1 text-purple-950 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Module 6 Verification Prerequisite</span>
                    </div>
                    <p className="leading-relaxed">
                      {selectedAction.verificationRequirement.notes}
                    </p>
                    <div className="font-mono text-[10px] text-purple-800 pt-1">
                      Target Metric: {selectedAction.verificationRequirement.metric} ({selectedAction.verificationRequirement.targetCondition})
                    </div>
                    {onOpenVerification && (
                      <button
                        onClick={() => onOpenVerification(selectedAction.workflowId)}
                        className="mt-2 w-full py-1.5 px-2.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Open in Verification & Memory</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {drawerTab === 'evidence' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    The following records from FalkorDB, Jira, and GitHub substantiate this recommended action:
                  </p>
                  <div className="space-y-2">
                    {selectedAction.evidenceReferences.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-blue-700 uppercase">{ev.type}</span>
                          <span className="text-slate-400 font-mono">{ev.sourceSystem}</span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs">{ev.title}</div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-mono text-[10px] bg-white p-2 rounded border border-slate-100">
                          {ev.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {drawerTab === 'integration' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target System Interface
                    </span>
                    <div className="font-bold text-slate-900">{selectedAction.targetIntegration.name}</div>
                    <div className="text-[11px] text-slate-600">
                      System: <strong>{selectedAction.targetIntegration.system}</strong>
                    </div>
                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] leading-relaxed">
                      <strong>Adapter Mode:</strong> {selectedAction.targetIntegration.adapterType}
                      <br />
                      {selectedAction.targetIntegration.endpointNote}
                    </div>
                  </div>

                  {selectedAction.targetIntegration.simulatedPayload && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Dispatch Payload Preview
                      </h4>
                      <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-800">
                        {JSON.stringify(selectedAction.targetIntegration.simulatedPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'audit' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Immutable Audit History
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {selectedAction.auditTrail.length} Events Logged
                    </span>
                  </div>

                  {/* Chronological Timeline (from sjorsbogers/Dashboard-Design) */}
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 pl-6">
                    {selectedAction.auditTrail.map((ev) => (
                      <div key={ev.id} className="relative space-y-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[18px] top-1 ring-4 ring-white" />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-900">{ev.event}</span>
                          <span className="text-slate-400 font-mono">
                            {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          By <strong className="text-slate-800">{ev.actor.name}</strong> ({ev.actor.role})
                        </div>
                        {ev.notes && (
                          <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
                            "{ev.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions (from satnaing/shadcn-admin) */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 space-y-2">
              {selectedAction.status === 'PENDING_REVIEW' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDecision('APPROVE', selectedAction)}
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Action</span>
                  </button>
                  <button
                    onClick={() => handleOpenDecision('REJECT', selectedAction)}
                    className="py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-rose-700 font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleOpenDecision('REQUEST_INFO', selectedAction)}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                    title="Request Information"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              {selectedAction.status === 'READY_FOR_EXECUTION' && (
                <button
                  onClick={() => handleOpenDecision('EXECUTE', selectedAction)}
                  className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute Action via Adapter</span>
                </button>
              )}

              {selectedAction.status === 'AWAITING_VERIFICATION' && (
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 text-center space-y-1">
                  <div className="font-bold text-xs flex items-center justify-center gap-1 text-purple-900">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Action Executed & Dispatched</span>
                  </div>
                  <p className="text-[10px] text-purple-800">
                    Awaiting telemetry verification in <strong>Module 6: Verification & Memory</strong>.
                  </p>
                </div>
              )}

              {selectedAction.status === 'COMPLETED' && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Action Completed and Verified</span>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 5. Review & Execution Decision Modal (from satnaing/shadcn-admin dialog) */}
      {decisionModal.isOpen && decisionModal.action && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg border ${
                    decisionModal.type === 'APPROVE'
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : decisionModal.type === 'EXECUTE'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : decisionModal.type === 'REJECT'
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {decisionModal.type === 'APPROVE' ? (
                    <Check className="w-5 h-5" />
                  ) : decisionModal.type === 'EXECUTE' ? (
                    <Play className="w-5 h-5" />
                  ) : decisionModal.type === 'REJECT' ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {decisionModal.type === 'APPROVE' && 'Approve Proposed Action'}
                    {decisionModal.type === 'EXECUTE' && 'Confirm Action Execution'}
                    {decisionModal.type === 'REJECT' && 'Reject Proposed Action'}
                    {decisionModal.type === 'REQUEST_INFO' && 'Request Additional Context'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {decisionModal.action.id} · {decisionModal.action.workflowTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDecisionModal({ isOpen: false, type: 'APPROVE', action: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Authorized Reviewer Persona Badge */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500">Authorized Operator:</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  {currentActor.avatarInitials}
                </span>
                <span>{currentActor.name} ({currentActor.role})</span>
              </div>
            </div>

            {/* Modal Body Info */}
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong>Action:</strong> {decisionModal.action.title}
              </p>
              <p>
                <strong>Unresolved Blocker:</strong> {decisionModal.action.blocker.name} ({decisionModal.action.blocker.responsibleParty})
              </p>

              {decisionModal.type === 'EXECUTE' ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Safe Execution Policy</span>
                  </div>
                  <p>
                    Executing this action will dispatch the payload via <strong>{decisionModal.action.targetIntegration.name}</strong>. The target business outcome is NOT automatically marked complete until verified in Module 6.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Decision Justification & Audit Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Enter audit notes or instructions for this decision..."
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* In-Flight Execution Progress Animation */}
              {isExecutingAction && (
                <div className="p-3 rounded-lg bg-slate-950 text-slate-200 space-y-2 font-mono text-[11px] border border-slate-800">
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Dispatching Action Pipeline...</span>
                  </div>
                  <div className="space-y-1 text-slate-400">
                    <div className={executionStep >= 1 ? 'text-emerald-300' : 'text-slate-600'}>
                      ✔ Step 1: Validating reviewer policy authorization...
                    </div>
                    <div className={executionStep >= 2 ? 'text-emerald-300' : 'text-slate-600'}>
                      ✔ Step 2: Preparing payload for {decisionModal.action.targetIntegration.name}...
                    </div>
                    <div className={executionStep >= 3 ? 'text-emerald-300' : 'text-slate-600'}>
                      ✔ Step 3: Recording immutable audit trail & advancing to Awaiting Verification...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDecisionModal({ isOpen: false, type: 'APPROVE', action: null })}
                disabled={isSubmittingDecision}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={isSubmittingDecision}
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                  decisionModal.type === 'APPROVE'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : decisionModal.type === 'EXECUTE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : decisionModal.type === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {isSubmittingDecision && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {decisionModal.type === 'APPROVE' && 'Confirm Approval'}
                  {decisionModal.type === 'EXECUTE' && 'Dispatch Action'}
                  {decisionModal.type === 'REJECT' && 'Confirm Rejection'}
                  {decisionModal.type === 'REQUEST_INFO' && 'Submit Request'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
