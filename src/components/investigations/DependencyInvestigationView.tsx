import React, { useState, useMemo } from 'react';
import type { InvestigationCase, FindingCategory } from '../../types/investigation';
import { InvestigationService } from '../../services/investigationService';
import { mockInvestigationCases } from '../../data/mockInvestigations';
import { EmptyState } from '../ui/EmptyState';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Network,
  ArrowLeft,
  X,
  Copy,
  Check,
  Send,
  Database,
  ExternalLink,
  UserCheck,
  FileText,
  Radio,
  RefreshCw,
  ArrowRight,
  Info,
  Zap
} from 'lucide-react';

interface DependencyInvestigationViewProps {
  onBackToOverview: () => void;
  onJumpToGraph: () => void;
  onOpenExplorer: () => void;
  onOpenActionCenter?: (actionId?: string) => void;
  selectedWorkflowId?: string;
}

export const DependencyInvestigationView: React.FC<DependencyInvestigationViewProps> = ({
  onBackToOverview,
  onJumpToGraph,
  onOpenExplorer,
  onOpenActionCenter,
  selectedWorkflowId,
}) => {
  // Data state initialized directly from mock investigation adapter
  const [cases, setCases] = useState<InvestigationCase[]>(mockInvestigationCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    if (selectedWorkflowId) {
      const match = mockInvestigationCases.find((c) => c.workflowId === selectedWorkflowId);
      if (match) return match.id;
    }
    return 'INV-2026-8812';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // UI state
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState<'graph' | 'audit' | 'cypher' | 'telemetry'>('graph');
  const [findingCategoryFilter, setFindingCategoryFilter] = useState<'ALL' | FindingCategory>('ALL');
  const [isRetraversing, setIsRetraversing] = useState(false);

  // Sync selectedCaseId when navigating from other modules
  const [prevSelectedWorkflowId, setPrevSelectedWorkflowId] = useState(selectedWorkflowId);
  if (selectedWorkflowId !== prevSelectedWorkflowId) {
    setPrevSelectedWorkflowId(selectedWorkflowId);
    if (selectedWorkflowId) {
      const match = cases.find((c) => c.workflowId === selectedWorkflowId);
      if (match) {
        setSelectedCaseId(match.id);
      }
    }
  }
  const [copiedCypher, setCopiedCypher] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showFalkorPrereqsModal, setShowFalkorPrereqsModal] = useState(false);

  // Active investigation case
  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  // Purely derived selected step (no cascading useEffect setState)
  const selectedStep = useMemo(() => {
    if (!activeCase || activeCase.dependencyPath.length === 0) return null;
    if (selectedStepId) {
      const match = activeCase.dependencyPath.find((s) => s.id === selectedStepId);
      if (match) return match;
    }
    return activeCase.dependencyPath.find((s) => s.isBottleneck) || activeCase.dependencyPath[0];
  }, [activeCase, selectedStepId]);

  // Filtered case list for left sidebar
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.id.toLowerCase().includes(q) ||
          c.workflowTitle.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.identifiedBottleneck.name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'All' && c.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [cases, searchQuery, statusFilter]);

  // Filter findings in active case
  const filteredFindings = useMemo(() => {
    if (!activeCase) return [];
    if (findingCategoryFilter === 'ALL') return activeCase.findings;
    return activeCase.findings.filter((f) => f.category === findingCategoryFilter);
  }, [activeCase, findingCategoryFilter]);

  const handleCopyCypher = () => {
    if (!activeCase) return;
    navigator.clipboard.writeText(activeCase.falkorCypherQuery);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  const handleRetraverse = async () => {
    if (!activeCase) return;
    setIsRetraversing(true);
    try {
      const updated = await InvestigationService.rerunInvestigation(activeCase.id);
      if (updated) {
        setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setActionNotice('Multi-hop graph traversal refreshed. 0 state change in target dependencies.');
        setTimeout(() => setActionNotice(null), 3000);
      }
    } finally {
      setIsRetraversing(false);
    }
  };

  const handleDispatchNudge = (ownerName: string, channel: string) => {
    setActionNotice(`Nudge dispatched to ${ownerName} via ${channel}. SLA notification logged in audit vault.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleEscalateDeputy = (deputyName: string) => {
    setActionNotice(`Escalation rule SEC-ESC-03 executed. Temporary delegation routed to ${deputyName}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none font-sans text-slate-900">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <button
            onClick={onBackToOverview}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-1.5 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Dependency Investigation
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 font-semibold flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
              Module 3 Active
            </span>
            <button
              onClick={() => setShowFalkorPrereqsModal(true)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              title="Click to view FalkorDB connection status"
            >
              <Database className="w-2.5 h-2.5 text-teal-600" />
              <span>Demo Graph Traversal · FalkorDB Client Not Connected</span>
              <Info className="w-2.5 h-2.5 text-slate-400" />
            </button>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Establish why enterprise workflows remain incomplete by tracing unresolved dependencies, responsible approvers, and outcome verification gaps.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onOpenExplorer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Graph Explorer</span>
          </button>

          <button
            onClick={handleRetraverse}
            disabled={isRetraversing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRetraversing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRetraversing ? 'Traversing Graph...' : 'Re-traverse Graph'}</span>
          </button>

          <button
            onClick={handleCopyCypher}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            {copiedCypher ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCypher ? 'Copied Cypher' : 'Copy Cypher Query'}</span>
          </button>
        </div>
      </div>

      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Investigation Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Investigation Case Selector (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                Active Investigations
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {filteredCases.length} records
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blocked cases..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
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

            {/* Status Tabs */}
            <div className="flex items-center gap-1 text-[11px] font-medium border-b border-slate-100 pb-2">
              {['All', 'ROOT_CAUSE_CONFIRMED', 'HYPOTHESIS_PENDING'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {st === 'All' ? 'All Cases' : st === 'ROOT_CAUSE_CONFIRMED' ? 'Confirmed' : 'Pending'}
                </button>
              ))}
            </div>

            {/* Case List Cards */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-0.5">
              {filteredCases.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No investigations match your query.
                </div>
              ) : (
                filteredCases.map((c) => {
                  const isSelected = c.id === selectedCaseId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setSelectedStepId(null);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-500/15 shadow-xs'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-semibold text-slate-500">
                          {c.id}
                        </span>
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            c.status === 'ROOT_CAUSE_CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {c.status === 'ROOT_CAUSE_CONFIRMED' ? 'Root Cause Found' : 'Hypothesis Pending'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {c.workflowTitle}
                      </h4>

                      <div className="mt-2 p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 font-medium">{c.identifiedBottleneck.name}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{c.department}</span>
                        <span className="font-mono text-amber-700 font-semibold">
                          Stalled: {c.identifiedBottleneck.durationStalled}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Deep-Dive & Root-Cause Room (8 cols on lg) */}
        {activeCase ? (
          <div className="lg:col-span-8 space-y-5">
            {/* 1. Core Explanation of Unmet Business Outcome (Core Hackathon Principle) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-rose-950 via-[#0d1424] to-[#090d16] text-white">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-300">
                      Unverified Business Outcome Detected
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Workflow Reference: {activeCase.workflowId}
                  </span>
                </div>
                <h2 className="text-base md:text-lg font-bold tracking-tight text-white leading-snug">
                  {activeCase.unmetBusinessOutcome}
                </h2>
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 italic flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{activeCase.outcomeVerificationRule}</span>
                </div>
              </div>

              {/* Status Comparison Table: Tasks Complete vs Outcome Blocked */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Preconditions (Complete)
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Workday Employee Record (#EMP-77129) active</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Okta IT Account provisioned & SSO identity active</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Manager (David Chen) onboarding checklist signed</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 bg-white rounded-lg border border-amber-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Unmet Business Conditions (Blocked)
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-700">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <strong className="text-slate-900">Application Access:</strong> Production IAM entitlement pending
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <strong className="text-slate-900">Security Approval:</strong> Ticket SEC-TKT-9912 unresolved
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <strong className="text-slate-900">Outcome Verification:</strong> Zero verified CLI commits
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2. Responsible Owner & Bottleneck Entity Callout */}
            {activeCase.responsibleOwner && (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {activeCase.responsibleOwner.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">
                        {activeCase.responsibleOwner.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        Authorized Bottleneck Owner
                      </span>
                      {activeCase.responsibleOwner.queueCount && (
                        <span className="text-[10px] font-mono text-slate-500">
                          ({activeCase.responsibleOwner.queueCount} items in queue)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {activeCase.responsibleOwner.role}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span>Email: <strong className="text-slate-700">{activeCase.responsibleOwner.email}</strong></span>
                      {activeCase.responsibleOwner.slack && (
                        <span>Slack: <strong className="text-slate-700">{activeCase.responsibleOwner.slack}</strong></span>
                      )}
                      {activeCase.responsibleOwner.authorizationPolicy && (
                        <span>Policy: <strong className="text-slate-700">{activeCase.responsibleOwner.authorizationPolicy}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Remediation Nudges */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {onOpenActionCenter && (
                    <button
                      onClick={() => onOpenActionCenter('ACT-2026-0901')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                      title="Review proposed resolution in Action Center"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Review in Action Center</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDispatchNudge(activeCase.responsibleOwner!.name, 'Slack (@slin)')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-500" />
                    <span>Nudge via Slack</span>
                  </button>

                  {activeCase.responsibleOwner.backupDelegation && (
                    <button
                      onClick={() => handleEscalateDeputy('Mark Vance (Deputy Security Lead)')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                      title="Route to secondary approver under SEC-ESC-03"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Route to Deputy</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. Interactive Multi-Hop Dependency Path Visualizer */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                    <Network className="w-3.5 h-3.5 text-blue-600" />
                    Multi-Hop Dependency Path to Target Outcome
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click any node along the traversal chain to inspect its properties and graph relationships.
                  </p>
                </div>
                {activeCase.workflowId === 'wf-001' && (
                  <button
                    onClick={onJumpToGraph}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    <span>Highlight in Canvas Hero</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Stepper Chain */}
              <div className="overflow-x-auto pb-2 pt-1">
                <div className="flex items-center gap-2 min-w-[700px]">
                  {activeCase.dependencyPath.map((step, idx) => {
                    const isSelected = selectedStep?.id === step.id;
                    const isLast = idx === activeCase.dependencyPath.length - 1;

                    return (
                      <React.Fragment key={step.id}>
                        <div
                          onClick={() => setSelectedStepId(step.id)}
                          className={`flex-1 p-2.5 rounded-lg border transition-all cursor-pointer relative min-w-[120px] ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                              : step.isBottleneck
                              ? 'border-amber-400 bg-amber-50/40 hover:bg-amber-50'
                              : step.status === 'COMPLETED'
                              ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-mono text-slate-400 font-bold">
                              #{step.order}
                            </span>
                            {step.status === 'COMPLETED' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : step.isBottleneck ? (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            ) : (
                              <Clock className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-slate-900 truncate">
                            {step.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {step.systemOrRole}
                          </div>
                          {step.isBottleneck && (
                            <span className="mt-1 block text-[8px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-1 rounded text-center">
                              Critical Blocker
                            </span>
                          )}
                        </div>

                        {!isLast && (
                          <div className="text-slate-300 font-mono text-xs flex flex-col items-center shrink-0">
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[8px] text-slate-400 font-sans uppercase">
                              {step.relationshipToNext || 'feeds'}
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Selected Step Inspector Box */}
              {selectedStep && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        Step #{selectedStep.order}: {selectedStep.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold">
                        {selectedStep.entityType}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        System: <strong>{selectedStep.systemOrRole}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {selectedStep.details || 'Graph entity properties confirmed in active traversal.'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded shrink-0 ${
                      selectedStep.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : selectedStep.isBottleneck
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {selectedStep.status}
                  </span>
                </div>
              )}
            </div>

            {/* 4. Three-Way Classification: Confirmed Findings, Hypotheses, and Unavailable Info */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Investigation Findings & Hypotheses Classification
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Clear epistemic boundary separating proven graph facts from probabilistic hypotheses and external data gaps.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-[10px] font-medium">
                  <button
                    onClick={() => setFindingCategoryFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      findingCategoryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All ({activeCase.findings.length})
                  </button>
                  <button
                    onClick={() => setFindingCategoryFilter('CONFIRMED_FINDING')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      findingCategoryFilter === 'CONFIRMED_FINDING' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() => setFindingCategoryFilter('HYPOTHESIS')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      findingCategoryFilter === 'HYPOTHESIS' ? 'bg-white text-indigo-800 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Hypotheses
                  </button>
                  <button
                    onClick={() => setFindingCategoryFilter('UNAVAILABLE_DATA')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      findingCategoryFilter === 'UNAVAILABLE_DATA' ? 'bg-white text-amber-800 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Gaps
                  </button>
                </div>
              </div>

              {/* Findings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      finding.category === 'CONFIRMED_FINDING'
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : finding.category === 'HYPOTHESIS'
                        ? 'bg-indigo-50/30 border-indigo-200'
                        : 'bg-amber-50/30 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                          finding.category === 'CONFIRMED_FINDING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : finding.category === 'HYPOTHESIS'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {finding.category === 'CONFIRMED_FINDING'
                          ? 'Proven Finding'
                          : finding.category === 'HYPOTHESIS'
                          ? 'Hypothesis'
                          : 'Unavailable Data Gap'}
                      </span>
                      {finding.confidence && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {Math.round(finding.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 text-xs">
                      {finding.title}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {finding.description}
                    </p>
                    {finding.evidenceRef && (
                      <div className="text-[9px] font-mono text-slate-400 pt-0.5">
                        Ref: {finding.evidenceRef}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Evidence Vault Panel & OpenCypher Query Console */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              {/* Evidence Sub-Tabs */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900 tracking-tight uppercase">
                    Evidence Vault & Relationship Logs
                  </span>
                </div>

                <div className="flex items-center bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setActiveEvidenceTab('graph')}
                    className={`px-2.5 py-1 rounded-md transition-colors text-[11px] ${
                      activeEvidenceTab === 'graph' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Graph Edges ({activeCase.evidence.filter((e) => e.type === 'GRAPH_EDGE').length})
                  </button>
                  <button
                    onClick={() => setActiveEvidenceTab('audit')}
                    className={`px-2.5 py-1 rounded-md transition-colors text-[11px] ${
                      activeEvidenceTab === 'audit' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Audit Records ({activeCase.evidence.filter((e) => e.type === 'AUDIT_LOG' || e.type === 'POLICY_RULE').length})
                  </button>
                  <button
                    onClick={() => setActiveEvidenceTab('cypher')}
                    className={`px-2.5 py-1 rounded-md transition-colors text-[11px] ${
                      activeEvidenceTab === 'cypher' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    OpenCypher Query
                  </button>
                  <button
                    onClick={() => setActiveEvidenceTab('telemetry')}
                    className={`px-2.5 py-1 rounded-md transition-colors text-[11px] ${
                      activeEvidenceTab === 'telemetry' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Verification Telemetry
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-4 text-xs">
                {/* Graph Edges Tab */}
                {activeEvidenceTab === 'graph' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 mb-2">
                      FalkorDB verified edges discovered during traversal from <code>{activeCase.workflowId}</code>:
                    </p>
                    <div className="space-y-2">
                      {activeCase.evidence
                        .filter((e) => e.type === 'GRAPH_EDGE')
                        .map((edge) => (
                          <div
                            key={edge.id}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="font-mono text-[11px] text-teal-800 font-semibold">
                                {edge.cypherRelationship}
                              </div>
                              <p className="text-[11px] text-slate-600">{edge.summary}</p>
                            </div>
                            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Verified Edge
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Audit Records Tab */}
                {activeEvidenceTab === 'audit' && (
                  <div className="space-y-2">
                    {activeCase.evidence
                      .filter((e) => e.type === 'AUDIT_LOG' || e.type === 'POLICY_RULE')
                      .map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-slate-700">{log.sourceSystem}</span>
                            <span>{new Date(log.timestamp).toUTCString()}</span>
                          </div>
                          <p className="text-slate-800 font-medium text-[11px]">{log.summary}</p>
                          {log.rawMetadata && (
                            <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center gap-3 text-[10px] font-mono text-slate-500 flex-wrap">
                              {Object.entries(log.rawMetadata).map(([k, v]) => (
                                <span key={k}>
                                  {k}: <strong className="text-slate-700">{String(v)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* OpenCypher Console Tab */}
                {activeEvidenceTab === 'cypher' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Executable FalkorDB query for reproducing this multi-hop bottleneck:
                      </span>
                      <button
                        onClick={handleCopyCypher}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {copiedCypher ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCypher ? 'Copied' : 'Copy Query'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#090d16] text-teal-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                      {activeCase.falkorCypherQuery}
                    </pre>
                    <p className="text-[10px] text-slate-400 italic">
                      Traverses intermediate tasks and checks whether verified outcome records match true state.
                    </p>
                  </div>
                )}

                {/* Telemetry Probe Tab */}
                {activeEvidenceTab === 'telemetry' && (
                  <div className="space-y-2">
                    {activeCase.evidence
                      .filter((e) => e.type === 'TELEMETRY_PROBE')
                      .map((probe) => (
                        <div
                          key={probe.id}
                          className="p-3 rounded-lg bg-rose-50/50 border border-rose-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-rose-800 uppercase font-mono">
                              Verification Probe: {probe.sourceSystem}
                            </span>
                            <span className="font-mono text-slate-400">
                              {new Date(probe.timestamp).toUTCString()}
                            </span>
                          </div>
                          <p className="text-slate-800 text-[11px] leading-snug">
                            {probe.summary}
                          </p>
                          {probe.rawMetadata && (
                            <div className="p-2 rounded bg-white border border-rose-200 text-[10px] font-mono text-rose-900 space-y-0.5">
                              {Object.entries(probe.rawMetadata).map(([k, v]) => (
                                <div key={k}>
                                  {k}: <strong>{String(v)}</strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
            <EmptyState
              title="No investigation selected"
              description="Select an investigation from the left sidebar or create a new investigation."
              onReset={() => setSearchQuery('')}
            />
          </div>
        )}
      </div>

      {/* FalkorDB Infrastructure Readiness Modal */}
      {showFalkorPrereqsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none"
          onClick={() => setShowFalkorPrereqsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#090d16] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  FalkorDB Connection & Readiness Status
                </h3>
              </div>
              <button
                onClick={() => setShowFalkorPrereqsModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-600">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Client-Side Demo Adapter Active</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  The application is currently running in isolated frontend mode. No direct FalkorDB socket credentials exist in the client browser, preserving enterprise security.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1.5">
                  Requirements Before Live Graph Queries Can Run:
                </h4>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-700">
                  {InvestigationService.getMissingPrerequisites().map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                <span className="font-semibold text-slate-800">
                  Quick Start Command to launch FalkorDB:
                </span>
                <pre className="p-2 rounded bg-slate-900 text-teal-300 font-mono text-[10px] overflow-x-auto">
                  docker run -p 6379:6379 -it --rm falkordb/falkordb
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowFalkorPrereqsModal(false)}
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
