import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Sparkles, 
  ChevronDown,
  Radio,
  PanelLeft,
  Check
} from 'lucide-react';
import type { NavModuleId } from '../../types/navigation';
import { type UserPersona, type UserRole, USER_PERSONAS } from '../../types/role';

interface TopbarProps {
  onOpenInvestigation: () => void;
  onOpenCommandPalette: () => void;
  searchQuery: string;
  onSearchChange?: (query: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeModule?: NavModuleId;
  currentPersona: UserPersona;
  onSelectPersona: (role: UserRole) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenInvestigation,
  onOpenCommandPalette,
  searchQuery,
  isSidebarCollapsed,
  onToggleSidebar,
  activeModule = 'overview',
  currentPersona,
  onSelectPersona,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getModuleBreadcrumb = (mod: NavModuleId) => {
    switch (mod) {
      case 'overview':
        return 'Overview';
      case 'workflows':
        return 'Workflows';
      case 'tasks':
      case 'action_center':
        return 'My Tasks';
      case 'history':
      case 'verification_memory':
        return 'History & Audit';
      case 'investigations':
        return 'Investigation';
      case 'graph_explorer':
        return 'Graph Explorer';
      case 'settings':
        return 'Settings';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Collapsible Sidebar Trigger + Divider + Breadcrumbs + Quick Search */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Tremor Planner Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center shrink-0"
          title={isSidebarCollapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="w-4 h-4 text-slate-600 hover:text-slate-900" />
        </button>

        {/* Vertical divider */}
        <div className="h-4 w-px bg-slate-200 shrink-0" />

        {/* Tremor Planner Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 hover:text-slate-600 transition-colors hidden sm:inline">Workspace</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-900 font-semibold flex items-center gap-1.5 truncate">
            {activeModule === 'overview' && (
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse shrink-0" />
            )}
            <span className="truncate">{getModuleBreadcrumb(activeModule)}</span>
          </span>
        </div>

        {/* Command Search Bar */}
        <div 
          onClick={onOpenCommandPalette}
          className="relative w-64 md:w-72 hidden lg:flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-xs text-slate-400 cursor-pointer transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {searchQuery ? searchQuery : 'Search workflows, blockers, Cypher...'}
            </span>
          </div>
          <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded shrink-0">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Alerts, User Profile */}
      <div className="flex items-center gap-3">
        {/* Primary Action Button */}
        <button
          onClick={onOpenInvestigation}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Investigate workflow</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-semibold text-slate-900">
                <span>Outcome & Blocker Alerts</span>
                <span className="text-[10px] text-blue-600 cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Security Approval Stalled</span>
                    <span className="text-[10px] text-amber-600 font-medium">Critical</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                    Sarah Lin has not signed off on Production Access for Jordan Hayes (+18h SLA breach).
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">14 mins ago</span>
                </div>
                <div className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">SLA Overdue: Engineering Release</span>
                    <span className="text-[10px] text-rose-600 font-medium">Overdue</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                    Release approval overdue by 3 days awaiting QA gatekeeper.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Persona & Role Switcher */}
        <div className="relative pl-2 border-l border-slate-200/80">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg transition-colors text-left"
            title="Switch Persona / Role"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center border border-slate-200 shrink-0">
              {currentPersona.avatarInitials}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight">{currentPersona.name}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{currentPersona.roleTitle}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
              <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
                <div className="font-semibold text-slate-900">{currentPersona.name}</div>
                <div className="text-slate-400 text-[10px] truncate">{currentPersona.email}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                    {currentPersona.role}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">{currentPersona.department}</span>
                </div>
              </div>

              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Role / Persona
              </div>

              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                {(Object.keys(USER_PERSONAS) as UserRole[]).map((roleKey) => {
                  const persona = USER_PERSONAS[roleKey];
                  const isCurrent = currentPersona.role === roleKey;

                  return (
                    <button
                      key={roleKey}
                      onClick={() => {
                        onSelectPersona(roleKey);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs truncate">{persona.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{persona.roleTitle}</div>
                      </div>
                      {isCurrent && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-slate-100 text-[10px] text-slate-400 px-2.5">
                Role controls authorized action scope and attention prompts.
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
