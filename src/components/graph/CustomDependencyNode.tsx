import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { FalkorNodeProperties } from '../../types/graph';
import { 
  GitBranch, 
  CheckSquare, 
  Server, 
  FileCheck2, 
  Clock,
  AlertTriangle,
  User,
  ShieldCheck
} from 'lucide-react';

export const CustomDependencyNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as FalkorNodeProperties;
  const { label, sublabel, entityType, status, owner, blockerReason } = nodeData;

  const isCritical = status === 'CRITICAL' || status === 'BLOCKED';
  const isCompleted = status === 'COMPLETED';

  // Entity Type Configurations
  const getEntityConfig = () => {
    switch (entityType) {
      case 'WORKFLOW':
        return {
          icon: <GitBranch className="w-3 h-3 text-blue-400" />,
          badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
          typeLabel: 'WORKFLOW'
        };
      case 'EMPLOYEE':
        return {
          icon: <User className="w-3 h-3 text-emerald-400" />,
          badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          typeLabel: 'EMPLOYEE'
        };
      case 'APPLICATION':
        return {
          icon: <Server className="w-3 h-3 text-sky-400" />,
          badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          typeLabel: 'APPLICATION'
        };
      case 'ACCESS':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-rose-400" />,
          badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          typeLabel: 'ACCESS'
        };
      case 'BUSINESS_OUTCOME':
        return {
          icon: <Clock className="w-3 h-3 text-amber-400" />,
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          typeLabel: 'OUTCOME'
        };
      case 'TASK':
        return {
          icon: <CheckSquare className="w-3 h-3 text-indigo-400" />,
          badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          typeLabel: 'TASK'
        };
      case 'SYSTEM':
        return {
          icon: <Server className="w-3 h-3 text-cyan-400" />,
          badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          typeLabel: 'SYSTEM'
        };
      case 'APPROVAL':
        return {
          icon: <FileCheck2 className="w-3 h-3 text-amber-400" />,
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          typeLabel: 'APPROVAL'
        };
      case 'PERSON':
        return {
          icon: <User className="w-3 h-3 text-purple-400" />,
          badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          typeLabel: 'PERSON'
        };
      case 'VERIFICATION':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-teal-400" />,
          badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
          typeLabel: 'VERIFICATION'
        };
      default:
        return {
          icon: <CheckSquare className="w-3 h-3 text-slate-400" />,
          badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
          typeLabel: 'NODE'
        };
    }
  };

  const config = getEntityConfig();

  // Status Badge
  const renderStatus = () => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Verified
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-semibold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/80">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
            BLOCKER
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Blocked
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            Pending
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono text-blue-400 bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-800/60">
            Active
          </span>
        );
    }
  };

  return (
    <div
      className={`relative w-60 rounded-lg text-left transition-all duration-150 ${
        isCritical && status === 'CRITICAL'
          ? 'bg-[#0f1422] border border-amber-500 shadow-md shadow-amber-500/10 pulse-critical'
          : selected
          ? 'bg-[#121929] border border-blue-400 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/15'
          : isCompleted
          ? 'bg-[#0a0e1a] border border-slate-800 hover:border-slate-700'
          : 'bg-[#0a0e1a] border border-slate-800/90 hover:border-slate-700'
      } p-3 backdrop-blur-xs select-none`}
    >
      {/* Target & Source Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400 !w-2 !h-2 !border-slate-900"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-blue-400 !w-2 !h-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-400 !w-2 !h-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-blue-400 !w-2 !h-2 !border-slate-900"
      />

      {/* Header: Type Tag & Status */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border ${config.badgeBg}`}>
          {config.icon}
          {config.typeLabel}
        </span>
        {renderStatus()}
      </div>

      {/* Title & Sublabel */}
      <div className="mb-2">
        <h4 className="text-xs font-semibold text-white tracking-tight leading-snug">
          {label}
        </h4>
        {sublabel && (
          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">
            {sublabel}
          </p>
        )}
      </div>

      {/* Blocker Callout if any */}
      {blockerReason && (
        <div className="mb-2 p-1.5 rounded bg-amber-950/30 border border-amber-800/40 text-[9px] text-amber-200/90 leading-tight">
          <span className="font-semibold text-amber-300">Blocker: </span>
          <span className="line-clamp-2">{blockerReason}</span>
        </div>
      )}

      {/* Footer: Owner & FalkorDB pill */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1 truncate max-w-[130px]">
          <span className="text-slate-500 text-[9px]">Owner:</span>
          <span className="text-slate-300 font-medium truncate">{owner || 'Unassigned'}</span>
        </div>
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
          FalkorDB
        </span>
      </div>
    </div>
  );
});

CustomDependencyNode.displayName = 'CustomDependencyNode';
