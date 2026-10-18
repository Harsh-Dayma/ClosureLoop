import React, { useState, useMemo } from 'react';
import type { ActivityEvent } from '../../types/workflow';
import { 
  GitFork, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  History 
} from 'lucide-react';

interface ActivityFeedProps {
  events: ActivityEvent[];
  onSelectWorkflow: (workflowId: string) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, onSelectWorkflow }) => {
  const [filter, setFilter] = useState<'all' | 'blockers' | 'verified'>('all');

  const filteredEvents = useMemo(() => {
    if (filter === 'blockers') {
      return events.filter((e) => e.type === 'blocker_detected' || e.type === 'prerequisite_identified');
    }
    if (filter === 'verified') {
      return events.filter((e) => e.type === 'outcome_confirmed' || e.type === 'moved_to_verification');
    }
    return events;
  }, [events, filter]);

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'prerequisite_identified':
        return <GitFork className="w-3.5 h-3.5 text-blue-500" />;
      case 'owner_assigned':
        return <UserCheck className="w-3.5 h-3.5 text-purple-500" />;
      case 'moved_to_verification':
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
      case 'outcome_confirmed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />;
      case 'blocker_detected':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col select-none">
      {/* Header & Filter Pills */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 text-slate-700">
            <History className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Recent Activity</h3>
            <p className="text-[10px] text-slate-400">Live relationship index updates</p>
          </div>
        </div>

        {/* Small Sentry-style filters */}
        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-md border border-slate-200 text-[10px]">
          {(['all', 'blockers', 'verified'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-1.5 py-0.5 rounded capitalize transition-colors ${
                filter === tab ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3.5 flex-1">
        {filteredEvents.map((event, idx) => (
          <div 
            key={event.id} 
            onClick={() => onSelectWorkflow(event.workflowId)}
            className="relative flex items-start gap-2.5 group cursor-pointer"
          >
            {/* Timeline connector line */}
            {idx !== filteredEvents.length - 1 && (
              <div className="absolute left-[13px] top-6 bottom-0 w-px bg-slate-100 group-hover:bg-slate-200 transition-colors" />
            )}

            {/* Icon Bubble */}
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 z-10 shadow-xs group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors mt-0.5">
              {getEventIcon(event.type)}
            </div>

            {/* Event Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {event.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {event.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                {event.description}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 truncate max-w-[170px]">
                  {event.workflowTitle}
                </span>
                <span className="text-[9px] text-slate-400">
                  · {event.author}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Notice */}
      <div className="mt-4 pt-2.5 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-mono">
          Sample audit trail · FalkorDB activity log
        </p>
      </div>
    </div>
  );
};
