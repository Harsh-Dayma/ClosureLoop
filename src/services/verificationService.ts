/**
 * ClosureLoop — Module 6: Verification & Memory Frontend Service
 * 
 * Communicates with backend endpoints (/api/verifications, /api/memory)
 * to verify business outcomes, retrieve audit streams, and query enterprise memory.
 */

import type {
  WorkflowVerificationRecord,
  VerificationFilterParams,
  VerificationStats,
  VerificationEvent,
  HistoricalMemoryRecord,
  VerificationRunResponse,
  VerificationScenario
} from '../types/verification';

export class VerificationService {
  /**
   * Fetches verification records and queue telemetry stats
   */
  public static async getVerifications(
    filters?: VerificationFilterParams
  ): Promise<{ verifications: WorkflowVerificationRecord[]; stats: VerificationStats }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'ALL') {
        params.append('status', filters.status);
      }
      if (filters?.department && filters.department !== 'ALL') {
        params.append('department', filters.department);
      }
      if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
        params.append('search', filters.searchQuery.trim());
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/verifications${queryString}`, {
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch verifications: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.error('[VerificationService] getVerifications error:', err);
      throw err;
    }
  }

  /**
   * Retrieves single workflow verification record with chronological event history
   */
  public static async getVerificationDetails(
    workflowId: string
  ): Promise<{ verification: WorkflowVerificationRecord; events: VerificationEvent[] }> {
    try {
      const res = await fetch(`/api/verifications/${encodeURIComponent(workflowId)}`, {
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch verification for '${workflowId}': ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.error('[VerificationService] getVerificationDetails error:', err);
      throw err;
    }
  }

  /**
   * Triggers an automated cryptographic verification run
   */
  public static async runVerification(
    workflowId: string,
    scenario: VerificationScenario = 'DEFAULT',
    actor?: { id: string; name: string; role: string; email: string }
  ): Promise<VerificationRunResponse> {
    try {
      const res = await fetch(`/api/verifications/${encodeURIComponent(workflowId)}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ scenario, actor })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Verification run failed: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.error('[VerificationService] runVerification error:', err);
      throw err;
    }
  }

  /**
   * Fetches historical memory records
   */
  public static async getMemories(searchQuery?: string): Promise<{ memories: HistoricalMemoryRecord[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim() !== '') {
        params.append('search', searchQuery.trim());
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/memory${qs}`, {
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch memories: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      console.error('[VerificationService] getMemories error:', err);
      throw err;
    }
  }

  /**
   * Fetches a single historical memory record
   */
  public static async getMemoryById(id: string): Promise<HistoricalMemoryRecord> {
    try {
      const res = await fetch(`/api/memory/${encodeURIComponent(id)}`, {
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch memory record '${id}': ${res.statusText}`);
      }

      const data = await res.json();
      return data.memory;
    } catch (err) {
      console.error('[VerificationService] getMemoryById error:', err);
      throw err;
    }
  }

  /**
   * Resets verification repository to initial clean baseline
   */
  public static async resetVerifications(): Promise<void> {
    try {
      const res = await fetch('/api/verifications/reset', {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Failed to reset verifications: ${res.statusText}`);
      }
    } catch (err) {
      console.error('[VerificationService] resetVerifications error:', err);
      throw err;
    }
  }
}
