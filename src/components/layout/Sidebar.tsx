import React from 'react';
import { 
  LayoutDashboard, 
  Workflow, 
  SearchCode, 
  Network, 
  Settings,
  Database,
  Layers,
  ChevronRight,
  ChevronDown,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  CheckSquare,
  History
} from 'lucide-react';
import type { NavModuleId } from '../../types/navigation';
import { navigationModules } from '../../data/mockModules';

interface SidebarProps {
  activeModule: NavModuleId;
  onSelectModule: (id: NavModuleId) => void;
  onOpenCommandPalette: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  onOpenCommandPalette,
  collapsed,
  onToggleCollapse,
}) => {
  const getIcon = (id: NavModuleId) => {
    switch (id) {
      case 'overview':
        return <LayoutDashboard className="w-4 h-4 shrink-0" />;
      case 'workflows':
        return <Workflow className="w-4 h-4 shrink-0" />;
      case 'tasks':
      case 'action_center':
        return <CheckSquare className="w-4 h-4 shrink-0" />;
      case 'history':
      case 'verification_memory':
        return <History className="w-4 h-4 shrink-0" />;
      case 'investigations':
        return <SearchCode className="w-4 h-4 shrink-0" />;
      case 'graph_explorer':
        return <Network className="w-4 h-4 shrink-0" />;
      case 'settings':
        return <Settings className="w-4 h-4 shrink-0" />;
      default:
        return <LayoutDashboard className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <aside 
      className={`bg-[#090d16] text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 select-none z-20 transition-[width] duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-14 px-3.5 flex items-center border-b border-slate-800/80 ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}>
        <div 
          onClick={() => onSelectModule('overview')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="ClosureLoop Home"
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-sm tracking-tight truncate">ClosureLoop</span>
                <span className="text-[9px] font-mono font-medium px-1 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  v1.0
                </span>
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Workspace Switcher Pill */}
      {!collapsed ? (
        <div className="p-3 border-b border-slate-800/60">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="font-medium text-slate-200 truncate">Enterprise Prod</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </div>
        </div>
      ) : (
        <div className="p-2 border-b border-slate-800/60 flex justify-center">
          <div 
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 cursor-pointer"
            title="Enterprise Prod Workspace"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <div className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Intelligence Modules
          </div>
        )}

        {navigationModules.map((item) => {
          const isActive = activeModule === item.id;
          const isLeftToBuild = item.status === 'left_to_build';

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={collapsed ? `${item.label} (${item.status === 'left_to_build' ? 'Roadmap' : 'Active'})` : undefined}
              className={`w-full flex items-center rounded-md text-xs font-medium transition-all group relative ${
                collapsed 
                  ? 'justify-center p-2' 
                  : 'justify-between px-2.5 py-2'
              } ${
                isActive
                  ? 'bg-slate-800/90 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-500 rounded-r"></span>
              )}

              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {getIcon(item.id)}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1 shrink-0">
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                        item.badgeVariant === 'warning'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : item.badgeVariant === 'primary'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isLeftToBuild && !item.badge && (
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-300">
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Quiet Settings navigation item */}
        <button
          onClick={() => onSelectModule('settings')}
          title={collapsed ? 'Settings' : undefined}
          className={`w-full flex items-center rounded-md text-xs font-medium transition-all group relative mt-1 ${
            collapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-2'
          } ${
            activeModule === 'settings'
              ? 'bg-slate-800/90 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          {activeModule === 'settings' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-500 rounded-r"></span>
          )}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={activeModule === 'settings' ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}>
              <Settings className="w-4 h-4 shrink-0" />
            </span>
            {!collapsed && <span className="truncate">Settings</span>}
          </div>
        </button>
      </div>

      {/* Quick Search Trigger button */}
      {!collapsed ? (
        <div className="px-2.5 py-2 border-t border-slate-800/60">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px]">Command Palette</span>
            </div>
            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 py-0.2 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-800/60 flex justify-center">
          <button
            onClick={onOpenCommandPalette}
            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Command Palette (⌘K)"
          >
            <Command className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Calm Status Footer */}
      {!collapsed ? (
        <div className="px-3 py-2.5 m-2 rounded-lg bg-slate-900/50 border border-slate-800/60 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px] font-medium">Graph Engine</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Ready</span>
          </div>
        </div>
      ) : (
        <div className="p-2 flex justify-center" title="FalkorDB Graph Engine Active">
          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Database className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Collapse Toggle at Bottom when collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-slate-800/60 flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
