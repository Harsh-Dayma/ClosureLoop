import type { SettingsPayload, FalkorConnectionState } from '../types/settings';

export class SettingsService {
  /**
   * Fetches full system configuration, FalkorDB status, integration catalog, and diagnostics
   */
  public static async getSettings(): Promise<SettingsPayload> {
    try {
      const res = await fetch('/api/settings', {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Failed to load system settings: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error('[SettingsService] getSettings error:', err);
      throw err;
    }
  }

  /**
   * Triggers a live connectivity ping against the FalkorDB property graph backend
   */
  public static async testFalkorConnection(): Promise<{
    success: boolean;
    latencyMs: number;
    error?: string;
    status: FalkorConnectionState;
  }> {
    try {
      const res = await fetch('/api/settings/test-falkor', {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`FalkorDB test request failed: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error('[SettingsService] testFalkorConnection error:', err);
      throw err;
    }
  }

  /**
   * Master reset of all demo repositories back to clean baseline state
   */
  public static async resetAll(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/settings/reset-all', {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Failed to reset system state: ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      console.error('[SettingsService] resetAll error:', err);
      throw err;
    }
  }
}
