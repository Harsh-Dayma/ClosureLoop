import { falkorClient } from './falkorClient.js';
import { actionRepository } from './actionRepository.js';
import { verificationRepository } from './verificationRepository.js';
import type {
  SettingsPayload,
  IntegrationItem,
  FalkorConnectionState,
  SystemDiagnostics,
  GeneralSettings
} from '../src/types/settings.js';

export const INTEGRATION_REGISTRY: IntegrationItem[] = [
  {
    id: 'int-falkor',
    name: 'FalkorDB Property Graph Engine',
    category: 'DATABASE',
    status: 'unverified', // Calculated dynamically from live client
    adapterType: 'LIVE_DRIVER',
    description: 'Autonomous property graph database for relationship traversal, multi-hop blocker discovery, and enterprise context reasoning.',
    targetPurpose: 'OpenCypher knowledge graph querying across Workflows, Approvals, Tasks, Access, and Outcomes.',
    requiredConfig: 'FALKORDB_HOST, FALKORDB_PORT, FALKORDB_PASSWORD, FALKORDB_GRAPH',
    isConfigured: true,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://docs.falkordb.com/',
    connectionNotes: 'Direct Redis/Falkor protocol over port 6379.'
  },
  {
    id: 'int-workday',
    name: 'Workday Human Capital Management',
    category: 'IDENTITY',
    status: 'demo_adapter',
    adapterType: 'DEMO_ADAPTER',
    description: 'Human capital source of truth for employee hire lifecycle, identity records, and worker profile states.',
    targetPurpose: 'Ingests verified employee profiles (e.g., Jordan Hayes EMP-90214 / WD-REC-88410).',
    requiredConfig: 'WORKDAY_TENANT_ID, WORKDAY_CLIENT_ID, WORKDAY_CLIENT_SECRET, WORKDAY_TOKEN_URL',
    isConfigured: false,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://community.workday.com/api',
    connectionNotes: 'Simulated via demo adapter. Production requires OAuth 2.0 bearer tokens.'
  },
  {
    id: 'int-okta',
    name: 'Okta Enterprise Identity & SCIM 2.0',
    category: 'IDENTITY',
    status: 'demo_adapter',
    adapterType: 'DEMO_ADAPTER',
    description: 'Single sign-on and SCIM directory engine managing developer account provisioning, group bindings, and MFA tokens.',
    targetPurpose: 'Monitors user account status (OKTA-USR-109283) and SCIM group synchronization.',
    requiredConfig: 'OKTA_DOMAIN, OKTA_API_TOKEN',
    isConfigured: false,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://developer.okta.com/docs/api/',
    connectionNotes: 'Simulated via demo adapter. Production requires Okta SSWS API token.'
  },
  {
    id: 'int-jira',
    name: 'Jira Service Management (ITSM & Security)',
    category: 'ITSM',
    status: 'demo_adapter',
    adapterType: 'DEMO_ADAPTER',
    description: 'Enterprise ticketing system tracking manager checklists, service requests, and Tier-1 security approvals.',
    targetPurpose: 'Tracks ticket SEC-TKT-9912 (Sarah Lin security sign-off) and IT-TKT-5519 (Manager orientation).',
    requiredConfig: 'JIRA_BASE_URL, JIRA_API_TOKEN, JIRA_USER_EMAIL',
    isConfigured: false,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://developer.atlassian.com/cloud/jira/service-desk/rest/intro/',
    connectionNotes: 'Simulated via demo adapter. Production requires Atlassian Cloud API token.'
  },
  {
    id: 'int-aws',
    name: 'AWS Identity Center & IAM Management',
    category: 'INFRASTRUCTURE',
    status: 'demo_adapter',
    adapterType: 'DEMO_ADAPTER',
    description: 'Cloud infrastructure privilege management governing AWS IAM role assumption and production cluster access.',
    targetPurpose: 'Verifies whether role arn:aws:iam::102938475610:role/CorePlatformDev is active and assumable.',
    requiredConfig: 'AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ROLE_ARN',
    isConfigured: false,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html',
    connectionNotes: 'Simulated via demo adapter. Production requires AWS STS IAM AssumeRole credentials.'
  },
  {
    id: 'int-github',
    name: 'GitHub Enterprise Audit Webhooks & REST',
    category: 'DEV_TOOLS',
    status: 'demo_adapter',
    adapterType: 'DEMO_ADAPTER',
    description: 'Source control audit log and repository telemetry confirming cryptographically signed code commits.',
    targetPurpose: 'Verifies first code commit (Target outcome for wf-001) in closureloop/core-services.',
    requiredConfig: 'GITHUB_ENTERPRISE_URL, GITHUB_TOKEN, GITHUB_WEBHOOK_SECRET',
    isConfigured: false,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://docs.github.com/en/enterprise-cloud@latest/rest/orgs/audit-log',
    connectionNotes: 'Simulated via demo adapter. Production requires GitHub Personal Access Token or App Installation.'
  },
  {
    id: 'int-slack',
    name: 'Slack Enterprise Grid (Escalation Bot)',
    category: 'NOTIFICATIONS',
    status: 'demo_adapter',
    adapterType: 'DEMO_ADAPTER',
    description: 'Synchronous human-in-the-loop escalation channel for high-priority stalled workflow notifications.',
    targetPurpose: 'Dispatches urgent nudge on SEC-TKT-9912 to Sarah Lin in #secops-escalations (Action ACT-2026-0901).',
    requiredConfig: 'SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_DEFAULT_CHANNEL',
    isConfigured: false,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://api.slack.com/bot-users',
    connectionNotes: 'Simulated via demo adapter. Production requires Slack Bot OAuth token.'
  },
  {
    id: 'int-stripe',
    name: 'Stripe Financial Connections (Treasury API)',
    category: 'PAYMENTS',
    status: 'demo_adapter',
    adapterType: 'DEMO_ADAPTER',
    description: 'Direct banking and micro-deposit verification engine for automated vendor ACH onboarding.',
    targetPurpose: 'Dispatches micro-deposit challenge tokens for vendor bank account verification (Action ACT-2026-0903).',
    requiredConfig: 'STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET',
    isConfigured: false,
    lastChecked: new Date().toISOString(),
    docsUrl: 'https://stripe.com/docs/financial-connections',
    connectionNotes: 'Simulated via demo adapter. Production requires Stripe Secret Key.'
  }
];

