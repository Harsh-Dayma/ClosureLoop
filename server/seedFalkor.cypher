// ==============================================================================
// ClosureLoop — FalkorDB Enterprise Graph Seed Script
// Scenario: Employee Onboarding Incomplete (Jordan Hayes / Sarah Lin / Production IAM)
// ==============================================================================

// 1. Clean existing sample graph nodes
MATCH (n) DETACH DELETE n;

// 2. Create Core Workflow & Business Outcome Nodes
CREATE (wf:Workflow {
  id: 'wf-001',
  title: 'Employee Onboarding - Rahul Sharma',
  department: 'Core Platform Engineering',
  category: 'HR_IT_ONBOARDING',
  status: 'BLOCKED',
  startedAt: '2026-10-14T08:30:00Z',
  targetCompletion: '2026-10-16T17:00:00Z',
  daysStalled: 4.2
});

CREATE (outcome:BusinessOutcome {
  id: 'bo-001',
  name: 'First Code Commit Telemetry Verified',
  description: 'New hire must autonomously push and merge their first code commit to a production repository.',
  metric: 'verified_commit_count',
  target: 1,
  current: 0,
  status: 'FAILED_PRECONDITION',
  verificationSystem: 'GitHub Enterprise Audit Webhook',
  lastChecked: '2026-10-18T03:00:00Z'
});

// 3. Create Employee & Stakeholder Persona Nodes
CREATE (emp:Employee:Person {
  id: 'emp-90214',
  name: 'Rahul Sharma',
  role: 'Staff Platform Engineer',
  email: 'rahul.sharma@closureloop.io',
  department: 'Engineering',
  startDate: '2026-10-14',
  status: 'ACTIVE_PROVISIONED'
});

CREATE (mgr:Person {
  id: 'usr-104',
  name: 'David Chen',
  role: 'Engineering Director',
  email: 'david.chen@closureloop.io',
  department: 'Engineering'
});

CREATE (approver:Person {
  id: 'usr-008',
  name: 'Sarah Lin',
  role: 'SecOps Lead & Application Owner',
  email: 'sarah.lin@closureloop.io',
  department: 'Information Security',
  authorizedFor: 'Production Core Services IAM'
});

// 4. Create Task Nodes
CREATE (t1:Task {
  id: 'tsk-001',
  name: 'Workday HR Employee Profile Creation',
  system: 'Workday Human Capital Management',
  externalId: 'WD-REC-88410',
  status: 'COMPLETED',
  completedAt: '2026-10-14T09:00:00Z',
  assignee: 'HR Operations',
  order: 1
});

CREATE (t2:Task {
  id: 'tsk-002',
  name: 'Okta Identity & SSO Account Provisioning',
  system: 'Okta Enterprise Identity',
  externalId: 'OKTA-USR-109283',
  status: 'COMPLETED',
  completedAt: '2026-10-14T10:15:00Z',
  assignee: 'Automated Lifecycle Engine',
  order: 2
});

CREATE (t3:Task {
  id: 'tsk-003',
  name: 'Manager Day-1 Onboarding Checklist & Laptop Setup',
  system: 'Jira Service Management',
  externalId: 'IT-TKT-5519',
  status: 'COMPLETED',
  completedAt: '2026-10-14T14:30:00Z',
  assignee: 'David Chen',
  order: 3
});

// 5. Create Access, Application, and Approval Entities
CREATE (acc:Access {
  id: 'acc-aws-iam',
  name: 'Production Core Services AWS IAM Role',
  environment: 'production',
  status: 'UNAVAILABLE',
  granted: false,
  system: 'AWS Identity Center / Okta'
});

CREATE (app:Approval {
  id: 'sec-tkt-9912',
  ticketId: 'SEC-TKT-9912',
  title: 'Production IAM Access Security Sign-off',
  system: 'Jira Service Management',
  status: 'PENDING',
  slaHours: 24,
  elapsedHours: 102,
  slaBreached: true,
  riskTier: 'Tier-1 Critical',
  isBottleneck: true
});

CREATE (appSys:Application {
  id: 'app-core-svc',
  name: 'Production Core Microservices Cluster',
  tier: 'Tier-1 High Availability',
  repository: 'github.com/closureloop/core-services',
  ownerRole: 'SecOps Lead & Application Owner'
});

CREATE (tFinal:Task {
  id: 'tsk-004',
  name: 'First Git Commit to Production Repository',
  system: 'GitHub Enterprise',
  externalId: 'GH-COMMIT-VERIFY',
  status: 'BLOCKED',
  assignee: 'Jordan Hayes',
  order: 4
});

// 6. Connect Relationships
CREATE (wf)-[:TARGETS_OUTCOME]->(outcome);
CREATE (wf)-[:FOR_EMPLOYEE]->(emp);

CREATE (wf)-[:HAS_STAGE {order: 1}]->(t1);
CREATE (wf)-[:HAS_STAGE {order: 2}]->(t2);
CREATE (wf)-[:HAS_STAGE {order: 3}]->(t3);
CREATE (wf)-[:HAS_STAGE {order: 4}]->(tFinal);

CREATE (t1)-[:TRIGGERS_PROVISIONING {system: 'SCIM API'}]->(t2);
CREATE (t2)-[:ENABLES_STAGE]->(t3);
CREATE (t3)-[:ASSIGNED_TO]->(mgr);
CREATE (t3)-[:PRECEDES]->(acc);

CREATE (acc)-[:REQUIRES_SECURITY_SIGNOFF]->(app);
CREATE (app)-[:ASSIGNED_TO]->(approver);
CREATE (app)-[:CONTROLS_ACCESS_TO]->(appSys);

CREATE (appSys)-[:ENABLES_STAGE]->(tFinal);
CREATE (tFinal)-[:FULFILLS_OUTCOME]->(outcome);
