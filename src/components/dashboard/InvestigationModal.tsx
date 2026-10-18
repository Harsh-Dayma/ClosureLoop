import React, { useState } from 'react';
import { sampleWorkflows } from '../../data/mockWorkflows';
import { WorkflowService } from '../../services/workflowService';
import type { InvestigationConfirmation } from '../../services/workflowService';
import { StatusBadge } from '../ui/StatusBadge';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu
} from 'lucide-react';

interface InvestigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedWorkflowTitle?: string;
  preselectedBlocker?: string;
  onOpenInvestigationRoom?: () => void;
}

export const InvestigationModal: React.FC<InvestigationModalProps> = ({
  isOpen,
  onClose,
  preselectedWorkflowTitle,
  preselectedBlocker,
  onOpenInvestigationRoom,
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(() => {
    if (preselectedWorkflowTitle) {
      const match = sampleWorkflows.find((w) =>
        w.title.toLowerCase().includes(preselectedWorkflowTitle.toLowerCase())
      );
      if (match) return match.id;
    }
    return sampleWorkflows[0].id;
  });

  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low'>('high');
  const [investigatorNotes, setInvestigatorNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<InvestigationConfirmation | null>(null);

  const [prevPreselectedTitle, setPrevPreselectedTitle] = useState(preselectedWorkflowTitle);
  if (preselectedWorkflowTitle !== prevPreselectedTitle) {
    setPrevPreselectedTitle(preselectedWorkflowTitle);
    if (preselectedWorkflowTitle) {
      const match = sampleWorkflows.find((w) =>
        w.title.toLowerCase().includes(preselectedWorkflowTitle.toLowerCase())
      );
      if (match) {
        setSelectedWorkflowId(match.id);
      }
    }
    setConfirmation(null);
  }

  if (!isOpen) return null;

  const currentWorkflow = sampleWorkflows.find((w) => w.id === selectedWorkflowId) || sampleWorkflows[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await WorkflowService.submitInvestigation({
        workflowId: currentWorkflow.id,
        workflowTitle: currentWorkflow.title,
        suspectedBlocker: preselectedBlocker || currentWorkflow.blocker,
        urgency,
        requestedBy: 'Alex Morgan (Enterprise Ops Lead)',
        notes: investigatorNotes
      });
      setConfirmation(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setConfirmation(null);
    setInvestigatorNotes('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none"
      onClick={handleResetAndClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#090d16] text-white flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Investigate Workflow Bottleneck
                </h3>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Intake
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dispatch dependency tracing across systems & responsible owners
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Confirmation State */}
        {confirmation ? (
          <div className="p-5 space-y-4">
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-900">
                  Investigation Request Queued (Local Demo Mode)
                </span>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  {confirmation.message}
                </p>
                <div className="mt-1.5 text-[10px] text-emerald-700 font-mono">
                  ID: <span className="font-bold">{confirmation.investigationId}</span> · Time: {confirmation.submittedAt}
                </div>
              </div>
            </div>

            {/* Planned Execution Sequence */}
            <div className="p-3.5 rounded-lg bg-[#090d16] text-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Cpu className="w-3.5 h-3.5" />
                  Simulated FalkorDB Investigation Plan
                </span>
                <span className="text-[9px] font-mono text-slate-400">Module 3 Target</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                {confirmation.simulatedAgentPlan.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 font-mono text-[10px] mt-0.5">{idx + 1}.</span>
                    <span className="text-[11px] leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={handleResetAndClose}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
              {onOpenInvestigationRoom && (
                <button
                  onClick={() => {
                    handleResetAndClose();
                    onOpenInvestigationRoom();
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Investigation Room →</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Intake Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Workflow Picker */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Select Workflow
              </label>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {sampleWorkflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.team}) — {w.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Status & Blocker Card */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  Current Workflow State
                </span>
                <StatusBadge status={currentWorkflow.status} size="sm" />
              </div>
              <div className="text-xs text-slate-800 font-medium">
                <span className="text-slate-400 text-[11px]">Department:</span> {currentWorkflow.team}
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <div className="font-semibold text-amber-950 flex items-center gap-1.5 mb-0.5 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Suspected Blocker:
                </div>
                <span className="text-[11px] leading-snug">{preselectedBlocker || currentWorkflow.blocker}</span>
              </div>
            </div>

            {/* Urgency Selection */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Investigation Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setUrgency(lvl)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      urgency === lvl
                        ? 'bg-blue-50 text-blue-700 border-blue-500 ring-1 ring-blue-500/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {lvl} Priority
                  </button>
                ))}
              </div>
            </div>

            {/* Operator Notes */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Investigation Scope & Context (Optional)
              </label>
              <textarea
                value={investigatorNotes}
                onChange={(e) => setInvestigatorNotes(e.target.value)}
                placeholder="Add specific notes, slack channel refs, or deadline context..."
                rows={2}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Notice */}
            <p className="text-[10px] text-slate-400 italic">
              Notice: Submitting registers this workflow for FalkorDB dependency path analysis in Module 3.
            </p>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Queueing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit Investigation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
