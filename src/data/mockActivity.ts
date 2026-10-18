import type { ActivityEvent } from '../types/workflow';

/**
 * Illustrative Recent Activity Feed
 * Clearly labeled as sample events to illustrate ClosureLoop's dependency tracing and verification lifecycle.
 */
export const sampleActivityFeed: ActivityEvent[] = [
  {
    id: 'act-001',
    type: 'prerequisite_identified',
    title: 'Missing prerequisite discovered',
    description: 'Graph dependency traversal identified missing IAM policy approval blocking Employee Onboarding',
    timestamp: '14m ago',
    workflowId: 'wf-001',
    workflowTitle: 'Employee onboarding incomplete',
    author: 'ClosureLoop Dependency Engine'
  },
  {
    id: 'act-002',
    type: 'owner_assigned',
    title: 'Responsible owner mapped',
    description: 'Matched unresolved Security Approval node to Sarah Lin (SecOps Lead) via FalkorDB org graph',
    timestamp: '42m ago',
    workflowId: 'wf-001',
    workflowTitle: 'Employee onboarding incomplete',
    author: 'Relationship Indexer'
  },
  {
    id: 'act-003',
    type: 'moved_to_verification',
    title: 'Workflow moved to verification',
    description: 'Cloud Migration Phase 2 all checklist items checked; dispatched telemetry listener to verify uptime',
    timestamp: '2h ago',
    workflowId: 'wf-008',
    workflowTitle: 'Cloud Migration Phase 2',
    author: 'Alex Morgan'
  },
  {
    id: 'act-004',
    type: 'outcome_confirmed',
    title: 'Business outcome verified',
    description: 'SOC-2 Access Recertification verified: 142 entitlements checked against live Okta audit log',
    timestamp: '3h ago',
    workflowId: 'wf-012',
    workflowTitle: 'Quarterly Access Recertification',
    author: 'Verification Engine'
  },
  {
    id: 'act-005',
    type: 'blocker_detected',
    title: 'Overdue sign-off flagged',
    description: 'Engineering release cutoff breached by 18 hours without QA lead green check',
    timestamp: '5h ago',
    workflowId: 'wf-003',
    workflowTitle: 'Release approval overdue',
    author: 'SLA Monitor'
  }
];
