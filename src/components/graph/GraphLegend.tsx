import React from 'react';

export const GraphLegend: React.FC = () => {
  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-slate-300 text-[10px] shadow-lg select-none">
      <div className="font-semibold text-slate-400 uppercase tracking-wider mb-2 text-[9px]">
        FalkorDB Graph Legend
      </div>
      
      {/* Node Types */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-blue-500"></span>
          <span>Workflow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-indigo-500"></span>
          <span>Task</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-cyan-400"></span>
          <span>System</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-amber-500"></span>
          <span>Approval</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-purple-500"></span>
          <span>Person</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-teal-400"></span>
          <span>Verification</span>
        </div>
      </div>

      {/* Edge Styles */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-amber-400 inline-block border-t border-dashed border-amber-300"></span>
          <span className="text-amber-300 font-medium">Critical Blocker Path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-sky-400 inline-block"></span>
          <span className="text-slate-400">Prerequisite Dependency</span>
        </div>
      </div>
    </div>
  );
};
