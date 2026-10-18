import React, { useState } from 'react';
import type { NavModuleId } from '../../types/navigation';
import { navigationModules } from '../../data/mockModules';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  Database, 
  Workflow, 
  SearchCode, 
  Network, 
  Zap, 
  ShieldCheck, 
  Settings,
  Copy,
  Check,
  Layers
} from 'lucide-react';

interface ModulePlaceholderProps {
  moduleId: NavModuleId;
  onReturnToOverview: () => void;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleId,
  onReturnToOverview,
}) => {
  const mod = navigationModules.find((m) => m.id === moduleId);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [selectedCypherPreset, setSelectedCypherPreset] = useState(0);

  if (!mod) return null;

  const cypherPresets = [
    {
      title: 'Find Cross-Team Blockers',
      query: `MATCH (w:Workflow)-[:REQUIRES*1..4]->(b:Approval {status: "BLOCKED"})
MATCH (b)<-[:RESPONSIBLE_FOR]-(p:Person)
RETURN w.name AS Workflow, b.label AS Blocker, p.name AS Owner, p.team AS Team;`
    },
    {
      title: 'Circular Dependency Detection',
      query: `MATCH path = (t1:Task)-[:REQUIRES*]->(t2:Task)
WHERE t1 = t2
RETURN path, length(path) AS cycle_length;`
    },
    {
      title: 'Blast Radius Analysis',
      query: `MATCH (a:Approval {id: "appr-security"})<-[:REQUIRES*1..3]-(w:Workflow)
RETURN w.id, w.name, w.team, count(w) AS impacted_workflows;`
    }
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const getModuleIcon = () => {
    switch (moduleId) {
      case 'workflows':
        return <Workflow className="w-5 h-5 text-blue-500" />;
      case 'investigations':
        return <SearchCode className="w-5 h-5 text-amber-500" />;
      case 'graph_explorer':
        return <Network className="w-5 h-5 text-teal-400" />;
      case 'action_center':
        return <Zap className="w-5 h-5 text-indigo-400" />;
      case 'verification_memory':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      case 'settings':
        return <Settings className="w-5 h-5 text-slate-400" />;
      default:
        return <Layers className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none animate-in fade-in duration-150">
      {/* Top Breadcrumb & Return Action */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          onClick={onReturnToOverview}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs hover:border-blue-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
            Status: Left to build ({mod.estimatedDelivery || 'Future Phase'})
          </span>
        </div>
      </div>

      {/* Module Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
              {getModuleIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{mod.label}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Target: {mod.estimatedDelivery || 'Roadmap'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                {mod.description}
              </p>
            </div>
          </div>

          <button
            onClick={onReturnToOverview}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
          >
            Go to Module 1 Dashboard
          </button>
        </div>

        {/* Planned Capabilities */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Planned Architectural Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mod.futureCapabilities.map((cap, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80"
              >
                <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span className="text-xs text-slate-700 leading-snug">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module-Specific Interactive Architectural Preview */}
      {moduleId === 'graph_explorer' && (
        <div className="bg-[#090d16] rounded-xl border border-slate-800 p-6 text-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                FalkorDB OpenCypher Query Console Preview
              </h3>
            </div>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
              Direct Cypher Engine
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {cypherPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCypherPreset(idx)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedCypherPreset === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {preset.title}
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="relative">
            <pre className="p-4 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-teal-300 overflow-x-auto leading-relaxed select-text">
              {cypherPresets[selectedCypherPreset].query}
            </pre>
            <button
              onClick={() => handleCopy(cypherPresets[selectedCypherPreset].query)}
              className="absolute right-3 top-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] flex items-center gap-1 transition-colors"
            >
              {copiedQuery ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedQuery ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {moduleId === 'verification_memory' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Cryptographic Outcome Verification Vault (Architecture Blueprint)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Audit Grade
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Verification Ledger</span>
              <p className="text-slate-700 font-medium mt-1">
                Records SHA-256 state hashes of completed outcome prerequisites.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">FalkorDB Graph Memory</span>
              <p className="text-slate-700 font-medium mt-1">
                Stores multi-hop historical resolutions to auto-unblock recurring bottlenecks.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Continuous Compliance</span>
              <p className="text-slate-700 font-medium mt-1">
                Zero-drift enforcement: "A task is not truly complete until outcome verified."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Integration Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-teal-400 shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-white">FalkorDB Context Engine Integration</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Backend multi-hop traversals and agent reasoning loops will connect to this module in subsequent hackathon milestones.
            </p>
          </div>
        </div>
        <button
          onClick={onReturnToOverview}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors shrink-0"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