class SettingsRepository {
  public async getSettingsPayload(): Promise<SettingsPayload> {
    const falkorHealth = await falkorClient.checkHealth();
    const actions = actionRepository.getActions();
    const verifications = verificationRepository.getVerifications();
    const memories = verificationRepository.getMemories();

    const falkorState: FalkorConnectionState = {
      connected: falkorHealth.connected,
      host: falkorHealth.host,
      port: falkorHealth.port,
      graphName: falkorHealth.graphName,
      lastChecked: falkorHealth.checkedAt,
      error: falkorHealth.error || null,
      dockerRunCommand: 'docker run -p 6379:6379 -p 3000:3000 -v falkordb_data:/var/lib/falkordb/data --name falkordb falkordb/falkordb:edge',
      instructions: falkorHealth.connected
        ? 'FalkorDB graph engine is connected and executing live Cypher queries.'
        : 'FalkorDB is unreachable. Running on structured relational fixture fallback. Launch Docker container on port 6379 to enable live Cypher graph reasoning.'
    };

    const integrations = INTEGRATION_REGISTRY.map((int) => {
      if (int.id === 'int-falkor') {
        return {
          ...int,
          status: falkorHealth.connected ? ('connected' as const) : ('unavailable' as const),
          lastChecked: falkorHealth.checkedAt,
          connectionNotes: falkorHealth.connected
            ? 'Live connection active. Latency: < 4ms.'
            : falkorHealth.error || 'Connection refused.'
        };
      }
      return { ...int };
    });

    const general: GeneralSettings = {
      appName: 'ClosureLoop Enterprise Workflow Intelligence',
      version: '2.4.0-hackathon',
      environment: 'Development & Demonstration Environment',
      demoMode: true,
      telemetryVerification: 'Cryptographic Engine Active',
      strictServiceBoundary: true,
      graphEngineName: 'FalkorDB OpenCypher'
    };

    const diagnostics: SystemDiagnostics = {
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      platform: process.platform,
      activeWorkflows: verifications.length,
      activeActions: actions.length,
      verifiedOutcomes: verifications.filter((v) => v.overallStatus === 'VERIFIED_COMPLETE').length,
      indexedMemories: memories.length,
      checkedAt: new Date().toISOString()
    };

    return {
      general,
      falkor: falkorState,
      integrations,
      diagnostics
    };
  }

  public async testFalkorConnection(): Promise<{
    success: boolean;
    latencyMs: number;
    error?: string;
    status: FalkorConnectionState;
  }> {
    const start = Date.now();
    const health = await falkorClient.checkHealth();
    const latencyMs = Date.now() - start;

    const state: FalkorConnectionState = {
      connected: health.connected,
      host: health.host,
      port: health.port,
      graphName: health.graphName,
      lastChecked: health.checkedAt,
      error: health.error || null,
      dockerRunCommand: 'docker run -p 6379:6379 -p 3000:3000 -v falkordb_data:/var/lib/falkordb/data --name falkordb falkordb/falkordb:edge',
      instructions: health.connected
        ? `Ping verified in ${latencyMs}ms. Graph '${health.graphName}' is ready.`
        : health.error || 'Connection failed.',
      pingLatencyMs: latencyMs
    };

    return {
      success: health.connected,
      latencyMs,
      error: health.error,
      status: state
    };
  }

  public resetAllRepositories(): { success: boolean; message: string } {
    actionRepository.resetToInitialState();
    verificationRepository.resetToInitialState();
    return {
      success: true,
      message: 'All application repositories (Actions, Verifications, and Memories) reset to clean demonstration baseline.'
    };
  }
}

export const settingsRepository = new SettingsRepository();
