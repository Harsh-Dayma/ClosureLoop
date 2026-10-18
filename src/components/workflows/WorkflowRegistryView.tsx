import React, { useState, useMemo } from 'react';
import type { WorkflowItem } from '../../types/workflow';
import { sampleWorkflows } from '../../data/mockWorkflows';
import type { WorkflowFilters } from '../../services/workflowService';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/EmptyState';
import {
  Search,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Network,
  X,
  Download,
  Check,
  Plus,
  ArrowUpDown,
  Clock,
  ShieldCheck,
  ArrowLeft,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

interface WorkflowRegistryViewProps {
  onBackToOverview: () => void;
  onSelectWorkflow: (workflow: WorkflowItem) => void;
  onInvestigateWorkflow: (workflowTitle: string, blocker: string, workflowId?: string) => void;
  onJumpToGraph: () => void;
  onOpenInvestigation: () => void;
  initialStatusFilter?: string;
}

export const WorkflowRegistryView: React.FC<WorkflowRegistryViewProps> = ({
  onBackToOverview,
  onSelectWorkflow,
  onInvestigateWorkflow,
  onJumpToGraph,
  onOpenInvestigation,
  initialStatusFilter,
}) => {
  // All workflows dataset state (initialized from mock data, supports registering new workflows)
  const [allWorkflows, setAllWorkflows] = useState<WorkflowItem[]>(sampleWorkflows);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter || 'All');
  const [selectedTeam, setSelectedTeam] = useState<string>('All Teams');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [selectedSystem, setSelectedSystem] = useState<string>('All Systems');
  const [sortBy, setSortBy] = useState<WorkflowFilters['sortBy']>('daysStalled');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View mode: Table vs Grid/Cards
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [exportSuccess, setExportSuccess] = useState(false);

  // New Workflow Registration Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTeam, setNewTeam] = useState('Engineering');
  const [newOwner, setNewOwner] = useState('Alex Morgan');
  const [newOutcome, setNewOutcome] = useState('');
  const [newBlocker, setNewBlocker] = useState('');
  const [newUrgency, setNewUrgency] = useState<'high' | 'medium' | 'low'>('medium');

  // Derive unique departments
  const departments = useMemo(() => {
    const teams = new Set(allWorkflows.map((w) => w.team));
    return ['All Teams', ...Array.from(teams).sort()];
  }, [allWorkflows]);

  // Derive unique systems
  const availableSystems = useMemo(() => {
    const sysSet = new Set<string>();
    allWorkflows.forEach((w) => {
      w.systems?.forEach((s) => sysSet.add(s));
    });
    return ['All Systems', ...Array.from(sysSet).sort()];
  }, [allWorkflows]);

  // Derive summary metrics
  const stats = useMemo(() => {
    const total = allWorkflows.length;
    const blocked = allWorkflows.filter((w) => w.status === 'Blocked').length;
    const pending = allWorkflows.filter((w) => w.status === 'Pending').length;
    const inProgress = allWorkflows.filter((w) => w.status === 'In Progress').length;
    const overdue = allWorkflows.filter((w) => w.status === 'Overdue').length;
    const verified = allWorkflows.filter((w) => w.status === 'Verified').length;

    return { total, blocked, pending, inProgress, overdue, verified };
  }, [allWorkflows]);

  // Derive filtered and sorted workflows
  const filteredWorkflows = useMemo(() => {
    return allWorkflows
      .filter((w) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matches =
            w.title.toLowerCase().includes(q) ||
            w.team.toLowerCase().includes(q) ||
            w.blocker.toLowerCase().includes(q) ||
            w.owner.toLowerCase().includes(q) ||
            w.unresolvedEntity.toLowerCase().includes(q) ||
            w.verificationGoal.toLowerCase().includes(q) ||
            (w.description && w.description.toLowerCase().includes(q));
          if (!matches) return false;
        }

        if (selectedStatus !== 'All' && w.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }

        if (selectedTeam !== 'All Teams' && w.team.toLowerCase() !== selectedTeam.toLowerCase()) {
          return false;
        }

        if (selectedUrgency !== 'All' && w.urgency.toLowerCase() !== selectedUrgency.toLowerCase()) {
          return false;
        }

        if (selectedSystem !== 'All Systems') {
          if (!w.systems || !w.systems.includes(selectedSystem)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const order = sortOrder === 'desc' ? -1 : 1;
        switch (sortBy) {
          case 'daysStalled':
            return (a.daysStalled - b.daysStalled) * order;
          case 'updatedAt': {
            const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return (timeA - timeB) * order;
          }
          case 'title':
            return a.title.localeCompare(b.title) * order;
          case 'urgency': {
            const urgencyWeight = { high: 3, medium: 2, low: 1 };
            return (urgencyWeight[a.urgency] - urgencyWeight[b.urgency]) * order;
          }
          case 'status':
            return a.status.localeCompare(b.status) * order;
          case 'completionPercentage':
            return ((a.completionPercentage || 0) - (b.completionPercentage || 0)) * order;
          default:
            return 0;
        }
      });
  }, [allWorkflows, searchQuery, selectedStatus, selectedTeam, selectedUrgency, selectedSystem, sortBy, sortOrder]);

  // Tab counts calculation
  const statusTabs = useMemo(() => {
    return [
      { id: 'All', label: 'All Workflows', count: stats.total },
      { id: 'Blocked', label: 'Blocked', count: stats.blocked },
      { id: 'Pending', label: 'Pending', count: stats.pending },
      { id: 'In Progress', label: 'In Progress', count: stats.inProgress },
      { id: 'Overdue', label: 'Overdue', count: stats.overdue },
      { id: 'Verified', label: 'Verified', count: stats.verified },
    ];
  }, [stats]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedTeam('All Teams');
    setSelectedUrgency('All');
    setSelectedSystem('All Systems');
    setSortBy('daysStalled');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'All' ||
    selectedTeam !== 'All Teams' ||
    selectedUrgency !== 'All' ||
    selectedSystem !== 'All Systems';

  const handleExportCsv = () => {
    const headers = [
      'ID,Title,Department,Status,Urgency,Owner,OwnerRole,DaysStalled,OutstandingBlocker,RequiredBusinessOutcome,CreatedAt,UpdatedAt,Systems'
    ];
    const rows = filteredWorkflows.map((w) =>
      `"${w.id}","${w.title.replace(/"/g, '""')}","${w.team}","${w.status}","${w.urgency}","${w.owner}","${w.ownerRole || ''}","${w.daysStalled}","${w.blocker.replace(/"/g, '""')}","${w.verificationGoal.replace(/"/g, '""')}","${w.createdAt || ''}","${w.updatedAt || ''}","${(w.systems || []).join('; ')}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `closureloop_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRecord: WorkflowItem = {
      id: `wf-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      description: `Registered workflow in ${newTeam} catalog.`,
      team: newTeam,
      blocker: newBlocker.trim() || 'None — Initial registration, awaiting verification handshake',
      status: newBlocker.trim() ? 'Blocked' : 'In Progress',
      urgency: newUrgency,
      owner: newOwner.trim() || 'Alex Morgan',
      ownerEmail: `${newOwner.toLowerCase().replace(/\s+/g, '.')}@company.io`,
      ownerRole: `${newTeam} Lead`,
      daysStalled: newBlocker.trim() ? 1 : 0,
      unresolvedEntity: newBlocker.trim() || 'Awaiting initial graph discovery',
      verificationGoal: newOutcome.trim() || 'Target business outcome verification telemetry confirmed',
      createdAt: '2026-10-18T03:00:00Z',
      updatedAt: '2026-10-18T03:00:00Z',
      systems: ['Workday', 'Jira', 'FalkorDB Context'],
      completionPercentage: 25,
      slaHoursRemaining: 48,
    };

    setAllWorkflows((prev) => [newRecord, ...prev]);
    setIsRegisterModalOpen(false);
    setNewTitle('');
    setNewOutcome('');
    setNewBlocker('');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 select-none font-sans">
      {/* Top Navigation & Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <button
            onClick={onBackToOverview}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-2 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Overview Dashboard</span>
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Workflow Registry
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Module 2 Active
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Mock Data · FalkorDB Architecture Ready
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Enterprise catalog of cross-system business workflows, dependency prerequisites, and cryptographic verification outcomes.
          </p>
        </div>

        {/* Top Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Dispatch Investigation Button */}
          <button
            onClick={onOpenInvestigation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            title="Dispatch investigation across dependencies"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Investigate</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Action */}
          <button
            onClick={handleExportCsv}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              exportSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs'
            }`}
            title="Export filtered registry to CSV"
          >
            {exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exported CSV</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </>
            )}
          </button>

          {/* Register Workflow Button */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register workflow</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon (Tremor Planner Segmented Progress Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Registered */}
        <div
          onClick={() => setSelectedStatus('All')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs hover:border-slate-300 ${
            selectedStatus === 'All'
              ? 'border-blue-600 ring-2 ring-blue-500/15'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Workflows</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border bg-slate-100 text-slate-700 border-slate-200">
              Across 8 teams
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {stats.total}
            </span>
            <span className="text-xs text-slate-400">100% indexed</span>
          </div>
          {/* Segmented bar */}
          <div className="mt-3 flex items-center gap-[3px] w-full" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, idx) => (
              <div
                key={idx}
                className="h-2.5 flex-1 rounded-[1.5px] bg-blue-500 transition-colors"
              />
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>All enterprise domains</span>
            <span className="text-blue-600 font-medium">View all</span>
          </div>
        </div>

        {/* Blocked on Prerequisites */}
        <div
          onClick={() => setSelectedStatus('Blocked')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs hover:border-slate-300 ${
            selectedStatus === 'Blocked'
              ? 'border-amber-600 ring-2 ring-amber-500/15'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Blocked on Prerequisites</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border bg-amber-50 text-amber-800 border-amber-200/80">
              Critical Paths
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {stats.blocked}
            </span>
            <span className="text-xs text-amber-600 font-medium">Stalled approvals</span>
          </div>
          {/* Segmented bar */}
          <div className="mt-3 flex items-center gap-[3px] w-full" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, idx) => {
              const isFilled = idx < Math.round((stats.blocked / Math.max(stats.total, 1)) * 20);
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-[1.5px] transition-colors ${
                    isFilled ? 'bg-amber-500' : 'bg-slate-100'
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Requires owner sign-off</span>
            <span className="text-amber-600 font-medium">Filter blocked</span>
          </div>
        </div>

        {/* Awaiting Verification */}
        <div
          onClick={() => setSelectedStatus('Pending')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs hover:border-slate-300 ${
            selectedStatus === 'Pending'
              ? 'border-indigo-600 ring-2 ring-indigo-500/15'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Awaiting Verification</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border bg-indigo-50 text-indigo-800 border-indigo-200/80">
              Audit Pending
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {stats.pending}
            </span>
            <span className="text-xs text-indigo-600 font-medium">Evidence needed</span>
          </div>
          {/* Segmented bar */}
          <div className="mt-3 flex items-center gap-[3px] w-full" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, idx) => {
              const isFilled = idx < Math.round((stats.pending / Math.max(stats.total, 1)) * 20);
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-[1.5px] transition-colors ${
                    isFilled ? 'bg-indigo-500' : 'bg-slate-100'
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>FinOps & compliance gates</span>
            <span className="text-indigo-600 font-medium">Filter pending</span>
          </div>
        </div>

        {/* Cryptographically Verified */}
        <div
          onClick={() => setSelectedStatus('Verified')}
          className={`p-4 rounded-xl bg-white border transition-all cursor-pointer shadow-xs hover:border-slate-300 ${
            selectedStatus === 'Verified'
              ? 'border-emerald-600 ring-2 ring-emerald-500/15'
              : 'border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Verified Outcomes</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200/80">
              100% Proven
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {stats.verified}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Ledger certified</span>
          </div>
          {/* Segmented bar */}
          <div className="mt-3 flex items-center gap-[3px] w-full" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, idx) => {
              const isFilled = idx < Math.round((stats.verified / Math.max(stats.total, 1)) * 20);
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 rounded-[1.5px] transition-colors ${
                    isFilled ? 'bg-emerald-500' : 'bg-slate-100'
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>FalkorDB audit memory locked</span>
            <span className="text-emerald-600 font-medium">Filter verified</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 space-y-4">
        {/* Top Control Bar: Search & Select Dropdowns */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, outcome goal, owner, blocker, or system..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Department */}
            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div className="relative">
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="All">All Urgencies</option>
                <option value="high">High Urgency</option>
                <option value="medium">Medium Urgency</option>
                <option value="low">Low Urgency</option>
              </select>
            </div>

            {/* Systems */}
            <div className="relative">
              <select
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                {availableSystems.map((sys) => (
                  <option key={sys} value={sys}>
                    {sys}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as WorkflowFilters['sortBy'])}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
              >
                <option value="daysStalled">Sort: Stalled Days</option>
                <option value="updatedAt">Sort: Recently Updated</option>
                <option value="title">Sort: Title (A-Z)</option>
                <option value="urgency">Sort: Urgency</option>
                <option value="status">Sort: Status</option>
                <option value="completionPercentage">Sort: Completion %</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="ml-1 p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs (Tremor Planner Segmented Pill Control) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/60 overflow-x-auto max-w-full">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus.toLowerCase() === tab.id.toLowerCase();
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-white text-slate-950 font-semibold shadow-xs border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-slate-100 text-slate-800 font-bold' : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 shrink-0">
            Showing <strong className="text-slate-700">{filteredWorkflows.length}</strong> of {stats.total} registered workflows
          </div>
        </div>
      </div>

      {/* Main Content: Table or Card Grid View */}
      {filteredWorkflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <EmptyState
            title="No workflows match your criteria"
            description="Try adjusting your search terms, changing the department filter, or resetting all filters."
            onReset={handleResetFilters}
          />
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Workflow & Connected Systems</th>
                  <th className="py-3 px-3">Department & Owner</th>
                  <th className="py-3 px-3">Status & Urgency</th>
                  <th className="py-3 px-3">Required Business Outcome</th>
                  <th className="py-3 px-3">Outstanding Prerequisite / Blocker</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredWorkflows.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectWorkflow(item)}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  >
                    {/* Workflow Title, Description & Systems */}
                    <td className="py-3.5 px-5 max-w-sm">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors block text-xs">
                            {item.title}
                          </span>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-snug">
                              {item.description}
                            </p>
                          )}
                          {/* Connected Systems Badges */}
                          {item.systems && item.systems.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {item.systems.map((sys) => (
                                <span
                                  key={sys}
                                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                                >
                                  {sys}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Department & Owner */}
                    <td className="py-3.5 px-3">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded mb-1">
                          {item.team}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-semibold text-[9px] flex items-center justify-center shrink-0">
                            {item.owner.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <span className="text-slate-800 font-medium truncate block text-[11px]">
                              {item.owner}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status & Urgency */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <StatusBadge status={item.status} size="sm" />
                        <span
                          className={`inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                            item.urgency === 'high'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.urgency === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {item.urgency} urgency
                        </span>
                      </div>
                    </td>

                    {/* Required Business Outcome */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="flex items-start gap-1.5 text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="line-clamp-2 leading-relaxed text-[11px] text-slate-700">
                            {item.verificationGoal}
                          </span>
                          {item.completionPercentage !== undefined && (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    item.status === 'Verified'
                                      ? 'bg-emerald-500'
                                      : item.status === 'Blocked'
                                      ? 'bg-amber-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${item.completionPercentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.completionPercentage}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Outstanding Prerequisite / Blocker */}
                    <td className="py-3.5 px-3 max-w-xs">
                      <div className="flex items-start gap-1.5 text-slate-700">
                        {item.status === 'Blocked' || item.status === 'Overdue' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        ) : item.status === 'Verified' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="line-clamp-2 leading-relaxed text-[11px]">
                            {item.blocker}
                          </span>
                          {item.daysStalled > 0 && (
                            <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                              Stalled {item.daysStalled} {item.daysStalled === 1 ? 'day' : 'days'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="text-[11px] text-slate-700 font-medium">
                        {formatDate(item.createdAt)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        SLA: {item.slaHoursRemaining !== undefined ? (item.slaHoursRemaining < 0 ? `${Math.abs(item.slaHoursRemaining)}h overdue` : `${item.slaHoursRemaining}h remaining`) : 'Normal'}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-5 text-right">
                      <div
                        className="inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.relatedGraphId && (
                          <button
                            onClick={onJumpToGraph}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View in Dependency Graph"
                          >
                            <Network className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onInvestigateWorkflow(item.title, item.blocker, item.id)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Investigate</span>
                        </button>

                        <button
                          onClick={() => onSelectWorkflow(item)}
                          className="p-1 text-slate-400 group-hover:text-slate-700 transition-colors"
                          title="View workflow details"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards / Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectWorkflow(item)}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header: Team & Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                    {item.team}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Blocker Callout */}
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[11px]">
                  <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-0.5">
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Prerequisite / Blocker</span>
                  </div>
                  <p className="text-slate-700 leading-snug line-clamp-2">
                    {item.blocker}
                  </p>
                </div>

                {/* Verification Outcome */}
                <div className="mt-2.5 p-2.5 rounded-lg bg-teal-50/50 border border-teal-200/60 text-[11px]">
                  <div className="flex items-center gap-1.5 text-teal-800 font-semibold mb-0.5">
                    <ShieldCheck className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>Required Business Outcome</span>
                  </div>
                  <p className="text-slate-700 leading-snug line-clamp-2">
                    {item.verificationGoal}
                  </p>
                </div>

                {/* Systems */}
                {item.systems && item.systems.length > 0 && (
                  <div className="mt-3 flex items-center gap-1 flex-wrap">
                    {item.systems.map((sys) => (
                      <span
                        key={sys}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        {sys}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-semibold text-[9px] flex items-center justify-center">
                    {item.owner.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 truncate max-w-[100px]">
                    {item.owner}
                  </span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onInvestigateWorkflow(item.title, item.blocker, item.id)}
                    className="px-2 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Investigate</span>
                  </button>
                  <button
                    onClick={() => onSelectWorkflow(item)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fast Registration Modal */}
      {isRegisterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none"
          onClick={() => setIsRegisterModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-[#090d16] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Register New Enterprise Workflow
                </h3>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Annual SOC-2 Certificate Audit Stamping"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="HR Operations">HR Operations</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Customer Success">Customer Success</option>
                    <option value="Finance">Finance</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Security & Compliance">Security & Compliance</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Urgency
                  </label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Responsible Owner
                </label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g., Alex Morgan"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Required Business Outcome Criteria *
                </label>
                <input
                  type="text"
                  required
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="e.g., Cryptographic checksum logged to immutable compliance vault"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Blocker or Outstanding Prerequisite (Optional)
                </label>
                <input
                  type="text"
                  value={newBlocker}
                  onChange={(e) => setNewBlocker(e.target.value)}
                  placeholder="e.g., Stalled on external counsel liability redline"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Save & Index in Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
