import React from 'react';
import type { DashboardMetrics } from '../../types/workflow';

interface KpiCardsSectionProps {
  metrics: DashboardMetrics;
  activeStatusFilter: string;
  onFilterClick: (status: string) => void;
}

export const KpiCardsSection: React.FC<KpiCardsSectionProps> = ({
  metrics,
  activeStatusFilter,
  onFilterClick,
}) => {
  const cards = [
    {
      id: 'open',
      filterVal: 'All',
      title: 'Total Active Workflows',
      value: metrics.openWorkflows,
      badgeText: 'Active',
      badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Distributed across departments',
      dotColor: 'bg-blue-500'
    },
    {
      id: 'blocked',
      filterVal: 'Blocked',
      title: 'Blocked Outcomes',
      value: metrics.blockedOutcomes,
      badgeText: 'Requires Attention',
      badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Prerequisite dependencies stalled',
      dotColor: 'bg-amber-500'
    },
    {
      id: 'pending',
      filterVal: 'Pending',
      title: 'Pending Actions',
      value: metrics.pendingActions,
      badgeText: 'In Review',
      badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      description: 'Awaiting authorized sign-off',
      dotColor: 'bg-indigo-500'
    },
    {
      id: 'verified',
      filterVal: 'Verified',
      title: 'Verified Outcomes',
      value: metrics.verifiedToday,
      badgeText: 'Confirmed',
      badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Telemetry confirmed today',
      dotColor: 'bg-emerald-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const isSelected = activeStatusFilter.toLowerCase() === card.filterVal.toLowerCase();

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterClick(card.filterVal)}
            className={`p-3.5 rounded-lg bg-white border text-left transition-all relative shadow-2xs hover:border-slate-300 focus:outline-hidden ${
              isSelected
                ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/20'
                : 'border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-slate-500 truncate">
                {card.title}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${card.badgeStyle}`}>
                {card.badgeText}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                {card.value}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor} shrink-0`} />
              <span className="truncate">{card.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

