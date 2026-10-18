import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  Play,
  Database,
  ExternalLink,
  Search,
  Clock,
  User,
  Brain,
  History,
  CheckSquare,
  ArrowRight
} from 'lucide-react';
import type {
  WorkflowVerificationRecord,
  VerificationCheck,
  VerificationEvent,
  HistoricalMemoryRecord,
  VerificationStats,
  VerificationScenario,
  VerificationCategory,
  VerificationCheckStatus
} from '../../types/verification';
import { VerificationService } from '../../services/verificationService';

interface VerificationMemoryViewProps {
  onBackToOverview: () => void;
  onOpenExplorer?: (workflowId?: string) => void;
  onOpenActionCenter?: (actionId?: string) => void;
  onOpenInvestigation?: (workflowTitle: string, blocker: string, workflowId?: string) => void;
  initialWorkflowId?: string;
}

export const VerificationMemoryView: React.FC<VerificationMemoryViewProps> = ({
  onBackToOverview,
  onOpenExplorer,
  onOpenActionCenter,
  onOpenInvestigation,
  initialWorkflowId
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'cockpit' | 'timeline' | 'memory'>('cockpit');

  // Data state
  const [verifications, setVerifications] = useState<WorkflowVerificationRecord[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    totalWorkflows: 0,
    verifiedComplete: 0,
    incompleteOrBlocked: 0,
    awaitingPrerequisites: 0,
    memoryRecordsIndexed: 0
  });
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(initialWorkflowId || 'wf-001');
  const [events, setEvents] = useState<VerificationEvent[]>([]);
  const [memories, setMemories] = useState<HistoricalMemoryRecord[]>([]);

  // Sync selectedWorkflowId when navigating from other modules
  const [prevInitialWorkflowId, setPrevInitialWorkflowId] = useState(initialWorkflowId);
  if (initialWorkflowId !== prevInitialWorkflowId) {
    setPrevInitialWorkflowId(initialWorkflowId);
    if (initialWorkflowId) {
      setSelectedWorkflowId(initialWorkflowId);
    }
  }

  // Loading & Action states
  const [_isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isRunningVerification, setIsRunningVerification] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [memorySearchQuery, setMemorySearchQuery] = useState<string>('');

  // Modals & Panels
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState<boolean>(false);
  const [selectedCheckForInspection, setSelectedCheckForInspection] = useState<VerificationCheck | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Manual refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Synchronize Verifications & Stats
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        const [verifRes, memRes] = await Promise.all([
          VerificationService.getVerifications({
            status: statusFilter,
            searchQuery: searchQuery.trim() || undefined
          }),
          VerificationService.getMemories(memorySearchQuery.trim() || undefined)
        ]);

        if (isCancelled) return;

        setVerifications(verifRes.verifications);
        setStats(verifRes.stats);
        setMemories(memRes.memories);

        if (verifRes.verifications.length > 0) {
          setSelectedWorkflowId((prev) =>
            prev && verifRes.verifications.some((v) => v.workflowId === prev)
              ? prev
              : verifRes.verifications[0].workflowId
          );
        }
      } catch (err: any) {
        console.error('Failed to load verification data:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [statusFilter, searchQuery, memorySearchQuery, refreshTrigger]);

  // Synchronize Details & Events for Selected Workflow
  useEffect(() => {
    let isCancelled = false;
    if (!selectedWorkflowId) return;

    const loadDetails = async () => {
      try {
        const res = await VerificationService.getVerificationDetails(selectedWorkflowId);
        if (isCancelled) return;
        setEvents(res.events);
      } catch (err: any) {
        console.error('Failed to load workflow verification details:', err);
      }
    };

    loadDetails();

    return () => {
      isCancelled = true;
    };
  }, [selectedWorkflowId, refreshTrigger]);

  // Selected Workflow Record
  const selectedWorkflow = useMemo(() => {
    return verifications.find((v) => v.workflowId === selectedWorkflowId) || verifications[0] || null;
  }, [verifications, selectedWorkflowId]);

  // Run Verification Action
  const handleExecuteVerification = async (scenario: VerificationScenario = 'DEFAULT') => {
    if (!selectedWorkflowId) return;
    setIsRunningVerification(true);
    setIsScenarioModalOpen(false);

    try {
      const res = await VerificationService.runVerification(selectedWorkflowId, scenario, {
        id: 'usr-104',
        name: 'David Chen',
        role: 'Engineering Director & Delegated Reviewer',
        email: 'david.chen@closureloop.io'
      });

      handleRefresh();

      if (res.newStatus === 'VERIFIED_COMPLETE') {
        setFeedbackNotice({
          type: 'success',
          message: `Business outcome verified complete! All mandatory criteria passed. Resolution archived to enterprise memory.`
        });
      } else if (res.newStatus === 'INCONCLUSIVE') {
        setFeedbackNotice({
          type: 'warning',
          message: `Verification inconclusive: ${res.verificationRecord.summary}`
        });
      } else if (res.newStatus === 'FAILED') {
        setFeedbackNotice({
          type: 'error',
          message: `Verification failed: A mandatory check was explicitly rejected.`
        });
      } else {
        setFeedbackNotice({
          type: 'info',
          message: `Verification evaluated: ${res.verificationRecord.summary}`
        });
      }

      setTimeout(() => setFeedbackNotice(null), 6000);
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        message: err.message || 'Verification check failed.'
      });
    } finally {
      setIsRunningVerification(false);
    }
  };

  // Reset Demo Repository State
  const handleResetBaseline = async () => {
    setIsRefreshing(true);
    await VerificationService.resetVerifications();
    handleRefresh();
    setFeedbackNotice({
      type: 'success',
      message: 'Verification & Memory baseline reset to initial clean state.'
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Status Badge Helper
  const getStatusBadge = (status: VerificationCheckStatus) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Passed</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'INCONCLUSIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            <span>Inconclusive</span>
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertTriangle className="w-3 h-3 text-slate-500" />
            <span>Unavailable</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
            <span>Not Evaluated</span>
          </span>
        );
    }
  };

  // Category Badge Helper
  const getCategoryBadge = (category: VerificationCategory) => {
    switch (category) {
      case 'IDENTITY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">Identity</span>;
      case 'MANAGEMENT':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">Management</span>;
      case 'SECURITY_APPROVAL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">Security Sign-off</span>;
      case 'INFRASTRUCTURE_ACCESS':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">Access Role</span>;
      case 'BUSINESS_OUTCOME':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">Business Outcome</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Navigation Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <button
              onClick={onBackToOverview}
              className="hover:underline text-slate-500 hover:text-slate-800 transition-colors"
            >
              ClosureLoop
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">Intelligence</span>
            <span className="text-slate-400">/</span>
            <span className="text-blue-600">Verification & Memory</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Verification & Memory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cryptographic Engine Active</span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
            Autonomous outcome verification engine. Action completion does <strong>not</strong> prove outcome completion — ClosureLoop verifies business results using trustworthy evidence and archives resolutions to long-term memory.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetBaseline}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Reset verification repository to baseline state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset State</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            title="Refresh verifications"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsScenarioModalOpen(true)}
            disabled={isRunningVerification}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunningVerification ? 'animate-pulse' : ''}`} />
            <span>{isRunningVerification ? 'Verifying...' : 'Run Verification Check'}</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Notice */}
      {feedbackNotice && (
        <div
          className={`px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 border shadow-xs transition-all ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedbackNotice.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : feedbackNotice.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedbackNotice.type === 'warning' ? (
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : feedbackNotice.type === 'info' ? (
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. Telemetry Metric Summary Cards (Adapted from shadcndashboard) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Verified Complete */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Verified Complete</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.verifiedComplete}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <span>Cryptographically certified</span>
          </p>
        </div>

        {/* Incomplete / Stalled */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Incomplete / Stalled</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.incompleteOrBlocked}
          </div>
          <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1 font-medium">
            <span>Unsatisfied criteria remaining</span>
          </p>
        </div>

        {/* Awaiting Prerequisites */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Awaiting Dispatch</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.awaitingPrerequisites}
          </div>
          <p className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
            <span>Pending Action Center steps</span>
          </p>
        </div>

        {/* Memory Records Indexed */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Enterprise Memories</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.memoryRecordsIndexed}
          </div>
          <p className="text-[11px] text-purple-600 mt-1 flex items-center gap-1 font-medium">
            <span>Long-term graph patterns</span>
          </p>
        </div>
      </div>

      {/* 3. Primary Module Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('cockpit')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'cockpit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Verification Cockpit</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {verifications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'timeline'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Chronological Audit History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'memory'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Enterprise Graph Memory</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {memories.length}
          </span>
        </button>
      </div>

      {/* 4. Tab 1: Verification Cockpit (Master-Detail Split Pane) */}
      {activeTab === 'cockpit' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left Column: Workflow Selector List (1/3 width) */}
          <div className="xl:col-span-1 space-y-3">
            {/* Filter toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All States</option>
                <option value="INCOMPLETE">Incomplete</option>
                <option value="VERIFIED_COMPLETE">Complete</option>
              </select>
            </div>

            {/* List of Workflows */}
            <div className="space-y-2">
              {verifications.map((item) => {
                const isSelected = item.workflowId === selectedWorkflowId;
                return (
                  <div
                    key={item.workflowId}
                    onClick={() => setSelectedWorkflowId(item.workflowId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/30 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">
                          {item.workflowId} · {item.department}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.workflowTitle}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          item.overallStatus === 'VERIFIED_COMPLETE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.overallStatus === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.overallStatus === 'VERIFIED_COMPLETE'
                          ? 'VERIFIED'
                          : item.overallStatus === 'FAILED'
                          ? 'FAILED'
                          : 'INCOMPLETE'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                      Target: <strong className="text-slate-700">{item.targetOutcome}</strong>
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{item.passedChecksCount} of {item.totalChecksCount} criteria</span>
                        <span className="font-bold">{item.completionPercentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            item.overallStatus === 'VERIFIED_COMPLETE'
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${item.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Verification Cockpit (2/3 width) */}
          {selectedWorkflow && (
            <div className="xl:col-span-2 space-y-4">
              {/* Target Business Outcome Card */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-slate-400">
                        {selectedWorkflow.workflowId}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {selectedWorkflow.department}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                      {selectedWorkflow.workflowTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleExecuteVerification('DEFAULT')}
                      disabled={isRunningVerification}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Run live criteria evaluation"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRunningVerification ? 'animate-spin text-blue-600' : ''}`} />
                      <span>Evaluate</span>
                    </button>

                    <button
                      onClick={() => setIsScenarioModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Scenarios</span>
                    </button>
                  </div>
                </div>

                {/* Core Principle Callout */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Target Business Outcome: </strong>
                    <span className="font-semibold text-blue-900">{selectedWorkflow.targetOutcome}</span>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {selectedWorkflow.summary}
                    </p>
                  </div>
                </div>

                {/* Cross-Module Linkages: Action Center & FalkorDB Graph */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Database className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-[11px] font-mono text-slate-500">
                      Verified By: <strong className="text-slate-700">{selectedWorkflow.verifiedBy}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedWorkflow.relatedActionId && onOpenActionCenter && (
                      <button
                        onClick={() => onOpenActionCenter(selectedWorkflow.relatedActionId)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 flex items-center gap-1 transition-colors"
                      >
                        <span>Action {selectedWorkflow.relatedActionId}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {onOpenExplorer && (
                      <button
                        onClick={() => onOpenExplorer(selectedWorkflow.workflowId)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 flex items-center gap-1 transition-colors"
                      >
                        <span>Inspect in Graph</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {selectedWorkflow.blockerContext && onOpenInvestigation && (
                      <button
                        onClick={() =>
                          onOpenInvestigation(
                            selectedWorkflow.workflowTitle,
                            selectedWorkflow.blockerContext!.blocker,
                            selectedWorkflow.workflowId
                          )
                        }
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-purple-700 hover:bg-purple-50 border border-purple-200 flex items-center gap-1 transition-colors"
                      >
                        <span>Investigation Room</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Blocker Context (If Incomplete) */}
              {selectedWorkflow.blockerContext && selectedWorkflow.overallStatus !== 'VERIFIED_COMPLETE' && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-rose-900">Unresolved Downstream Blocker:</span>
                      <span className="font-mono text-[10px] text-rose-700 font-semibold px-1.5 py-0.2 rounded bg-rose-100">
                        {selectedWorkflow.blockerContext.system}
                      </span>
                    </div>
                    <p className="text-slate-700">
                      {selectedWorkflow.blockerContext.blocker} — Responsible: <strong>{selectedWorkflow.blockerContext.responsibleParty}</strong> ({selectedWorkflow.blockerContext.responsibleRole}).
                    </p>
                    {selectedWorkflow.blockerContext.slaBreach && (
                      <p className="text-[11px] text-rose-700 font-semibold mt-1">
                        SLA Breach: {selectedWorkflow.blockerContext.slaBreach}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Criteria Checklist Table */}
              <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Outcome Verification Criteria Checklist
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedWorkflow.passedChecksCount} / {selectedWorkflow.totalChecksCount} Requirements Satisfied
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedWorkflow.checks.map((check) => (
                    <div
                      key={check.id}
                      onClick={() => setSelectedCheckForInspection(check)}
                      className="p-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(check.status)}
                            {getCategoryBadge(check.category)}
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">
                              {check.id}
                            </span>
                            {check.mandatory && (
                              <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1 rounded">
                                Mandatory
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {check.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              check.isLiveSource
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {check.isLiveSource ? 'Live Telemetry' : 'Demo Adapter'}
                          </span>
                        </div>
                      </div>

                      {/* Observed vs Expected */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Observed Telemetry
                          </span>
                          <span className="font-mono text-slate-800 break-all font-medium">
                            {check.observedValue}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Expected Condition
                          </span>
                          <span className="text-slate-700">
                            {check.expectedCondition}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-slate-400" />
                          <span>Source: <strong>{check.evidenceSource}</strong></span>
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center gap-1">
                          <span>Inspect Evidence Payload</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Chronological Audit History */}
      {activeTab === 'timeline' && (
        <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Chronological Audit History & Verification Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit ledger documenting investigations, action approvals, dispatch attempts, and cryptographic checks for {selectedWorkflow?.workflowTitle}.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              {events.length} Historical Events Persisted
            </span>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No historical events recorded for this workflow yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {events.map((evt) => {
                return (
                  <div key={evt.id} className="relative group">
                    {/* Circle Node on Timeline */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        evt.badgeVariant === 'success'
                          ? 'bg-emerald-500 ring-2 ring-emerald-100'
                          : evt.badgeVariant === 'danger'
                          ? 'bg-rose-500 ring-2 ring-rose-100'
                          : evt.badgeVariant === 'warning'
                          ? 'bg-amber-500 ring-2 ring-amber-100'
                          : evt.badgeVariant === 'info'
                          ? 'bg-blue-500 ring-2 ring-blue-100'
                          : 'bg-slate-400 ring-2 ring-slate-100'
                      }`}
                    />

                    <div className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-xs transition-all space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              evt.badgeVariant === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : evt.badgeVariant === 'danger'
                                ? 'bg-rose-100 text-rose-800'
                                : evt.badgeVariant === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {evt.type.replace(/_/g, ' ')}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">
                            {evt.title}
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                        <span className="flex items-center gap-1.5 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{evt.actor} {evt.actorRole ? `(${evt.actorRole})` : ''}</span>
                        </span>
                        {evt.evidenceRef && (
                          <span className="font-mono text-[10px] text-slate-400">
                            Ref: {evt.evidenceRef}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: Enterprise Graph Memory */}
      {activeTab === 'memory' && (
        <div className="space-y-4">
          {/* Search bar & Memory Explainer Banner */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    Long-Term Enterprise Graph Memory Index
                  </h3>
                </div>
                <p className="text-xs text-slate-500 max-w-3xl">
                  Historical pattern memory linking past incidents, bottleneck root causes, and verified resolutions to accelerate ongoing resolutions and prevent recurring deadlocks.
                </p>
              </div>

              <div className="relative w-full md:w-72 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search historical memory..."
                  value={memorySearchQuery}
                  onChange={(e) => setMemorySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Memories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        {mem.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mem.department}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {mem.incidentTitle}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Graph Pattern Signature */}
                <div className="p-2 rounded bg-slate-900 text-teal-300 text-[10px] font-mono overflow-x-auto">
                  <span className="text-slate-400 uppercase text-[9px] block mb-0.5 font-bold">
                    Graph Pattern Traversed:
                  </span>
                  <code>{mem.patternSignature}</code>
                </div>

                {/* Resolution Summary */}
                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <strong className="text-slate-800">Resolution Taken: </strong>
                    <span>{mem.resolutionTaken}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <strong>Time to Resolution: </strong>
                    <span className="font-mono text-slate-700">{mem.timeToResolution}</span>
                  </div>
                </div>

                {/* Key Learnings */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Key Enterprise Learnings:
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc pl-3.5">
                    {mem.keyLearnings.map((learning, idx) => (
                      <li key={idx}>{learning}</li>
                    ))}
                  </ul>
                </div>

                {/* Provenance Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  <span>Confidence: {(mem.confidenceScore * 100).toFixed(0)}%</span>
                  <span>Resolved: {new Date(mem.resolvedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Scenario Test Modal (Demonstrating Acceptance Cases 1 - 5) */}
      {isScenarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Automated Verification Engine
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Run Outcome Verification Check
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select an evaluation scenario to test criteria validation across live FalkorDB telemetry and required acceptance cases.
                </p>
              </div>
              <button
                onClick={() => setIsScenarioModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Live Default */}
              <div
                onClick={() => handleExecuteVerification('DEFAULT')}
                className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900">
                    Live Evaluation (Default)
                  </span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Evaluates against actual Action Center state. If action ACT-2026-0901 was dispatched, verifies whether downstream AWS IAM and code commit exist.
                </p>
              </div>

              {/* Option 2: CASE 1 — All Passed */}
              <div
                onClick={() => handleExecuteVerification('ALL_PASSED')}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    CASE 1: All Criteria Passed (Full Resolution)
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                    VERIFIED_COMPLETE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sarah Lin approves SEC-TKT-9912, AWS IAM role binds, and initial commit is verified via GitHub Enterprise webhook. Archives to memory!
                </p>
              </div>

              {/* Option 3: CASE 2 — Approval Without Access */}
              <div
                onClick={() => handleExecuteVerification('APPROVAL_WITHOUT_ACCESS')}
                className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    CASE 2: Approval Without Access
                  </span>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                    INCOMPLETE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ticket SEC-TKT-9912 is marked approved, but AWS IAM role is NOT provisioned. Proves that approval does not imply access!
                </p>
              </div>

              {/* Option 4: CASE 3 — Missing Evidence */}
              <div
                onClick={() => handleExecuteVerification('MISSING_EVIDENCE')}
                className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    CASE 3: Missing Evidence Artifact
                  </span>
                  <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                    INCOMPLETE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Mandatory manager orientation checklist has missing evidence. System rejects criteria without trustworthy artifact.
                </p>
              </div>

              {/* Option 5: CASE 4 — Failed Check */}
              <div
                onClick={() => handleExecuteVerification('FAILED_CHECK')}
                className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    CASE 4: Explicit Rejection
                  </span>
                  <span className="text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                    FAILED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sarah Lin explicitly rejects ticket SEC-TKT-9912 due to compliance gap. Workflow outcome marked FAILED.
                </p>
              </div>

              {/* Option 6: CASE 5 — Unavailable Integration */}
              <div
                onClick={() => handleExecuteVerification('UNAVAILABLE_INTEGRATION')}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    CASE 5: External API Unavailable
                  </span>
                  <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold">
                    INCONCLUSIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  GitHub Enterprise API connection times out. System reports check UNAVAILABLE rather than guessing.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsScenarioModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Evidence Inspection Drawer / Modal */}
      {selectedCheckForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(selectedCheckForInspection.status)}
                  {getCategoryBadge(selectedCheckForInspection.category)}
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {selectedCheckForInspection.name}
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Check ID: {selectedCheckForInspection.id} · Source: {selectedCheckForInspection.evidenceSource}
                </p>
              </div>
              <button
                onClick={() => setSelectedCheckForInspection(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Freshness: {selectedCheckForInspection.isStale ? 'STALE' : 'CURRENT'}</span>
                  <span>Confidence: {(selectedCheckForInspection.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Verified At: {new Date(selectedCheckForInspection.verifiedAt).toLocaleString()}
                </div>
                {selectedCheckForInspection.evidenceRecordId && (
                  <div className="text-[11px] font-mono text-slate-700">
                    Record ID: <strong className="text-slate-900">{selectedCheckForInspection.evidenceRecordId}</strong>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Observed Telemetry Payload
                </span>
                <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {selectedCheckForInspection.observedValue}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Target Verification Condition
                </span>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                  {selectedCheckForInspection.expectedCondition}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Verifier Analysis & Audit Trail
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded border border-slate-100">
                  {selectedCheckForInspection.evaluationDetails}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              {selectedCheckForInspection.externalLink ? (
                <a
                  href={selectedCheckForInspection.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Open in {selectedCheckForInspection.evidenceSource}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">No external link configured</span>
              )}

              <button
                onClick={() => setSelectedCheckForInspection(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
