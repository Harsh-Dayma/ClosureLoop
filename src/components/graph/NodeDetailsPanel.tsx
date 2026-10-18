import React, { useState } from 'react';
import type { FalkorNodeProperties } from '../../types/graph';
import { 
  X, 
  AlertTriangle, 
  Terminal, 
  Copy, 
  Check, 
  Sparkles,
  Send,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface NodeDetailsPanelProps {
  nodeId: string | null;
  nodeData: FalkorNodeProperties | null;
  onClose: () => void;
  onInvestigate: (workflowTitle: string, blocker: string) => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  nodeId,
  nodeData,
  onClose,
  onInvestigate
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cypher' | 'remediation'>('overview');
  const [copiedCypher, setCopiedCypher] = useState(false);
  const [actionSimulated, setActionSimulated] = useState(false);

  if (!nodeId || !nodeData) {
    return null;
  }

  const isCritical = nodeData.status === 'CRITICAL' || nodeData.status === 'BLOCKED';

  const handleCopyCypher = () => {
    if (nodeData.cypherQuery) {
      navigator.clipboard.writeText(nodeData.cypherQuery);
      setCopiedCypher(true);
      setTimeout(() => setCopiedCypher(false), 2000);
    }
  };

  const handleSimulateAction = () => {
    setActionSimulated(true);
    setTimeout(() => setActionSimulated(false), 3000);
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-84 md:w-96 bg-[#090d16]/95 backdrop-blur-md border-l border-slate-800 flex flex-col text-slate-200 text-xs overflow-hidden z-30 select-none shadow-2xl transition-all">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono tracking-wider uppercase text-blue-400 font-semibold">
              {nodeData.entityType}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ID: {nodeId}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight truncate mt-0.5">
            {nodeData.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sentry-style Inspector Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-[#070a12] px-3">
        {(['overview', 'cypher', 'remediation'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-3 text-[11px] font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'cypher' ? 'FalkorDB Cypher' : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <>
            {/* Blocker Alert Banner if critical */}
            {isCritical && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/50">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px] mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>CRITICAL PATH BOTTLENECK</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  {nodeData.blockerReason || 'Stalling outcome verification.'}
                </p>
                <div className="mt-2 pt-2 border-t border-amber-800/40 flex items-center justify-between text-[10px] text-amber-300 font-mono">
                  <span>Impacted Outcome:</span>
                  <span className="truncate max-w-[170px]">Candidate Access Blocked</span>
                </div>
              </div>
            )}

            {/* Confidence & Entity Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[#0e1320] border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence Score</div>
                <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                  {Math.round((nodeData.confidence || 0.95) * 100)}%
                  <span className="text-[9px] text-emerald-400 font-mono px-1 py-0.2 rounded bg-emerald-950 border border-emerald-800">
                    High
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.round((nodeData.confidence || 0.95) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0e1320] border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current Status</div>
                <div className="text-xs font-semibold text-white mt-1 font-mono uppercase text-blue-300">
                  {nodeData.status}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  Updated: <span className="text-slate-300">{nodeData.lastUpdated || 'Recently'}</span>
                </div>
              </div>
            </div>

            {/* Ownership & Responsible Team */}
            <div className="p-3 rounded-lg bg-[#0e1320] border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Responsible Owner & Team
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  {(nodeData.owner || 'U')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {nodeData.owner || 'Unassigned'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {nodeData.team || 'Cross-Functional Ops'}
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Attributes */}
            {nodeData.metadata && Object.keys(nodeData.metadata).length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Graph Metadata Attributes
                </div>
                <div className="bg-[#0e1320] rounded-lg border border-slate-800 divide-y divide-slate-800/80 text-[11px]">
                  {Object.entries(nodeData.metadata).map(([key, val]) => (
                    <div key={key} className="px-3 py-1.5 flex items-center justify-between gap-2">
                      <span className="text-slate-400">{key}</span>
                      <span className="font-medium text-slate-200 text-right truncate max-w-[180px] font-mono text-[10px]">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'cypher' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-teal-400 font-mono font-semibold flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                OpenCypher Query Pattern
              </span>
              <button
                onClick={handleCopyCypher}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-slate-800"
              >
                {copiedCypher ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCypher ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#05070d] border border-slate-800 font-mono text-[10px] text-teal-300 leading-relaxed overflow-x-auto select-text">
              {nodeData.cypherQuery || `MATCH (n {id: "${nodeId}"}) RETURN n;`}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200 font-semibold block mb-0.5">Execution Details:</strong>
              This query traverses incoming and outgoing edges in FalkorDB up to 3 hops away, projecting prerequisite states and identifying unresolved blocks.
            </div>
          </div>
        )}

        {activeTab === 'remediation' && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/50 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                <Zap className="w-3.5 h-3.5" />
                <span>Recommended Action</span>
              </div>
              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                Dispatch automated escalation notification to <strong>{nodeData.owner || 'responsible owner'}</strong> with pre-approved temporary bypass link.
              </p>
            </div>

            <button
              onClick={handleSimulateAction}
              disabled={actionSimulated}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                actionSimulated
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {actionSimulated ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Escalation Sent to {nodeData.owner}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Send Owner Escalation</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-3 border-t border-slate-800 bg-[#070a12]">
        <button
          onClick={() => onInvestigate(nodeData.label, nodeData.blockerReason || 'Unresolved dependency')}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Investigate this bottleneck</span>
        </button>
      </div>
    </div>
  );
};
