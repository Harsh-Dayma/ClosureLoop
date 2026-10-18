import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import type { NavModuleId } from '../../types/navigation';
import type { WorkflowItem } from '../../types/workflow';
import type { UserPersona, UserRole } from '../../types/role';

interface AppShellProps {
  children: React.ReactNode;
  activeModule: NavModuleId;
  onSelectModule: (id: NavModuleId) => void;
  onOpenInvestigation: (title?: string, blocker?: string) => void;
  onSelectWorkflow: (workflow: WorkflowItem) => void;
  onJumpToGraph: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  currentPersona: UserPersona;
  onSelectPersona: (role: UserRole) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeModule,
  onSelectModule,
  onOpenInvestigation,
  onSelectWorkflow,
  onJumpToGraph,
  searchQuery,
  onSearchChange,
  isSidebarCollapsed,
  onToggleSidebar,
  currentPersona,
  onSelectPersona,
}) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={onSelectModule}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Topbar */}
        <Topbar
          onOpenInvestigation={() => onOpenInvestigation()}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          activeModule={activeModule}
          currentPersona={currentPersona}
          onSelectPersona={onSelectPersona}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-[#f8fafc]">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectModule={onSelectModule}
        onSelectWorkflow={onSelectWorkflow}
        onOpenInvestigation={onOpenInvestigation}
        onJumpToGraph={onJumpToGraph}
      />
    </div>
  );
};
