/**
 * ClosureLoop — Module 7: Settings & Integrations Type Definitions
 */

export type IntegrationStatus = 
  | 'connected'
  | 'unverified'
  | 'not_configured'
  | 'unavailable'
  | 'demo_adapter';

export type IntegrationCategory = 
  | 'DATABASE'
  | 'IDENTITY'
  | 'ITSM'
  | 'INFRASTRUCTURE'
  | 'DEV_TOOLS'
  | 'NOTIFICATIONS'
  | 'PAYMENTS';

export interface IntegrationItem {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  adapterType: 'LIVE_DRIVER' | 'DEMO_ADAPTER';
  description: string;
  targetPurpose: string;
  requiredConfig: string;
  isConfigured: boolean;
  lastChecked: string;
  docsUrl?: string;
  connectionNotes?: string;
}

export interface FalkorConnectionState {
  connected: boolean;
  host: string;
  port: number;
  graphName: string;
  lastChecked: string;
  error: string | null;
  dockerRunCommand: string;
  instructions: string;
  pingLatencyMs?: number;
}

export interface SystemDiagnostics {
  nodeVersion: string;
  uptimeSeconds: number;
  platform: string;
  activeWorkflows: number;
  activeActions: number;
  verifiedOutcomes: number;
  indexedMemories: number;
  checkedAt: string;
}

export interface GeneralSettings {
  appName: string;
  version: string;
  environment: string;
  demoMode: boolean;
  telemetryVerification: string;
  strictServiceBoundary: boolean;
  graphEngineName: string;
}

export interface SettingsPayload {
  general: GeneralSettings;
  falkor: FalkorConnectionState;
  integrations: IntegrationItem[];
  diagnostics: SystemDiagnostics;
}
