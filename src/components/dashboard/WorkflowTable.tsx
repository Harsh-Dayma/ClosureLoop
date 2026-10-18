import React, { useState, useMemo } from 'react';
import type { WorkflowItem } from '../../types/workflow';
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
  Check
} from 'lucide-react';

interface WorkflowTableProps {
  workflows: WorkflowItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelectWorkflow: (workflow: WorkflowItem) => void;
  onInvestigateWorkflow: (workflowTitle: string, blocker: string, workflowId?: string) => void;
  onJumpToGraph: () => void;
}

export const WorkflowTable: React.FC<WorkflowTableProps> = ({
  workflows,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectWorkflow,
  onInvestigateWorkflow,
  onJumpToGraph,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('All Teams');
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Extract unique teams for dropdown
  const uniqueTeams = useMemo(() => {
    const teams = new Set(workflows.map((w) => w.team));
    return ['All Teams', ...Array.from(teams)];
  }, [workflows]);

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      // Search matching
      const matchesSearch =
        !searchQuery ||
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.blocker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.owner.toLowerCase().includes(searchQuery.toLowerCase());

      // Status matching
      const matchesStatus =
        statusFilter === 'All' ||
        w.status.toLowerCase() === statusFilter.toLowerCase();

      // Team matching
      const matchesTeam =
        selectedTeam === 'All Teams' ||
        w.team.toLowerCase() === selectedTeam.toLowerCase();

      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [workflows, searchQuery, statusFilter, selectedTeam]);

  // Count helper for tabs
  const getCountByStatus = (status: string) => {
    if (status === 'All') return workflows.length;
    return workflows.filter((w) => w.status.toLowerCase() === status.toLowerCase()).length;
  };

  const statusTabs = ['All', 'Blocked', 'Pending', 'Overdue'];

  const handleExportCsv = () => {
    const headers = ['ID,Title,Team,Status,Owner,DaysStalled,Blocker'];
    const rows = filteredWorkflows.map(w => 
      `"${w.id}","${w.title.replace(/"/g, '""')}","${w.team}","${w.status}","${w.owner}","${w.daysStalled}","${w.blocker.replace(/"/g, '""')}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `closureloop_workflows_${statusFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2400);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col select-none">
      {/* Header & Controls (Tremor Planner pattern) */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Needs Attention
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredWorkflows.length} records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-functional workflows with unverified outcomes or stalled prerequisites.
            </p>
          </div>

          {/* Search, Team Filter & Export Button */}
          <div className="flex items-center gap-2">
            <div className="relative w-52 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter attention list..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors"
              >
                {uniqueTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Tremor Planner Export Action */}
            <button
              onClick={handleExportCsv}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                exportSuccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200 shadow-2xs'
              }`}
              title="Export filtered records to CSV"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exported</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tremor Planner Segmented Tabs */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg border border-slate-200/60">
            {statusTabs.map((tab) => {
              const isActive = statusFilter.toLowerCase() === tab.toLowerCase();
              const count = getCountByStatus(tab);

              return (
                <button
                  key={tab}
                  onClick={() => onStatusFilterChange(tab)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-slate-950 font-semibold shadow-xs border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/70 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Showing {filteredWorkflows.length} of {workflows.length} items
          </span>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {filteredWorkflows.length === 0 ? (
          <EmptyState
            title="No matching workflows"
            description="Try resetting your filters or search terms to see open records."
            onReset={() => {
              onSearchChange('');
              onStatusFilterChange('All');
              setSelectedTeam('All Teams');
            }}
          />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-5">Workflow Title</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Identified Blocker / Prerequisite</th>
                <th className="py-2.5 px-3">Assignee / Stakeholders</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredWorkflows.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelectWorkflow(item)}
                  className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                >
                  {/* Title & Stalled Duration */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                      <div>
                        <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Stalled: {item.daysStalled} {item.daysStalled === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Team */}
                  <td className="py-3 px-3 text-slate-700">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[11px] font-medium">
                      {item.team}
                    </span>
                  </td>

                  {/* Identified Blocker */}
                  <td className="py-3 px-3 max-w-xs">
                    <div className="flex items-start gap-1.5 text-slate-700">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed text-[11px]">
                        {item.blocker}
                      </span>
                    </div>
                  </td>

                  {/* Tremor Planner Avatar Stack (Assignee & Dependency Owners) */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5 overflow-hidden items-center shrink-0">
                        <div 
                          className="w-6 h-6 rounded-full bg-slate-800 text-white font-semibold text-[10px] flex items-center justify-center ring-2 ring-white"
                          title={`Owner: ${item.owner}`}
                        >
                          {item.owner.split(' ').map((n) => n[0]).join('')}
                        </div>
                        {item.blocker.includes('Sarah Lin') && (
                          <div 
                            className="w-6 h-6 rounded-full bg-indigo-600 text-white font-semibold text-[10px] flex items-center justify-center ring-2 ring-white"
                            title="Blocker Owner: Sarah Lin"
                          >
                            SL
                          </div>
                        )}
                        {item.blocker.includes('David Chen') && (
                          <div 
                            className="w-6 h-6 rounded-full bg-teal-600 text-white font-semibold text-[10px] flex items-center justify-center ring-2 ring-white"
                            title="Blocker Owner: David Chen"
                          >
                            DC
                          </div>
                        )}
                      </div>
                      <span className="text-slate-800 font-medium truncate max-w-[110px] text-[11px]">
                        {item.owner}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-5 text-right">
                    <div 
                      className="inline-flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.id === 'wf-001' && (
                        <button
                          onClick={onJumpToGraph}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Highlight in Graph Hero"
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
                        title="View details"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
