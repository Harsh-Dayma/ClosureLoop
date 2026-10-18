import type {
  ActionItem,
  ActionFilters,
  ReviewDecision,
  ActionActor,
  ActionExecutionResponse
} from '../types/action';

export interface ActionStats {
  total: number;
  pendingReview: number;
  readyForExecution: number;
  awaitingVerification: number;
  completed: number;
}

export class ActionService {
  /**
   * Fetch all actions matching the filter criteria with aggregate stats
   */
  public static async getActions(filters?: ActionFilters): Promise<{ actions: ActionItem[]; stats: ActionStats }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters?.urgency && filters.urgency !== 'ALL') params.append('urgency', filters.urgency);
      if (filters?.workflowId && filters.workflowId !== 'ALL') params.append('workflowId', filters.workflowId);
      if (filters?.searchQuery) params.append('search', filters.searchQuery);

      const url = `/api/actions${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Actions API responded with status ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      console.warn('Backend API unreachable, using client fallback for actions:', err.message);
      // Fallback fallback if API is not yet loaded
      return {
        actions: [],
        stats: {
          total: 0,
          pendingReview: 0,
          readyForExecution: 0,
          awaitingVerification: 0,
          completed: 0
        }
      };
    }
  }

  /**
   * Fetch single action by ID
   */
  public static async getActionById(id: string): Promise<ActionItem | null> {
    try {
      const res = await fetch(`/api/actions/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.action || null;
    } catch {
      return null;
    }
  }

  /**
   * Submit a review decision (Approve, Reject, Request Info, Cancel)
   */
  public static async reviewAction(
    id: string,
    decision: ReviewDecision,
    actor: ActionActor,
    notes?: string
  ): Promise<{ success: boolean; action?: ActionItem; error?: string }> {
    try {
      const res = await fetch(`/api/actions/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, actor, notes })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Network request failed' };
    }
  }

  /**
   * Dispatches execution for an approved action
   */
  public static async executeAction(
    id: string,
    actor: ActionActor
  ): Promise<ActionExecutionResponse> {
    try {
      const res = await fetch(`/api/actions/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor })
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        actionId: id,
        status: 'FAILED',
        message: err.message || 'Execution failed',
        executionTimestamp: new Date().toISOString(),
        auditEvent: {
          id: `aud-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor,
          event: 'Network Failure during Execution'
        },
        isSimulated: true
      };
    }
  }

  /**
   * Resets actions to clean seed state
   */
  public static async resetActions(): Promise<boolean> {
    try {
      const res = await fetch('/api/actions/reset', { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}
