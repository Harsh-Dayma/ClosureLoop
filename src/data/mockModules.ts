import type { NavModuleInfo } from '../types/navigation';

export const navigationModules: NavModuleInfo[] = [
  {
    id: 'overview',
    label: 'Overview',
    status: 'implemented',
    description: 'Executive dependency intelligence dashboard with high-priority blocked outcomes and next actions.',
    futureCapabilities: [
      'Multi-workflow dependency overlay',
      'Real-time FalkorDB query streaming',
      'Executive risk summary export'
    ]
  },
  {
    id: 'workflows',
    label: 'Workflows',
    badge: '14 Active',
    badgeVariant: 'primary',
    status: 'implemented',
    description: 'Comprehensive cross-system workflow registry with prerequisite dependency tracking, cryptographic verification criteria, and SLA status.',
    futureCapabilities: [
      'Multi-team workflow orchestration across Jira, ServiceNow, and Workday',
      'Custom outcome criteria and prerequisite definition editor',
      'Real-time dependency chain visualizer for any selected workflow',
      'Automatic stalled task escalation workflows'
    ],
    estimatedDelivery: 'Active'
  },
  {
    id: 'tasks',
    label: 'My Tasks',
    badge: '4 Pending',
    badgeVariant: 'warning',
    status: 'implemented',
    description: 'Action review queue and pending authorization decisions assigned to your role.',
    futureCapabilities: [
      'Multi-system automated Slack/Teams notification nudges to bottleneck owners',
      'One-click delegation to designated secondary signers',
      'Integration adapters for ServiceNow, Jira, Okta, and Stripe Treasury'
    ],
    estimatedDelivery: 'Active'
  },
  {
    id: 'history',
    label: 'History',
    status: 'implemented',
    description: 'Chronological audit history, cryptographic outcome verification ledger, and enterprise graph memory.',
    futureCapabilities: [
      'FalkorDB historical graph memory linking past incidents to current workflows',
      'Cryptographic outcome verification log certifying true business completion',
      'Semantic pattern discovery across historical recurring bottlenecks'
    ],
    estimatedDelivery: 'Active'
  }
];
