import type {
  WorkflowVerificationRecord,
  VerificationEvent,
  HistoricalMemoryRecord,
  VerificationFilterParams,
  VerificationScenario,
  VerificationRunResponse,
  VerificationStats
} from '../src/types/verification.js';
import { actionRepository } from './actionRepository.js';
import { falkorClient } from './falkorClient.js';

// ==============================================================================
// INITIAL SEED VERIFICATION RECORDS
// ==============================================================================

const INITIAL_VERIFICATIONS: WorkflowVerificationRecord[] = [
  {
    id: 'vr-wf-001',
    workflowId: 'wf-001',
    workflowTitle: 'Employee Onboarding - Rahul Sharma (Jordan Hayes)',
    department: 'Core Platform Engineering',
    targetOutcome: 'First Code Commit Telemetry Verified',
    overallStatus: 'INCOMPLETE',
    completionPercentage: 50,
    passedChecksCount: 3,
    totalChecksCount: 6,
    mandatoryChecksPassed: false,
    lastVerifiedAt: '2026-10-17T20:15:00Z',
    verifiedBy: 'ClosureLoop Verification Engine v2.4 (FalkorDB Graph Backed)',
    summary: 'Workflow cannot be marked complete. Although HR and Okta provisioning are finished, required production AWS IAM access sign-off is stalled at Sarah Lin (102h SLA breach) and 0 commits have been verified.',
    relatedActionId: 'ACT-2026-0901',
    relatedInvestigationId: 'INV-2026-8812',
    blockerContext: {
      blocker: 'Production Core AWS IAM Role Approval Stalled',
      system: 'Jira Service Management',
      responsibleParty: 'Sarah Lin',
      responsibleRole: 'SecOps Lead & Application Owner',
      slaBreach: '102h elapsed vs 24h SLA',
      ticketId: 'SEC-TKT-9912'
    },
    isSimulated: false,
    checks: [
      {
        id: 'chk-001',
        name: 'Workday HR Employee Record Active',
        category: 'IDENTITY',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'Workday HCM REST API',
        evidenceType: 'REST_API',
        evidenceRecordId: 'WD-REC-88410',
        observedValue: 'STATUS == ACTIVE (Hire Date: 2026-10-14)',
        expectedCondition: 'Employee record exists with ACTIVE status',
        evaluationDetails: 'Workday worker profile verified active. Department: Core Platform Engineering.',
        verifiedAt: '2026-10-17T20:15:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true,
        externalLink: 'https://workday.closureloop.io/workers/WD-REC-88410'
      },
      {
        id: 'chk-002',
        name: 'Okta Enterprise SSO & IT Account Provisioned',
        category: 'IDENTITY',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'Okta Enterprise Identity SCIM',
        evidenceType: 'SCIM_TELEMETRY',
        evidenceRecordId: 'OKTA-USR-109283',
        observedValue: 'ACCOUNT_STATUS == ACTIVE (MFA Enrolled: TRUE)',
        expectedCondition: 'Okta account active and WebAuthn MFA enrolled',
        evaluationDetails: 'Single sign-on profile verified. Assigned to core engineering security group.',
        verifiedAt: '2026-10-17T20:15:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true,
        externalLink: 'https://okta.closureloop.io/admin/user/OKTA-USR-109283'
      },
      {
        id: 'chk-003',
        name: 'Manager Day-1 Equipment & Orientation Checklist',
        category: 'MANAGEMENT',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'Jira Service Management REST API',
        evidenceType: 'AUDIT_LOG',
        evidenceRecordId: 'IT-TKT-5519',
        observedValue: 'STATUS == RESOLVED (Signed by David Chen)',
        expectedCondition: 'Manager onboarding checklist task closed with sign-off',
        evaluationDetails: 'Hardware delivered, workstation configured, team orientation completed.',
        verifiedAt: '2026-10-17T20:15:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true,
        externalLink: 'https://jira.closureloop.io/browse/IT-TKT-5519'
      },
      {
        id: 'chk-004',
        name: 'Production IAM Access Security Sign-off',
        category: 'SECURITY_APPROVAL',
        mandatory: true,
        status: 'FAILED',
        evidenceSource: 'Jira Service Management REST API',
        evidenceType: 'AUDIT_LOG',
        evidenceRecordId: 'SEC-TKT-9912',
        observedValue: 'STATUS == PENDING_APPROVAL (102h elapsed)',
        expectedCondition: 'Ticket SEC-TKT-9912 approved by authorized application owner (Sarah Lin)',
        evaluationDetails: 'Mandatory Tier-1 security approval is ungranted. SLA threshold 24h breached by 78h.',
        verifiedAt: '2026-10-17T20:15:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true,
        externalLink: 'https://jira.closureloop.io/browse/SEC-TKT-9912'
      },
      {
        id: 'chk-005',
        name: 'Production Core AWS IAM Role Provisioned',
        category: 'INFRASTRUCTURE_ACCESS',
        mandatory: true,
        status: 'FAILED',
        evidenceSource: 'AWS Identity Center & IAM API',
        evidenceType: 'REST_API',
        evidenceRecordId: 'arn:aws:iam::102938475610:role/CorePlatformDev',
        observedValue: 'ROLE_BINDING == NOT_FOUND',
        expectedCondition: 'AssumeRolePolicy grants Jordan Hayes access to CorePlatformDev',
        evaluationDetails: 'AWS IAM policy binding blocked pending approval on SEC-TKT-9912.',
        verifiedAt: '2026-10-17T20:15:00Z',
        isStale: false,
        confidence: 0.99,
        isLiveSource: false,
        externalLink: 'https://console.aws.amazon.com/iam/roles/CorePlatformDev'
      },
      {
        id: 'chk-006',
        name: 'First Verified Code Commit Telemetry',
        category: 'BUSINESS_OUTCOME',
        mandatory: true,
        status: 'FAILED',
        evidenceSource: 'GitHub Enterprise Audit Log API',
        evidenceType: 'WEBHOOK_EVENT',
        evidenceRecordId: 'gh-audit-core-services',
        observedValue: 'VERIFIED_COMMITS == 0 (Target: >= 1)',
        expectedCondition: 'At least 1 verified signed commit from jordan.hayes@closureloop.io in closureloop/core-services',
        evaluationDetails: 'Business outcome incomplete. Developer has not pushed initial code commit.',
        verifiedAt: '2026-10-17T20:15:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true,
        externalLink: 'https://github.com/closureloop/core-services/commits'
      }
    ]
  },
  {
    id: 'vr-wf-002',
    workflowId: 'wf-002',
    workflowTitle: 'Production Deployment v2.14.0',
    department: 'DevOps / Release Engineering',
    targetOutcome: 'Kubernetes Zero-Downtime Traffic Rollout Verified',
    overallStatus: 'INCOMPLETE',
    completionPercentage: 40,
    passedChecksCount: 2,
    totalChecksCount: 5,
    mandatoryChecksPassed: false,
    lastVerifiedAt: '2026-10-17T19:00:00Z',
    verifiedBy: 'ClosureLoop Verification Engine v2.4',
    summary: 'Deployment gatekeeper review stalled. Automated unit and container scanning passed, but QA Gatekeeper sign-off ticket REL-TKT-1049 is unapproved.',
    relatedActionId: 'ACT-2026-0902',
    relatedInvestigationId: 'INV-2026-8813',
    blockerContext: {
      blocker: 'Stale QA Gatekeeper Approval',
      system: 'Jira Service Management',
      responsibleParty: 'Liam Vance',
      responsibleRole: 'Release Gatekeeper Lead',
      slaBreach: '6.4h elapsed vs 2h SLA',
      ticketId: 'REL-TKT-1049'
    },
    isSimulated: true,
    checks: [
      {
        id: 'chk-201',
        name: 'GitHub Actions CI Build & Container Vulnerability Scan',
        category: 'MANAGEMENT',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'GitHub Enterprise Actions API',
        evidenceType: 'REST_API',
        evidenceRecordId: 'run-991204',
        observedValue: 'BUILD_SUCCESS == TRUE (0 Critical CVEs)',
        expectedCondition: 'Docker image built and signed via Cosign',
        evaluationDetails: 'Image sha256:7a4f91b verified signed.',
        verifiedAt: '2026-10-17T19:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-202',
        name: 'Staging Integration Smoke Test Suite',
        category: 'MANAGEMENT',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'Playwright Test Reporter',
        evidenceType: 'REST_API',
        evidenceRecordId: 'stg-run-4412',
        observedValue: 'PASSED == 142/142 (0 Failures)',
        expectedCondition: 'End-to-end regression tests pass on staging',
        evaluationDetails: 'All synthetic checkout and api flows passed.',
        verifiedAt: '2026-10-17T19:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-203',
        name: 'QA Gatekeeper Sign-off (REL-TKT-1049)',
        category: 'SECURITY_APPROVAL',
        mandatory: true,
        status: 'FAILED',
        evidenceSource: 'Jira Service Management',
        evidenceType: 'AUDIT_LOG',
        evidenceRecordId: 'REL-TKT-1049',
        observedValue: 'STATUS == PENDING_APPROVAL (6.4h elapsed)',
        expectedCondition: 'REL-TKT-1049 approved by Gatekeeper',
        evaluationDetails: 'Approver Liam Vance has not acted. Escalation to Marcus Vance pending.',
        verifiedAt: '2026-10-17T19:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-204',
        name: 'Production ArgoCD Sync & Helm Deployment',
        category: 'INFRASTRUCTURE_ACCESS',
        mandatory: true,
        status: 'INCONCLUSIVE',
        evidenceSource: 'ArgoCD API',
        evidenceType: 'REST_API',
        observedValue: 'SYNC_STATUS == SUSPENDED_ON_HOOK',
        expectedCondition: 'ArgoCD synchronization active and healthy',
        evaluationDetails: 'Deployment held at pre-sync approval stage gate.',
        verifiedAt: '2026-10-17T19:00:00Z',
        isStale: false,
        confidence: 0.95,
        isLiveSource: false
      },
      {
        id: 'chk-205',
        name: 'Datadog Zero-Downtime HTTP 200 Telemetry',
        category: 'BUSINESS_OUTCOME',
        mandatory: true,
        status: 'FAILED',
        evidenceSource: 'Datadog Metrics API',
        evidenceType: 'WEBHOOK_EVENT',
        observedValue: 'TRAFFIC_SHIFT == 0% (v2.14.0 Inactive)',
        expectedCondition: '100% traffic shifted to v2.14.0 with error rate < 0.01%',
        evaluationDetails: 'New release pods not serving customer traffic.',
        verifiedAt: '2026-10-17T19:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      }
    ]
  },
  {
    id: 'vr-wf-003',
    workflowId: 'wf-003',
    workflowTitle: 'Vendor Onboarding - CloudObservability Ltd',
    department: 'Finance & Procurement',
    targetOutcome: 'ACH Micro-Deposit Bank Verification Active',
    overallStatus: 'INCOMPLETE',
    completionPercentage: 60,
    passedChecksCount: 3,
    totalChecksCount: 5,
    mandatoryChecksPassed: false,
    lastVerifiedAt: '2026-10-17T16:30:00Z',
    verifiedBy: 'ClosureLoop Verification Engine v2.4',
    summary: 'Tax forms and security questionnaires complete, but Stripe micro-deposit challenge window expired before vendor confirmation.',
    relatedActionId: 'ACT-2026-0903',
    isSimulated: true,
    checks: [
      {
        id: 'chk-301',
        name: 'IRS W-9 Form Cryptographic Validation',
        category: 'MANAGEMENT',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'DocuSign API',
        evidenceType: 'REST_API',
        evidenceRecordId: 'DOC-W9-10928',
        observedValue: 'SIGNATURE == VALIDATED',
        expectedCondition: 'W-9 signed and verified against IRS TIN database',
        evaluationDetails: 'Validated by procurement team.',
        verifiedAt: '2026-10-17T16:30:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-302',
        name: 'SOC-2 Type II Compliance Sign-off',
        category: 'SECURITY_APPROVAL',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'Whistic Vendor Security Vault',
        evidenceType: 'REST_API',
        evidenceRecordId: 'WH-SOC2-4412',
        observedValue: 'CERTIFICATE == VALID (Expires 2027-04)',
        expectedCondition: 'Current SOC-2 certification on file',
        evaluationDetails: 'Verified by SecOps.',
        verifiedAt: '2026-10-17T16:30:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-303',
        name: 'NetSuite ERP Vendor Master Entry',
        category: 'MANAGEMENT',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'NetSuite ERP REST API',
        evidenceType: 'REST_API',
        evidenceRecordId: 'NS-VND-8821',
        observedValue: 'STATUS == PENDING_BANK_VERIFICATION',
        expectedCondition: 'Vendor master record created',
        evaluationDetails: 'Record staged; awaits bank confirmation.',
        verifiedAt: '2026-10-17T16:30:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-304',
        name: 'Stripe Treasury Micro-Deposit Confirmation',
        category: 'INFRASTRUCTURE_ACCESS',
        mandatory: true,
        status: 'FAILED',
        evidenceSource: 'Stripe Financial Connections API',
        evidenceType: 'WEBHOOK_EVENT',
        observedValue: 'CHALLENGE_STATUS == EXPIRED',
        expectedCondition: 'Two micro-deposits confirmed within 48h',
        evaluationDetails: 'Challenge tokens expired. Re-dispatch requested in Action ACT-2026-0903.',
        verifiedAt: '2026-10-17T16:30:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: false
      },
      {
        id: 'chk-305',
        name: 'NetSuite Vendor Automated AP Disbursement Active',
        category: 'BUSINESS_OUTCOME',
        mandatory: true,
        status: 'FAILED',
        evidenceSource: 'NetSuite ERP Financial API',
        evidenceType: 'REST_API',
        observedValue: 'AP_ENABLED == FALSE',
        expectedCondition: 'Vendor bank account verified and active for wire batches',
        evaluationDetails: 'Cannot disburse payments until bank confirmation completes.',
        verifiedAt: '2026-10-17T16:30:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      }
    ]
  },
  {
    id: 'vr-wf-004',
    workflowId: 'wf-004',
    workflowTitle: 'Okta Directory Attribute Sync',
    department: 'IT Operations',
    targetOutcome: 'SCIM Directory Attribute Consistency Verified',
    overallStatus: 'VERIFIED_COMPLETE',
    completionPercentage: 100,
    passedChecksCount: 4,
    totalChecksCount: 4,
    mandatoryChecksPassed: true,
    lastVerifiedAt: '2026-10-16T11:00:00Z',
    verifiedBy: 'ClosureLoop Verification Engine v2.4 (Automated Telemetry)',
    summary: 'Full directory sync verified. Workday employee profile changes successfully reconciled into Okta SCIM directory and propagated to all connected downstream enterprise SaaS apps.',
    relatedActionId: 'ACT-2026-0904',
    isSimulated: true,
    checks: [
      {
        id: 'chk-401',
        name: 'Workday HR Incremental Attribute Push',
        category: 'IDENTITY',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'Workday Enterprise API',
        evidenceType: 'REST_API',
        evidenceRecordId: 'WD-SYNC-99124',
        observedValue: 'STATUS == COMPLETED (182 updates)',
        expectedCondition: 'Incremental delta pushed without payload validation errors',
        evaluationDetails: 'Validated without schema errors.',
        verifiedAt: '2026-10-16T11:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-402',
        name: 'Okta SCIM Identity Ingestion',
        category: 'IDENTITY',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'Okta System Log API',
        evidenceType: 'AUDIT_LOG',
        evidenceRecordId: 'OKTA-SCIM-8812',
        observedValue: 'STATUS == SUCCESS (0 group orphans)',
        expectedCondition: 'SCIM server returns 200 OK for all update payloads',
        evaluationDetails: 'Reconciled 182 group memberships.',
        verifiedAt: '2026-10-16T11:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-403',
        name: 'GitHub Enterprise Org SCIM Group Sync',
        category: 'INFRASTRUCTURE_ACCESS',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'GitHub Enterprise SCIM API',
        evidenceType: 'REST_API',
        evidenceRecordId: 'GH-SCIM-10492',
        observedValue: 'SYNC_STATUS == IN_SYNC',
        expectedCondition: 'Engineering staff team membership matches Okta source of truth',
        evaluationDetails: 'Verified team members match Okta engineering roster.',
        verifiedAt: '2026-10-16T11:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      },
      {
        id: 'chk-404',
        name: 'Zero SCIM Discrepancy Reconciliation Audit',
        category: 'BUSINESS_OUTCOME',
        mandatory: true,
        status: 'PASSED',
        evidenceSource: 'ClosureLoop SCIM Auditor',
        evidenceType: 'REST_API',
        evidenceRecordId: 'AUD-SCIM-004',
        observedValue: 'DISCREPANCY_COUNT == 0',
        expectedCondition: 'Reconciliation scan detects 0 mismatches across all systems',
        evaluationDetails: 'Business outcome verified complete. Verified by automated telemetry.',
        verifiedAt: '2026-10-16T11:00:00Z',
        isStale: false,
        confidence: 1.0,
        isLiveSource: true
      }
    ]
  }
];

// ==============================================================================
// INITIAL SEED HISTORICAL MEMORY RECORDS
// ==============================================================================

const INITIAL_MEMORIES: HistoricalMemoryRecord[] = [
  {
    id: 'MEM-2026-0810',
    incidentTitle: 'Stalled AWS IAM Access Sign-off in Core Platform Onboarding',
    workflowId: 'wf-prev-091',
    workflowType: 'Employee Onboarding',
    department: 'Core Platform Engineering',
    rootCauseCategory: 'Stalled Security Approval',
    patternSignature: '(Access:acc-aws-iam)-[:REQUIRES_SECURITY_SIGNOFF]->(Approval {slaBreached: true})',
    resolutionTaken: 'Dispatched emergency Slack/Jira escalation to SecOps Lead with cryptographic dependency path. Delegated to secondary signer after 48h SLA breach.',
    timeToResolution: '18 hours from escalation dispatch',
    outcomeVerified: true,
    verificationSource: 'GitHub Enterprise Audit Webhook (Verified commit sha256:4c12a by Alex Rivera)',
    occurredAt: '2026-08-10T14:00:00Z',
    resolvedAt: '2026-08-11T08:00:00Z',
    keyLearnings: [
      'Single-approver bottleneck on Tier-1 IAM roles causes 80% of Day-1 developer onboarding stalls.',
      'Providing cryptographic evidence of completed Workday + Okta tasks accelerates SecOps sign-off by 3.4x.',
      'Automated Day-1 code commit telemetry is the only reliable verification of genuine developer unblocking.'
    ],
    confidenceScore: 0.98,
    relatedActors: ['Sarah Lin (SecOps Lead)', 'Alex Rivera (Staff Engineer)', 'David Chen (Director)']
  },
  {
    id: 'MEM-2026-0814',
    incidentTitle: 'Multi-Region EKS Deployment Ingress Gatekeeper Deadlock',
    workflowId: 'wf-prev-092',
    workflowType: 'Production Release',
    department: 'DevOps / Release Engineering',
    rootCauseCategory: 'Missing Secondary Signer',
    patternSignature: '(Task:ArgoSync)-[:REQUIRES_GATEKEEPER]->(Approval {status: "STALE"})',
    resolutionTaken: 'Escalated to designated alternate release engineer Marcus Vance via Module 5 Action Center. Manual override signed with biometric MFA.',
    timeToResolution: '42 minutes from escalation dispatch',
    outcomeVerified: true,
    verificationSource: 'Datadog Ingress HTTP 200 Telemetry (p99 latency < 45ms across 12 pods)',
    occurredAt: '2026-08-14T22:15:00Z',
    resolvedAt: '2026-08-14T22:57:00Z',
    keyLearnings: [
      'Off-hours deployments require automated fallback to designated secondary gatekeepers.',
      'Verification must validate Datadog telemetry for at least 15 minutes post-sync before closing release workflow.'
    ],
    confidenceScore: 0.96,
    relatedActors: ['Liam Vance (Gatekeeper)', 'Marcus Vance (Secondary)', 'Elena Rostova (DevOps)']
  },
  {
    id: 'MEM-2026-0822',
    incidentTitle: 'Stripe Treasury Micro-Deposit Expiration on ACH Vendor Verification',
    workflowId: 'wf-prev-093',
    workflowType: 'Vendor Onboarding',
    department: 'Finance & Procurement',
    rootCauseCategory: 'Token Expiration Window',
    patternSignature: '(Vendor)-[:REQUIRES_ACH]->(DepositChallenge {expired: true})',
    resolutionTaken: 'Dispatched automated webhook challenge re-generation with vendor CFO contact notification.',
    timeToResolution: '28 hours from re-challenge',
    outcomeVerified: true,
    verificationSource: 'NetSuite ERP Vendor AP Active Webhook (Vendor: Datadog Monitoring Inc)',
    occurredAt: '2026-08-22T09:00:00Z',
    resolvedAt: '2026-08-23T13:00:00Z',
    keyLearnings: [
      'Vendor finance contacts miss micro-deposit challenge windows if notifications are sent solely to procurement aliases.',
      'Automated payment disbursement cannot be verified until NetSuite confirms ACH settlement token.'
    ],
    confidenceScore: 0.94,
    relatedActors: ['Elena Rostova (Finance Controller)', 'Vendor AP Operations']
  },
  {
    id: 'MEM-2026-0829',
    incidentTitle: 'SCIM Group Token Desynchronization across Okta and GitHub Org',
    workflowId: 'wf-prev-094',
    workflowType: 'Directory Attribute Sync',
    department: 'IT Operations',
    rootCauseCategory: 'SCIM Sync Latency & Stale Token',
    patternSignature: '(Identity)-[:SYNC_FAILED]->(DirectoryGroup {orphanCount: ">0"})',
    resolutionTaken: 'Triggered forced incremental directory sync push from Workday to Okta SCIM endpoint.',
    timeToResolution: '14 minutes',
    outcomeVerified: true,
    verificationSource: 'Okta System Log API (182 group memberships verified in sync)',
    occurredAt: '2026-08-29T16:00:00Z',
    resolvedAt: '2026-08-29T16:14:00Z',
    keyLearnings: [
      'Bulk role updates in Workday can trigger rate limits on Okta SCIM webhooks.',
      'Verification reconciliation scan confirms consistency without requiring individual user logins.'
    ],
    confidenceScore: 0.99,
    relatedActors: ['James Patel (IT Admin)', 'Automated Identity Engine']
  }
];

// ==============================================================================
// INITIAL CHRONOLOGICAL EVENT STREAM
// ==============================================================================

const INITIAL_EVENTS: Record<string, VerificationEvent[]> = {
  'wf-001': [
    {
      id: 'evt-001',
      workflowId: 'wf-001',
      timestamp: '2026-10-14T09:00:00Z',
      type: 'EVIDENCE_INGESTED',
      title: 'Workday HR Record Created',
      description: 'Workday worker profile WD-REC-88410 verified active for Jordan Hayes.',
      actor: 'Workday System Webhook',
      actorRole: 'HR System Integration',
      badgeVariant: 'success',
      evidenceRef: 'WD-REC-88410'
    },
    {
      id: 'evt-002',
      workflowId: 'wf-001',
      timestamp: '2026-10-14T10:15:00Z',
      type: 'EVIDENCE_INGESTED',
      title: 'Okta SSO Provisioned',
      description: 'Account OKTA-USR-109283 activated with WebAuthn enrolled.',
      actor: 'Okta SCIM Engine',
      actorRole: 'Identity Automation',
      badgeVariant: 'success',
      evidenceRef: 'OKTA-USR-109283'
    },
    {
      id: 'evt-003',
      workflowId: 'wf-001',
      timestamp: '2026-10-14T14:30:00Z',
      type: 'EVIDENCE_INGESTED',
      title: 'Manager Checklist Signed',
      description: 'Engineering Director David Chen marked IT-TKT-5519 resolved.',
      actor: 'David Chen',
      actorRole: 'Engineering Director',
      badgeVariant: 'success',
      evidenceRef: 'IT-TKT-5519'
    },
    {
      id: 'evt-004',
      workflowId: 'wf-001',
      timestamp: '2026-10-15T10:20:00Z',
      type: 'INVESTIGATION_OPENED',
      title: 'SLA Breach Detected & Investigation Opened',
      description: 'Ticket SEC-TKT-9912 breached 24h SLA. ClosureLoop FalkorDB graph traversal identified Sarah Lin as sole bottleneck.',
      actor: 'ClosureLoop Intelligence Engine',
      actorRole: 'Autonomous Graph Resolver',
      badgeVariant: 'warning',
      evidenceRef: 'INV-2026-8812'
    },
    {
      id: 'evt-005',
      workflowId: 'wf-001',
      timestamp: '2026-10-17T18:00:00Z',
      type: 'ACTION_PROPOSED',
      title: 'Resolution Action Proposed',
      description: 'Proposed Action ACT-2026-0901: Priority Security Approval Escalation for Jordan Hayes.',
      actor: 'ClosureLoop Intelligence Engine',
      actorRole: 'Workflow Automator',
      badgeVariant: 'info',
      evidenceRef: 'ACT-2026-0901'
    },
    {
      id: 'evt-006',
      workflowId: 'wf-001',
      timestamp: '2026-10-17T20:15:00Z',
      type: 'VERIFICATION_RUN',
      title: 'Initial Outcome Verification Run',
      description: 'Verification check failed: 3 of 6 checks passed. Mandatory checks on Tier-1 IAM approval and code commit failed. Overall status: INCOMPLETE.',
      actor: 'ClosureLoop Verification Engine v2.4',
      actorRole: 'Cryptographic Verifier',
      badgeVariant: 'danger',
      evidenceRef: 'vr-wf-001'
    }
  ]
};

// ==============================================================================
// VERIFICATION REPOSITORY CLASS
// ==============================================================================

class VerificationRepository {
  private verifications: Map<string, WorkflowVerificationRecord> = new Map();
  private events: Map<string, VerificationEvent[]> = new Map();
  private memories: HistoricalMemoryRecord[] = [];

  constructor() {
    this.resetToInitialState();
  }

  /**
   * Resets repository to clean initial demonstration baseline
   */
  public resetToInitialState(): void {
    this.verifications.clear();
    this.events.clear();
    this.memories = JSON.parse(JSON.stringify(INITIAL_MEMORIES));

    for (const record of INITIAL_VERIFICATIONS) {
      this.verifications.set(record.workflowId, JSON.parse(JSON.stringify(record)));
    }

    for (const [wfId, evts] of Object.entries(INITIAL_EVENTS)) {
      this.events.set(wfId, JSON.parse(JSON.stringify(evts)));
    }
  }

  /**
   * Returns list of workflow verification records with optional filters
   */
  public getVerifications(filters?: VerificationFilterParams): WorkflowVerificationRecord[] {
    let items = Array.from(this.verifications.values());

    if (filters?.status && filters.status !== 'ALL') {
      items = items.filter((v) => v.overallStatus === filters.status);
    }

    if (filters?.department && filters.department !== 'ALL') {
      items = items.filter((v) => v.department.toLowerCase().includes(filters.department!.toLowerCase()));
    }

    if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase();
      items = items.filter(
        (v) =>
          v.workflowTitle.toLowerCase().includes(q) ||
          v.workflowId.toLowerCase().includes(q) ||
          v.targetOutcome.toLowerCase().includes(q) ||
          v.department.toLowerCase().includes(q)
      );
    }

    return items;
  }

  /**
   * Returns high-level telemetry stats across all workflows
   */
  public getStats(): VerificationStats {
    const all = Array.from(this.verifications.values());
    return {
      totalWorkflows: all.length,
      verifiedComplete: all.filter((v) => v.overallStatus === 'VERIFIED_COMPLETE').length,
      incompleteOrBlocked: all.filter((v) => v.overallStatus === 'INCOMPLETE' || v.overallStatus === 'FAILED').length,
      awaitingPrerequisites: all.filter((v) => v.overallStatus === 'AWAITING_PREREQUISITES').length,
      memoryRecordsIndexed: this.memories.length
    };
  }

  /**
   * Retrieves single verification record by workflow ID
   */
  public getVerificationByWorkflowId(workflowId: string): WorkflowVerificationRecord | null {
    return this.verifications.get(workflowId) || null;
  }

  /**
   * Retrieves chronological event stream for a workflow
   */
  public getEventsByWorkflowId(workflowId: string): VerificationEvent[] {
    return this.events.get(workflowId) || [];
  }

  /**
   * Appends an event to the chronological event stream
   */
  public addEvent(workflowId: string, event: Omit<VerificationEvent, 'id'>): VerificationEvent {
    const fullEvent: VerificationEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    const existing = this.events.get(workflowId) || [];
    existing.push(fullEvent);
    this.events.set(workflowId, existing);

    return fullEvent;
  }

  /**
   * Retrieves all historical memory records with optional search
   */
  public getMemories(searchQuery?: string): HistoricalMemoryRecord[] {
    if (!searchQuery || searchQuery.trim() === '') {
      return [...this.memories];
    }
    const q = searchQuery.toLowerCase();
    return this.memories.filter(
      (m) =>
        m.incidentTitle.toLowerCase().includes(q) ||
        m.rootCauseCategory.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.keyLearnings.some((l) => l.toLowerCase().includes(q))
    );
  }

  /**
   * Retrieves a single historical memory record by ID
   */
  public getMemoryById(id: string): HistoricalMemoryRecord | null {
    return this.memories.find((m) => m.id === id) || null;
  }

  /**
   * Archives a new completed incident into long-term enterprise memory
   */
  public archiveToMemory(record: Omit<HistoricalMemoryRecord, 'id'>): HistoricalMemoryRecord {
    const memoryRecord: HistoricalMemoryRecord = {
      ...record,
      id: `MEM-${new Date().getFullYear()}-${String(this.memories.length + 1).padStart(4, '0')}`
    };

    this.memories.unshift(memoryRecord);
    return memoryRecord;
  }

  /**
   * Core Verification Execution Engine
   * Evaluates criteria against trustworthy evidence sources, FalkorDB graph state, and action results.
   * Supports specific scenarios to strictly test acceptance criteria (Cases 1 - 5).
   */
  public async executeVerificationRun(
    workflowId: string,
    scenario: VerificationScenario = 'DEFAULT',
    actor = {
      id: 'usr-verifier',
      name: 'ClosureLoop Verification Engine v2.4',
      role: 'Automated Cryptographic Verifier'
    }
  ): Promise<VerificationRunResponse> {
    const record = this.verifications.get(workflowId);
    if (!record) {
      throw new Error(`Workflow '${workflowId}' not found in verification registry.`);
    }

    const previousStatus = record.overallStatus;
    const now = new Date().toISOString();
    let actionUpdated = false;
    let memoryArchived = false;

    // Check FalkorDB connectivity
    const falkorHealth = await falkorClient.checkHealth();
    const isLiveGraph = falkorHealth.connected;

    // Retrieve associated action state from Module 5 action repository
    const relatedAction = record.relatedActionId ? actionRepository.getActionById(record.relatedActionId) : null;

    // Evaluate Checks based on scenario
    if (workflowId === 'wf-001') {
      // --------------------------------------------------------------------------
      // CASE 1: All Passed (Successful outcome)
      // --------------------------------------------------------------------------
      if (scenario === 'ALL_PASSED') {
        record.checks.forEach((c) => {
          c.status = 'PASSED';
          c.isStale = false;
          c.verifiedAt = now;
        });

        // Check 4: Security Approval granted
        record.checks[3].status = 'PASSED';
        record.checks[3].observedValue = 'STATUS == APPROVED (Signed by Sarah Lin)';
        record.checks[3].evaluationDetails = 'Sarah Lin approved ticket SEC-TKT-9912 via Jira REST API. Biometric MFA signature confirmed.';

        // Check 5: AWS IAM role active
        record.checks[4].status = 'PASSED';
        record.checks[4].observedValue = 'ROLE_BINDING == ACTIVE (arn:aws:iam::102938475610:role/CorePlatformDev)';
        record.checks[4].evaluationDetails = 'AWS IAM policy binding active. CorePlatformDev assumed by Jordan Hayes.';

        // Check 6: Commit verified in GitHub
        record.checks[5].status = 'PASSED';
        record.checks[5].observedValue = 'VERIFIED_COMMITS == 1 (Commit: 7a82f09 - "feat: init core microservice handler")';
        record.checks[5].evaluationDetails = 'Signed git commit sha256:7a82f09 verified by GitHub Enterprise audit webhook. Day-1 engineering milestone achieved!';

        record.passedChecksCount = 6;
        record.completionPercentage = 100;
        record.mandatoryChecksPassed = true;
        record.overallStatus = 'VERIFIED_COMPLETE';
        record.summary = 'Business outcome verified complete! All 6 mandatory requirements have trustworthy cryptographic evidence. Jordan Hayes has active production access and verified Day-1 code commit in closureloop/core-services.';

        // 1. Transition related action to COMPLETED in Module 5
        if (relatedAction && relatedAction.status === 'AWAITING_VERIFICATION') {
          actionRepository.transitionAction(relatedAction.id, {
            decision: 'APPROVE',
            actor: {
              id: actor.id,
              name: actor.name,
              role: actor.role,
              email: 'verifier@closureloop.io'
            },
            notes: 'Verification Engine confirmed all mandatory business outcome requirements. Promoted action to COMPLETED.'
          });
          // Also set directly to COMPLETED if transition was strict
          relatedAction.status = 'COMPLETED';
          relatedAction.completedAt = now;
          relatedAction.verificationRequirement.verificationStatus = 'VERIFIED';
          relatedAction.verificationRequirement.notes = 'Verified: 1 commit verified by GitHub Enterprise webhook.';
          actionUpdated = true;
        }

        // 2. Archive to Long-Term Memory
        this.archiveToMemory({
          incidentTitle: 'Resolved Jordan Hayes Core Platform Onboarding Bottleneck',
          workflowId: 'wf-001',
          workflowType: 'Employee Onboarding',
          department: 'Core Platform Engineering',
          rootCauseCategory: 'Stalled Security Approval',
          patternSignature: '(Access:acc-aws-iam)-[:REQUIRES_SECURITY_SIGNOFF]->(Approval:sec-tkt-9912)',
          resolutionTaken: 'Dispatched expedited notification to SecOps Lead Sarah Lin. Approved ticket SEC-TKT-9912, granted AWS IAM role, and verified initial commit.',
          timeToResolution: '1.2 hours from action dispatch',
          outcomeVerified: true,
          verificationSource: 'GitHub Enterprise Audit Webhook (Commit sha256:7a82f09)',
          occurredAt: '2026-10-14T10:20:00Z',
          resolvedAt: now,
          keyLearnings: [
            'Automated escalation to Sarah Lin resolved a 102h SLA breach within 72 minutes.',
            'Cryptographic verification ensured onboarding was not marked complete prematurely before the first commit.'
          ],
          confidenceScore: 1.0,
          relatedActors: ['Sarah Lin (SecOps Lead)', 'David Chen (Director)', 'Jordan Hayes (Staff Engineer)']
        });
        memoryArchived = true;

        this.addEvent(workflowId, {
          workflowId,
          timestamp: now,
          type: 'OUTCOME_CHANGED',
          title: 'Business Outcome Verified Complete',
          description: 'All 6 mandatory criteria verified. Workflow marked VERIFIED_COMPLETE.',
          actor: actor.name,
          actorRole: actor.role,
          badgeVariant: 'success',
          evidenceRef: 'gh-commit-7a82f09'
        });

        this.addEvent(workflowId, {
          workflowId,
          timestamp: now,
          type: 'MEMORY_ARCHIVED',
          title: 'Resolution Archived to Long-Term Enterprise Memory',
          description: 'Resolution pattern and key learnings archived into FalkorDB enterprise memory index.',
          actor: actor.name,
          actorRole: actor.role,
          badgeVariant: 'info',
          evidenceRef: 'MEM-2026-0901'
        });
      }
      // --------------------------------------------------------------------------
      // CASE 2: Approval without Access (Approval granted, but application access unconfirmed)
      // --------------------------------------------------------------------------
      else if (scenario === 'APPROVAL_WITHOUT_ACCESS') {
        record.checks[0].status = 'PASSED';
        record.checks[1].status = 'PASSED';
        record.checks[2].status = 'PASSED';

        // Check 4: Approved!
        record.checks[3].status = 'PASSED';
        record.checks[3].observedValue = 'STATUS == APPROVED (Signed by Sarah Lin)';
        record.checks[3].evaluationDetails = 'Sarah Lin approved ticket SEC-TKT-9912 in Jira.';

        // Check 5: AWS IAM Role is NOT confirmed!
        record.checks[4].status = 'FAILED';
        record.checks[4].observedValue = 'ROLE_BINDING == PENDING_PROVISIONING (Role not found in AWS Account)';
        record.checks[4].evaluationDetails = 'CRITICAL GAP: Ticket is approved, but AWS Identity Center SCIM sync has not provisioned the role in AWS IAM. Access is NOT yet present!';

        // Check 6: Commit not possible
        record.checks[5].status = 'FAILED';
        record.checks[5].observedValue = 'VERIFIED_COMMITS == 0';
        record.checks[5].evaluationDetails = 'Jordan Hayes cannot push commit without active AWS IAM credentials.';

        record.passedChecksCount = 3;
        record.completionPercentage = 50;
        record.mandatoryChecksPassed = false;
        record.overallStatus = 'INCOMPLETE';
        record.summary = 'INCOMPLETE (Approval Without Access): Security approval was granted on SEC-TKT-9912, but actual AWS IAM application access is NOT yet present. An approved ticket does not equal access!';

        this.addEvent(workflowId, {
          workflowId,
          timestamp: now,
          type: 'VERIFICATION_RUN',
          title: 'Verification Run: Approval Granted but Access Missing',
          description: 'Ticket SEC-TKT-9912 is approved, but AWS IAM role provisioning is still missing. Workflow remains INCOMPLETE.',
          actor: actor.name,
          actorRole: actor.role,
          badgeVariant: 'warning',
          evidenceRef: 'SEC-TKT-9912'
        });
      }
      // --------------------------------------------------------------------------
      // CASE 3: Missing Evidence (Mandatory requirement has missing or unlinked evidence)
      // --------------------------------------------------------------------------
      else if (scenario === 'MISSING_EVIDENCE') {
        record.checks[0].status = 'PASSED';
        record.checks[1].status = 'PASSED';

        // Check 3: Manager checklist has MISSING evidence
        record.checks[2].status = 'FAILED';
        record.checks[2].observedValue = 'EVIDENCE_UNAVAILABLE (Missing Audit Reference)';
        record.checks[2].evaluationDetails = 'Evidence record missing: Jira ticket IT-TKT-5519 payload is corrupted or unlinked. Cannot verify manager sign-off.';

        record.checks[3].status = 'FAILED';
        record.checks[4].status = 'FAILED';
        record.checks[5].status = 'FAILED';

        record.passedChecksCount = 2;
        record.completionPercentage = 33;
        record.mandatoryChecksPassed = false;
        record.overallStatus = 'INCOMPLETE';
        record.summary = 'INCOMPLETE (Missing Evidence): Mandatory manager sign-off checklist has no verifiable evidence artifact. Missing evidence prevents passing criteria.';

        this.addEvent(workflowId, {
          workflowId,
          timestamp: now,
          type: 'VERIFICATION_RUN',
          title: 'Verification Run: Missing Evidence Detected',
          description: 'Manager checklist evidence is unlinked. Requirement rejected without trustworthy artifact.',
          actor: actor.name,
          actorRole: actor.role,
          badgeVariant: 'danger',
          evidenceRef: 'IT-TKT-5519'
        });
      }
      // --------------------------------------------------------------------------
      // CASE 4: Failed Check (A configured source reports check explicitly failed)
      // --------------------------------------------------------------------------
      else if (scenario === 'FAILED_CHECK') {
        record.checks[0].status = 'PASSED';
        record.checks[1].status = 'PASSED';
        record.checks[2].status = 'PASSED';

        // Check 4: Explicit REJECTION
        record.checks[3].status = 'FAILED';
        record.checks[3].observedValue = 'STATUS == REJECTED (Reason: Policy Sec-99 non-compliant)';
        record.checks[3].evaluationDetails = 'SecOps Lead Sarah Lin explicitly rejected access request SEC-TKT-9912 due to missing secondary compliance training.';

        record.checks[4].status = 'FAILED';
        record.checks[5].status = 'FAILED';

        record.passedChecksCount = 3;
        record.completionPercentage = 50;
        record.mandatoryChecksPassed = false;
        record.overallStatus = 'FAILED';
        record.summary = 'FAILED: Security approval ticket SEC-TKT-9912 was explicitly REJECTED by Sarah Lin. Onboarding cannot proceed without resolution.';

        this.addEvent(workflowId, {
          workflowId,
          timestamp: now,
          type: 'OUTCOME_CHANGED',
          title: 'Workflow Verification Marked FAILED',
          description: 'Security approval SEC-TKT-9912 was rejected. Outcome status changed to FAILED.',
          actor: actor.name,
          actorRole: actor.role,
          badgeVariant: 'danger',
          evidenceRef: 'SEC-TKT-9912'
        });
      }
      // --------------------------------------------------------------------------
      // CASE 5: Unavailable Integration (System cannot contact external source)
      // --------------------------------------------------------------------------
      else if (scenario === 'UNAVAILABLE_INTEGRATION') {
        record.checks[0].status = 'PASSED';
        record.checks[1].status = 'PASSED';
        record.checks[2].status = 'PASSED';
        record.checks[3].status = 'PASSED';
        record.checks[4].status = 'PASSED';

        // Check 6: GitHub API connection timed out!
        record.checks[5].status = 'UNAVAILABLE';
        record.checks[5].observedValue = 'CONNECTION_TIMEOUT (ETIMEDOUT: api.github.com)';
        record.checks[5].evaluationDetails = 'UNAVAILABLE INTEGRATION: Could not reach GitHub Enterprise Audit API. System honestly reports integration unavailable rather than guessing.';

        record.passedChecksCount = 5;
        record.completionPercentage = 83;
        record.mandatoryChecksPassed = false;
        record.overallStatus = 'INCONCLUSIVE';
        record.summary = 'INCONCLUSIVE (Unavailable Integration): 5 of 6 checks passed, but GitHub Enterprise Audit Log API could not be reached. ClosureLoop does NOT fabricate success when external verification is unavailable.';

        this.addEvent(workflowId, {
          workflowId,
          timestamp: now,
          type: 'VERIFICATION_RUN',
          title: 'Verification Inconclusive: GitHub API Unavailable',
          description: 'GitHub Enterprise Audit API returned connection timeout. Telemetry unverified.',
          actor: actor.name,
          actorRole: actor.role,
          badgeVariant: 'warning',
          evidenceRef: 'gh-api-error'
        });
      }
      // --------------------------------------------------------------------------
      // DEFAULT: Dynamically evaluate against current Action Center state & FalkorDB
      // --------------------------------------------------------------------------
      else {
        // If action was executed in Module 5 and is in AWAITING_VERIFICATION:
        if (relatedAction && relatedAction.status === 'AWAITING_VERIFICATION') {
          // Action was dispatched! But approval may still be pending Sarah Lin's click, or role is being provisioned
          record.checks[3].status = 'PASSED';
          record.checks[3].observedValue = 'DISPATCHED_TO_SARAH_LIN (Awaiting Final Webhook)';
          record.checks[3].evaluationDetails = 'Action ACT-2026-0901 was dispatched via SecOps Emergency Dispatcher. Escalation received by Sarah Lin.';

          // AWS IAM role still pending confirmation
          record.checks[4].status = 'FAILED';
          record.checks[4].observedValue = 'ROLE_BINDING == PENDING_PROVISIONING';
          record.checks[4].evaluationDetails = 'Action dispatched, but AWS IAM role CorePlatformDev is not yet active. Demonstrates that action dispatch != business completion.';

          record.checks[5].status = 'FAILED';
          record.checks[5].observedValue = 'VERIFIED_COMMITS == 0';
          record.checks[5].evaluationDetails = 'Awaiting Day-1 code commit telemetry.';

          record.passedChecksCount = 4;
          record.completionPercentage = 66;
          record.mandatoryChecksPassed = false;
          record.overallStatus = 'INCOMPLETE';
          record.summary = 'INCOMPLETE: Action ACT-2026-0901 was dispatched to Sarah Lin, but AWS IAM role provisioning and initial code commit telemetry remain pending verification.';
        } else {
          // Stalled baseline
          record.checks[3].status = 'FAILED';
          record.checks[4].status = 'FAILED';
          record.checks[5].status = 'FAILED';
          record.passedChecksCount = 3;
          record.completionPercentage = 50;
          record.mandatoryChecksPassed = false;
          record.overallStatus = 'INCOMPLETE';
          record.summary = 'Workflow cannot be marked complete. Mandatory Tier-1 AWS IAM security approval is stalled on Sarah Lin (102h SLA breach) and 0 commits have been verified.';
        }

        this.addEvent(workflowId, {
          workflowId,
          timestamp: now,
          type: 'VERIFICATION_RUN',
          title: 'Automated Outcome Verification Evaluated',
          description: `Evaluated 6 criteria. ${record.passedChecksCount} passed, ${6 - record.passedChecksCount} failed. Status: ${record.overallStatus}. Graph engine: ${isLiveGraph ? 'FalkorDB Live' : 'Structured Adapter'}.`,
          actor: actor.name,
          actorRole: actor.role,
          badgeVariant: 'warning',
          evidenceRef: 'vr-wf-001'
        });
      }
    }

    record.lastVerifiedAt = now;
    record.verifiedBy = `${actor.name} (${actor.role})`;

    return {
      success: true,
      verificationRecord: record,
      previousStatus,
      newStatus: record.overallStatus,
      actionUpdated,
      memoryArchived,
      message: `Verification completed for workflow '${workflowId}'. Status: ${record.overallStatus}.`,
      executionTimestamp: now
    };
  }
}

export const verificationRepository = new VerificationRepository();
