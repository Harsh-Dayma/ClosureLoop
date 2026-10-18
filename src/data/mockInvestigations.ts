import type { InvestigationCase } from '../types/investigation';

/**
 * Demo Investigation Dataset
 * Explicitly isolated demo adapter data representing multi-hop dependency investigations.
 * 
 * Note: When a real FalkorDB backend is connected, the InvestigationService will execute
 * live OpenCypher graph traversals against the FalkorDB instance instead of returning this adapter.
 */
export const mockInvestigationCases: InvestigationCase[] = [
  {
    id: 'INV-2026-8812',
    workflowId: 'wf-001',
    workflowTitle: 'Employee Onboarding: Jordan Hayes (Staff Engineer)',
    department: 'HR Operations',
    status: 'ROOT_CAUSE_CONFIRMED',
    urgency: 'high',
    unmetBusinessOutcome: 'Candidate first successful CLI commit and production repository read telemetry not verified.',
    outcomeVerificationRule: 'Core Principle: A workflow is not complete merely because intermediate tasks are checked off. The required business outcome must be verified.',
    identifiedBottleneck: {
      name: 'Security Approval #SEC-TKT-9912 (Production IAM)',
      entityType: 'APPROVAL',
      status: 'CRITICAL_PENDING',
      durationStalled: '18.4 hours',
      impact: 'Blocks AWS Production & GitHub repository read scopes, which prevents verified outcome handshake.'
    },
    responsibleOwner: {
      name: 'Sarah Lin',
      role: 'Principal Security Architect & Application Owner for Production IAM',
      email: 'sarah.lin@company.io',
      slack: '@slin',
      authorizationPolicy: 'SEC-POL-042 (Production Gatekeeper Authorization Matrix)',
      queueCount: 4,
      backupDelegation: 'Mark Vance (Deputy Security Lead) authorized for Tier-2 escalation'
    },
    dependencyPath: [
      {
        id: 'step-1',
        order: 1,
        entityId: 'person-manager',
        entityType: 'PERSON',
        name: 'David Chen',
        systemOrRole: 'Hiring Manager (Director of Platform Eng)',
        status: 'COMPLETED',
        relationshipToNext: 'INITIATED',
        details: 'Approved requisition and onboarding checklist.'
      },
      {
        id: 'step-2',
        order: 2,
        entityId: 'task-employee-record',
        entityType: 'TASK',
        name: 'Employee Record',
        systemOrRole: 'Workday Core HCM (#EMP-77129)',
        status: 'COMPLETED',
        relationshipToNext: 'ENABLES',
        details: 'HR profile active, I-9 verified, direct deposit filed.'
      },
      {
        id: 'step-3',
        order: 3,
        entityId: 'sys-it-account',
        entityType: 'SYSTEM',
        name: 'IT Account & SSO',
        systemOrRole: 'Okta Identity Cloud & G-Suite',
        status: 'COMPLETED',
        relationshipToNext: 'ENABLES',
        details: 'Corporate email active, YubiKey hardware token registered.'
      },
      {
        id: 'step-4',
        order: 4,
        entityId: 'task-app-access',
        entityType: 'TASK',
        name: 'Application Access',
        systemOrRole: 'Entitlement Broker (AWS & GitHub)',
        status: 'BLOCKED',
        relationshipToNext: 'REQUIRES',
        isBottleneck: true,
        details: 'Production VPC and GitHub repository read scopes pending approval.'
      },
      {
        id: 'step-5',
        order: 5,
        entityId: 'appr-security',
        entityType: 'APPROVAL',
        name: 'Security Approval',
        systemOrRole: 'Sarah Lin (Application Owner)',
        status: 'CRITICAL',
        relationshipToNext: 'FEEDS_INTO',
        isBottleneck: true,
        details: 'Ticket SEC-TKT-9912 pending sign-off for 18.4 hours (SLA breach +14.4h).'
      },
      {
        id: 'step-6',
        order: 6,
        entityId: 'task-verification',
        entityType: 'VERIFICATION',
        name: 'Outcome Verification',
        systemOrRole: 'ClosureLoop Telemetry Verification Engine',
        status: 'BLOCKED',
        relationshipToNext: 'VERIFIES',
        details: 'FAILED_PRECONDITION: 0 commits or production telemetry pings detected.'
      },
      {
        id: 'step-7',
        order: 7,
        entityId: 'wf-onboarding',
        entityType: 'WORKFLOW',
        name: 'Employee Onboarding Outcome',
        systemOrRole: 'People Operations & Engineering Leadership',
        status: 'BLOCKED',
        details: 'Overall workflow marked INCOMPLETE until telemetry handshake succeeds.'
      }
    ],
    findings: [
      {
        id: 'find-1',
        category: 'CONFIRMED_FINDING',
        title: 'Employee Record exists in Workday',
        description: 'Profile EMP-77129 verified active in Workday Core HCM with legal compliance sign-offs completed.',
        evidenceRef: 'AUD-WD-77129',
        confidence: 1.0
      },
      {
        id: 'find-2',
        category: 'CONFIRMED_FINDING',
        title: 'IT Account & SSO identity fully provisioned',
        description: 'Okta directory synchronization completed with hardware MFA token active and Google Workspace inbox created.',
        evidenceRef: 'AUD-OKTA-5511',
        confidence: 0.99
      },
      {
        id: 'find-3',
        category: 'CONFIRMED_FINDING',
        title: 'Manager required tasks complete',
        description: 'David Chen confirmed equipment delivery, team channel additions, and initial sprint project assignment.',
        evidenceRef: 'AUD-JIRA-9012',
        confidence: 0.98
      },
      {
        id: 'find-4',
        category: 'CONFIRMED_FINDING',
        title: 'Sarah Lin is the authorized application owner',
        description: 'Entitlement Policy SEC-POL-042 designates Sarah Lin as the sole primary approver for Production IAM roles.',
        evidenceRef: 'POL-SEC-042',
        confidence: 0.97
      },
      {
        id: 'find-5',
        category: 'CONFIRMED_FINDING',
        title: 'Approval ticket #SEC-TKT-9912 stalled for 18.4 hours',
        description: 'Ticket created Oct 17 06:00 UTC remains pending with no action taken, exceeding the 4.0 hour SLA window.',
        evidenceRef: 'TKT-SEC-9912',
        confidence: 0.96
      },
      {
        id: 'find-6',
        category: 'HYPOTHESIS',
        title: 'Sarah Lin experiencing approval queue bottleneck',
        description: '4 unread high-risk access tickets currently in Sarah Lin’s queue suggest volume spike rather than intentional rejection.',
        confidence: 0.85
      },
      {
        id: 'find-7',
        category: 'HYPOTHESIS',
        title: 'Deputy Mark Vance has valid delegation authority',
        description: 'Secondary escalation rule SEC-ESC-03 permits Mark Vance to sign off if primary owner response time exceeds 16h.',
        confidence: 0.92
      },
      {
        id: 'find-8',
        category: 'UNAVAILABLE_DATA',
        title: 'Direct Slack notification response telemetry unavailable',
        description: 'Private message status between bot and approver cannot be audited due to enterprise privacy configuration.',
        confidence: 0.5
      },
      {
        id: 'find-9',
        category: 'UNAVAILABLE_DATA',
        title: 'Live AWS CloudTrail event streaming buffer latency',
        description: 'Telemetry logs from AWS IAM reflect a 5-minute delayed batch ingestion buffer.',
        confidence: 0.7
      }
    ],
    evidence: [
      {
        id: 'ev-1',
        type: 'GRAPH_EDGE',
        sourceSystem: 'FalkorDB Context',
        timestamp: '2026-10-18T02:40:00Z',
        summary: 'Graph traversal confirmed relationship: (task-app-access)-[:REQUIRES]->(appr-security)',
        cypherRelationship: '(:Task {id: "task-app-access"})-[:REQUIRES]->(:Approval {id: "appr-security"})',
        verified: true
      },
      {
        id: 'ev-2',
        type: 'GRAPH_EDGE',
        sourceSystem: 'FalkorDB Context',
        timestamp: '2026-10-18T02:40:00Z',
        summary: 'Graph traversal confirmed ownership: (person-app-owner:Sarah Lin)-[:RESPONSIBLE_FOR]->(appr-security)',
        cypherRelationship: '(:Person {name: "Sarah Lin"})-[:RESPONSIBLE_FOR]->(:Approval {id: "appr-security"})',
        verified: true
      },
      {
        id: 'ev-3',
        type: 'GRAPH_EDGE',
        sourceSystem: 'FalkorDB Context',
        timestamp: '2026-10-18T02:40:00Z',
        summary: 'Graph traversal confirmed verification link: (task-app-access)-[:FEEDS_INTO]->(task-verification)',
        cypherRelationship: '(:Task {id: "task-app-access"})-[:FEEDS_INTO]->(:Verification {id: "task-verification"})',
        verified: true
      },
      {
        id: 'ev-4',
        type: 'AUDIT_LOG',
        sourceSystem: 'Workday Core HCM',
        timestamp: '2026-10-16T11:24:00Z',
        summary: 'Event REC_PROVISION_COMPLETE for employee Jordan Hayes (EMP-77129). Status: ACTIVE.',
        verified: true,
        rawMetadata: { 'Event ID': 'WD-EVT-9921', 'Operator': 'Elena Rostova', 'Status': 'SUCCESS' }
      },
      {
        id: 'ev-5',
        type: 'AUDIT_LOG',
        sourceSystem: 'Okta Identity Cloud',
        timestamp: '2026-10-16T13:10:00Z',
        summary: 'Directory push sync OKTA-JOB-5511 successful for jordan.hayes@company.io. MFA: Hardware Token.',
        verified: true,
        rawMetadata: { 'Job ID': 'OKTA-5511', 'Apps Assigned': 'G-Suite, Slack, Jira' }
      },
      {
        id: 'ev-6',
        type: 'POLICY_RULE',
        sourceSystem: 'Security Policy Engine',
        timestamp: '2026-10-17T06:00:00Z',
        summary: 'Policy SEC-POL-042 requires explicit sign-off from named Application Owner for production cluster access.',
        verified: true,
        rawMetadata: { 'Policy': 'SEC-POL-042', 'Enforcement': 'STRICT', 'Mandatory Roles': 'prod-k8s, prod-rds' }
      },
      {
        id: 'ev-7',
        type: 'TELEMETRY_PROBE',
        sourceSystem: 'ClosureLoop Verification Engine',
        timestamp: '2026-10-18T03:00:00Z',
        summary: 'Telemetry handshake returned 0 verified commits from Jordan Hayes across all production repositories.',
        verified: true,
        rawMetadata: { 'Probe ID': 'PRB-CLI-001', 'Handshake': 'FAILED_PRECONDITION', 'Result': '0_COMMITS' }
      }
    ],
    falkorCypherQuery: `MATCH path = (w:Workflow {id: "wf-onboarding"})-[:REQUIRES*1..5]->(blocker:Approval)
WHERE blocker.status IN ["BLOCKED", "CRITICAL", "PENDING"]
MATCH (owner:Person)-[:RESPONSIBLE_FOR]->(blocker)
MATCH (v:VerificationRecord)-[:VERIFIES]->(w)
RETURN w.name AS Workflow, blocker.id AS BlockerID, owner.name AS ResponsibleOwner, v.verified AS OutcomeVerified, path;`,
    createdAt: '2026-10-17T06:30:00Z',
    updatedAt: '2026-10-18T02:45:00Z',
    dataSource: 'DEMO_ADAPTER'
  },
  {
    id: 'INV-2026-8813',
    workflowId: 'wf-003',
    workflowTitle: 'Release Approval Overdue: v2.14.0 Core Microservices',
    department: 'Engineering',
    status: 'ROOT_CAUSE_CONFIRMED',
    urgency: 'high',
    unmetBusinessOutcome: 'Container image signature and E2E regression certificate not posted to production registry.',
    outcomeVerificationRule: 'Core Principle: Builds and code merges are not releases until cryptographic staging verification passes.',
    identifiedBottleneck: {
      name: 'QA Automation & Production Gatekeeper Sign-off',
      entityType: 'APPROVAL',
      status: 'CRITICAL_PENDING',
      durationStalled: '3.0 days',
      impact: 'Holds production deployment gatekeeper manifest in Datadog & Kubernetes.'
    },
    responsibleOwner: {
      name: 'QA Gatekeeper / Release Engineering',
      role: 'Principal QA Architect',
      email: 'qa-gatekeeper@company.io',
      slack: '@qa-leads',
      authorizationPolicy: 'REL-POL-018 (Production Release Quality Standard)',
      queueCount: 2
    },
    dependencyPath: [
      {
        id: 'rel-1',
        order: 1,
        entityId: 'task-build',
        entityType: 'TASK',
        name: 'GitHub CI Build',
        systemOrRole: 'GitHub Actions',
        status: 'COMPLETED',
        details: 'Unit tests passed (1,420 / 1,420 green).'
      },
      {
        id: 'rel-2',
        order: 2,
        entityId: 'task-e2e',
        entityType: 'TASK',
        name: 'E2E Regression Suite',
        systemOrRole: 'Playwright Staging Cluster',
        status: 'BLOCKED',
        isBottleneck: true,
        details: 'Flaky test suite in billing checkout suite timed out at 180s.'
      },
      {
        id: 'rel-3',
        order: 3,
        entityId: 'appr-gatekeeper',
        entityType: 'APPROVAL',
        name: 'QA Gatekeeper Sign-off',
        systemOrRole: 'QA Gatekeeper Lead',
        status: 'CRITICAL',
        isBottleneck: true,
        details: 'Sign-off blocked pending test rerun or manual override.'
      },
      {
        id: 'rel-4',
        order: 4,
        entityId: 'task-verification-rel',
        entityType: 'VERIFICATION',
        name: 'Release Verification Stamping',
        systemOrRole: 'ClosureLoop Verification Engine',
        status: 'BLOCKED',
        details: 'Missing Cosign deployment signature in container registry.'
      }
    ],
    findings: [
      {
        id: 'f-rel-1',
        category: 'CONFIRMED_FINDING',
        title: 'CI compilation and Docker image build succeeded',
        description: 'Image sha256:7b91a... generated successfully in GitHub Actions pipeline.',
        evidenceRef: 'GHA-RUN-4412',
        confidence: 1.0
      },
      {
        id: 'f-rel-2',
        category: 'CONFIRMED_FINDING',
        title: 'Billing integration test timed out in staging',
        description: 'Test test_stripe_subscription_webhook failed with timeout after 180 seconds.',
        evidenceRef: 'TEST-LOG-8812',
        confidence: 0.98
      },
      {
        id: 'f-rel-3',
        category: 'HYPOTHESIS',
        title: 'Staging Stripe mock gateway had network transient',
        description: 'Secondary test run on development sandbox passed with zero errors.',
        confidence: 0.88
      },
      {
        id: 'f-rel-4',
        category: 'UNAVAILABLE_DATA',
        title: 'Kubernetes staging pod crash logs pruned',
        description: 'Ephemeral container logs older than 48 hours were rotated by logging daemon.',
        confidence: 0.6
      }
    ],
    evidence: [
      {
        id: 'ev-rel-1',
        type: 'AUDIT_LOG',
        sourceSystem: 'GitHub Actions',
        timestamp: '2026-10-15T18:00:00Z',
        summary: 'Run #4412 completed build stage; failed in regression gating step.',
        verified: true
      },
      {
        id: 'ev-rel-2',
        type: 'POLICY_RULE',
        sourceSystem: 'Release Governance',
        timestamp: '2026-10-16T09:00:00Z',
        summary: 'Policy REL-POL-018: 0 failing tests allowed in production deployment release pipeline.',
        verified: true
      }
    ],
    falkorCypherQuery: `MATCH (w:Workflow {id: "wf-003"})-[:REQUIRES*1..4]->(b:Task {status: "BLOCKED"})
MATCH (b)-[:BLOCKS]->(v:VerificationRecord)
RETURN w, b, v;`,
    createdAt: '2026-10-16T09:30:00Z',
    updatedAt: '2026-10-17T18:00:00Z',
    dataSource: 'DEMO_ADAPTER'
  },
  {
    id: 'INV-2026-8814',
    workflowId: 'wf-002',
    workflowTitle: 'Vendor Setup Awaiting Verification: CloudObservability Ltd',
    department: 'Procurement',
    status: 'HYPOTHESIS_PENDING',
    urgency: 'medium',
    unmetBusinessOutcome: 'Automated 1-cent penny test deposit settlement confirmed via FinOps ledger.',
    outcomeVerificationRule: 'Core Principle: A vendor is not onboarded until verified banking settlement telemetry occurs.',
    identifiedBottleneck: {
      name: 'Bank Details Micro-Deposit KYC Verification',
      entityType: 'VERIFICATION',
      status: 'PENDING',
      durationStalled: '1.0 day',
      impact: 'Prevents PO generation and automated invoice settlement.'
    },
    responsibleOwner: {
      name: 'Marcus Brody',
      role: 'Senior Procurement Specialist',
      email: 'marcus.brody@company.io',
      slack: '@mbrody',
      authorizationPolicy: 'FIN-POL-009 (Anti-Fraud Wire Transfer Verification)'
    },
    dependencyPath: [
      {
        id: 'ven-1',
        order: 1,
        entityId: 'task-w9',
        entityType: 'TASK',
        name: 'W-9 & Tax ID Ingestion',
        systemOrRole: 'Coupa Supplier Portal',
        status: 'COMPLETED',
        details: 'EIN validated with IRS database.'
      },
      {
        id: 'ven-2',
        order: 2,
        entityId: 'task-bank-kyc',
        entityType: 'TASK',
        name: 'Bank ACH Routing Verification',
        systemOrRole: 'JPMorgan Chase API',
        status: 'PENDING',
        isBottleneck: true,
        details: '1-cent verification test transaction dispatched; awaiting automated settlement confirmation.'
      },
      {
        id: 'ven-3',
        order: 3,
        entityId: 'task-fin-verify',
        entityType: 'VERIFICATION',
        name: 'FinOps Ledger Verification',
        systemOrRole: 'NetSuite FinOps Engine',
        status: 'BLOCKED',
        details: 'Awaiting webhook confirmation from banking gateway.'
      }
    ],
    findings: [
      {
        id: 'f-ven-1',
        category: 'CONFIRMED_FINDING',
        title: 'Supplier W-9 and security questionnaire approved',
        description: 'Vendor uploaded clean SOC-2 Type II certificate and approved liability waiver.',
        evidenceRef: 'COUPA-W9-1102',
        confidence: 1.0
      },
      {
        id: 'f-ven-2',
        category: 'HYPOTHESIS',
        title: 'ACH clearing cycle within normal 24-48h processing window',
        description: 'Dispatched on Friday; weekend clearing latency expected to resolve on Monday business hours.',
        confidence: 0.94
      },
      {
        id: 'f-ven-3',
        category: 'UNAVAILABLE_DATA',
        title: 'Counterparty bank intra-day wire clearing telemetry',
        description: 'External bank API does not provide real-time ACH status prior to settlement window.',
        confidence: 0.4
      }
    ],
    evidence: [
      {
        id: 'ev-ven-1',
        type: 'AUDIT_LOG',
        sourceSystem: 'Coupa Procurement',
        timestamp: '2026-10-16T14:00:00Z',
        summary: 'Vendor profile status: ACTIVE_PENDING_PAYMENT_VERIFICATION',
        verified: true
      }
    ],
    falkorCypherQuery: `MATCH (w:Workflow {id: "wf-002"})-[:DEPENDS_ON]->(v:VerificationRecord)
WHERE v.status = "PENDING"
RETURN w, v;`,
    createdAt: '2026-10-16T15:00:00Z',
    updatedAt: '2026-10-17T14:20:00Z',
    dataSource: 'DEMO_ADAPTER'
  }
];
