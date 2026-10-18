import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Workflow, 
  Sparkles, 
  Network, 
  Database, 
  Check, 
  Copy, 
  Layers, 
  FileText,
  Zap,
  ShieldCheck,
  CornerDownLeft,
  X,
  Settings
} from 'lucide-react';
import { sampleWorkflows } from '../../data/mockWorkflows';
import type { NavModuleId } from '../../types/navigation';
import type { WorkflowItem } from '../../types/workflow';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (module: NavModuleId) => void;
  onSelectWorkflow: (workflow: WorkflowItem) => void;
  onOpenInvestigation: (title?: string, blocker?: string) => void;
  onJumpToGraph: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  onSelectWorkflow,
  onOpenInvestigation,
  onJumpToGraph,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedCypher, setCopiedCypher] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build searchable items
  interface ActionItem {
    id: string;
    category: 'Workflows' | 'Quick Actions' | 'Navigation';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
  }

  const items: ActionItem[] = [
    // Quick Actions
    {
      id: 'act-investigate',
      category: 'Quick Actions',
      title: 'Investigate Stalled Dependency',
      subtitle: 'Dispatch multi-hop relationship investigation across systems',
      icon: <Sparkles className="w-4 h-4 text-blue-500" />,
      action: () => {
        onClose();
        onOpenInvestigation();
      }
    },
    {
      id: 'act-jump-graph',
      category: 'Quick Actions',
      title: 'Inspect Dependency Intelligence Hero',
      subtitle: 'Scroll to and highlight active graph topology',
      icon: <Network className="w-4 h-4 text-teal-500" />,
      action: () => {
        onClose();
        onJumpToGraph();
      }
    },
    {
      id: 'act-copy-cypher',
      category: 'Quick Actions',
      title: 'Copy FalkorDB Blocker Cypher Query',
      subtitle: 'MATCH (w:Workflow)-[:REQUIRES*]->(b:Approval {status: "BLOCKED"})',
      icon: copiedCypher ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />,
      action: () => {
        navigator.clipboard.writeText(
          'MATCH (w:Workflow {id: "wf-onboarding"})-[:REQUIRES*1..3]->(b:Approval) WHERE b.status = "BLOCKED" RETURN w, b;'
        );
        setCopiedCypher(true);
        setTimeout(() => {
          setCopiedCypher(false);
          onClose();
        }, 800);
      }
    },

    // Workflows
    ...sampleWorkflows.map((wf) => ({
      id: `wf-${wf.id}`,
      category: 'Workflows' as const,
      title: wf.title,
      subtitle: `${wf.team} · Blocker: ${wf.blocker} (${wf.status})`,
      icon: <Workflow className="w-4 h-4 text-slate-500" />,
      action: () => {
        onClose();
        onSelectWorkflow(wf);
      }
    })),

    // Navigation
    {
      id: 'nav-overview',
      category: 'Navigation',
      title: 'Overview Dashboard',
      subtitle: 'Main executive dependency hub',
      icon: <Layers className="w-4 h-4 text-slate-400" />,
      action: () => {
        onClose();
        onSelectModule('overview');
      }
    },
    {
      id: 'nav-workflows',
      category: 'Navigation',
      title: 'Workflow Registry',
      subtitle: 'Browse all cross-system workflows, dependencies, and SLAs',
      icon: <Workflow className="w-4 h-4 text-blue-500" />,
      action: () => {
        onClose();
        onSelectModule('workflows');
      }
    },
    {
      id: 'nav-graph-explorer',
      category: 'Navigation',
      title: 'Graph Explorer',
      subtitle: 'Full-screen FalkorDB graph workspace',
      icon: <Database className="w-4 h-4 text-teal-400" />,
      action: () => {
        onClose();
        onSelectModule('graph_explorer');
      }
    },
    {
      id: 'nav-investigations',
      category: 'Navigation',
      title: 'Investigations Room',
      subtitle: 'Root cause analysis & evidence vault',
      icon: <FileText className="w-4 h-4 text-amber-500" />,
      action: () => {
        onClose();
        onSelectModule('investigations');
      }
    },
    {
      id: 'nav-action-center',
      category: 'Navigation',
      title: 'Action Center',
      subtitle: 'Coordinated unblocking & owner approvals',
      icon: <Zap className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onClose();
        onSelectModule('action_center');
      }
    },
    {
      id: 'nav-verification',
      category: 'Navigation',
      title: 'Verification & Memory',
      subtitle: 'Cryptographic outcome logs & FalkorDB memory',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onClose();
        onSelectModule('verification_memory');
      }
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Settings & Integrations',
      subtitle: 'FalkorDB engine parameters, connector catalog, and diagnostics',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      action: () => {
        onClose();
        onSelectModule('settings');
      }
    }
  ];

  // Filter items
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 transition-all animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search workflows, modules, actions..."
            className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No results found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="truncate">
                      <span className="font-medium text-slate-900">{item.title}</span>
                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {item.category}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">↵</kbd> Select</span>
            <span><kbd className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">esc</kbd> Dismiss</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">ClosureLoop QuickBar</span>
        </div>
      </div>
    </div>
  );
};
