import React from 'react';
import type { WorkflowStatus } from '../../types/workflow';

interface StatusBadgeProps {
  status: WorkflowStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const norm = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (norm === 'blocked') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-400/20';
    dotColor = 'bg-amber-500 animate-pulse';
  } else if (norm === 'pending') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (norm === 'overdue') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-400/20';
    dotColor = 'bg-rose-500 animate-ping';
  } else if (norm === 'verified') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (norm === 'in progress') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${padding} ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
