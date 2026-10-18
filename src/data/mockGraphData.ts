import type { FalkorGraphData } from '../types/graph';

/**
 * Realistic Mock Dependency Graph for Employee Onboarding
 * 
 * Scenario:
 * - HR completed Employee Record
 * - IT account was provisioned in Okta
 * - BUT Application Access is blocked because Security Approval is unresolved
 * - Application Owner (Sarah Lin) hasn't approved
 * - Therefore, Onboarding Verification is stalled and the business outcome is incomplete!
 * 
 * Note: Data structures match FalkorDB node labels & edge relationships for seamless API migration.
 */
export const onboardingGraphData: FalkorGraphData = {
  graphId: 'graph-onboarding-001',
  name: 'Employee Onboarding: Jordan Hayes (Staff Engineer)',
  description: 'Cross-functional dependency chain across HR, IT, Security, and Engineering',
  nodes: [
    {
      id: 'wf-onboarding',
      type: 'customDependency',
      position: { x: 380, y: 30 },
      data: {
        label: 'Employee Onboarding',
        sublabel: 'Outcome Target: Active & Productive',
        entityType: 'WORKFLOW',
        status: 'BLOCKED',
        owner: 'People Operations',
        team: 'HR Operations',
        blockerReason: 'Final outcome cannot be verified: Application access blocked by security approval.',
        confidence: 0.94,
        lastUpdated: '12 mins ago',
        cypherQuery: 'MATCH (w:Workflow {id: "wf-onboarding"})-[:REQUIRES*1..3]->(b) WHERE b.status = "BLOCKED" RETURN w, b;',
        metadata: {
          'Target Role': 'Staff Backend Engineer',
          'Candidate': 'Jordan Hayes',
          'Start Date': 'October 16, 2026',
          'SLA Status': 'Breached (+18h)'
        }
      }
    },
    {
      id: 'person-manager',
      type: 'customDependency',
      position: { x: 80, y: 150 },
      data: {
        label: 'David Chen',
        sublabel: 'Director of Platform Eng',
        entityType: 'PERSON',
        status: 'COMPLETED',
        owner: 'Engineering',
        team: 'Platform Team',
        confidence: 0.98,
        lastUpdated: '2 days ago',
        cypherQuery: 'MATCH (m:Person {name: "David Chen"})-[:INITIATED]->(w:Workflow) RETURN m, w;',
        metadata: {
          'Role': 'Hiring Manager',
          'Requisition ID': 'REQ-88912',
          'Sign-off': 'Approved'
        }
      }
    },
    {
      id: 'task-employee-record',
      type: 'customDependency',
      position: { x: 380, y: 160 },
      data: {
        label: 'Employee Record',
        sublabel: 'Workday HR Profile Created',
        entityType: 'TASK',
        status: 'COMPLETED',
        owner: 'Elena Rostova',
        team: 'HR Operations',
        confidence: 1.0,
        lastUpdated: '1 day ago',
        cypherQuery: 'MATCH (t:Task {id: "task-employee-record"})-[:ENABLES]->(s:System) RETURN t, s;',
        metadata: {
          'System': 'Workday Core HCM',
          'Employee ID': 'EMP-77129',
          'Legal Verification': 'I-9 Verified'
        }
      }
    },
    {
      id: 'sys-it-account',
      type: 'customDependency',
      position: { x: 380, y: 290 },
      data: {
        label: 'IT Account',
        sublabel: 'Okta Identity & G-Suite SSO',
        entityType: 'SYSTEM',
        status: 'COMPLETED',
        owner: 'Automated Directory Sync',
        team: 'IT Infrastructure',
        confidence: 0.99,
        lastUpdated: '22 hours ago',
        cypherQuery: 'MATCH (s:System {id: "sys-it-account"})-[:ENABLES]->(a:Task) RETURN s, a;',
        metadata: {
          'SSO Status': 'Active',
          'Email': 'jordan.hayes@company.io',
          'MFA': 'Hardware Token Registered'
        }
      }
    },
    {
      id: 'task-app-access',
      type: 'customDependency',
      position: { x: 380, y: 430 },
      data: {
        label: 'Application Access',
        sublabel: 'AWS Production & Repo Scopes',
        entityType: 'TASK',
        status: 'BLOCKED',
        owner: 'Entitlement Broker',
        team: 'Platform Security',
        blockerReason: 'Blocked awaiting high-privilege IAM security approval.',
        confidence: 0.92,
        lastUpdated: '6 hours ago',
        cypherQuery: 'MATCH (t:Task {id: "task-app-access"})-[:REQUIRES]->(appr:Approval) WHERE appr.status = "BLOCKED" RETURN t, appr;',
        metadata: {
          'Access Tier': 'Production VPC Access',
          'Required Roles': 'k8s-cluster-admin, prod-rds-read',
          'Policy Rule': 'SEC-POL-042 (High-Risk Access)'
        }
      }
    },
    {
      id: 'appr-security',
      type: 'customDependency',
      position: { x: 680, y: 430 },
      data: {
        label: 'Security Approval',
        sublabel: 'CRITICAL BLOCKER (Unresolved)',
        entityType: 'APPROVAL',
        status: 'CRITICAL',
        owner: 'Sarah Lin',
        team: 'InfoSec / AppSec',
        blockerReason: 'Sign-off pending since Oct 17. Sarah Lin is listed as application owner for Production IAM.',
        confidence: 0.97,
        lastUpdated: '18 hours ago',
        cypherQuery: 'MATCH (p:Person {name: "Sarah Lin"})-[:RESPONSIBLE_FOR]->(appr:Approval {id: "appr-security"}) RETURN p, appr;',
        metadata: {
          'Approval Ticket': 'SEC-TKT-9912',
          'Pending Duration': '18.4 hours',
          'Recommended Action': 'Nudge Sarah Lin via Slack & route temporary bypass to deputy',
          'FalkorDB Path': 'Security Approval -> Application Access -> Outcome Verification'
        }
      }
    },
    {
      id: 'person-app-owner',
      type: 'customDependency',
      position: { x: 930, y: 430 },
      data: {
        label: 'Sarah Lin',
        sublabel: 'Principal Security Architect',
        entityType: 'PERSON',
        status: 'PENDING',
        owner: 'Security Operations',
        team: 'InfoSec',
        blockerReason: 'Assigned approver currently has 4 unread approval requests in queue.',
        confidence: 0.95,
        lastUpdated: '45 mins ago',
        cypherQuery: 'MATCH (p:Person {email: "sarah.lin@company.io"})-[:ASSIGNED_TO]->(t) RETURN p, count(t);',
        metadata: {
          'Email': 'sarah.lin@company.io',
          'Timezone': 'America/San_Francisco (PST)',
          'Slack': '@slin',
          'Delegation Available': 'Yes (Mark Vance)'
        }
      }
    },
    {
      id: 'task-verification',
      type: 'customDependency',
      position: { x: 380, y: 580 },
      data: {
        label: 'Onboarding Verification',
        sublabel: 'Core Principle: Verify Verified Outcome',
        entityType: 'VERIFICATION',
        status: 'BLOCKED',
        owner: 'ClosureLoop Verification Engine',
        team: 'Quality & Governance',
        blockerReason: 'Cannot verify outcome: Candidate has not performed first successful production commit & access handshake.',
        confidence: 0.96,
        lastUpdated: '15 mins ago',
        cypherQuery: 'MATCH (v:VerificationRecord)-[:VERIFIES]->(w:Workflow) WHERE v.verified = false RETURN v, w;',
        metadata: {
          'Principle': 'A task is not truly complete until outcome verified',
          'Verification Criteria': 'Telemetry pulse from AWS CLI & GitHub repo clone',
          'Result': 'FAILED_PRECONDITION'
        }
      }
    }
  ],
  edges: [
    {
      id: 'e-manager-wf',
      source: 'person-manager',
      target: 'wf-onboarding',
      relationship: 'INITIATED',
      label: 'Initiated'
    },
    {
      id: 'e-wf-rec',
      source: 'wf-onboarding',
      target: 'task-employee-record',
      relationship: 'REQUIRES',
      label: 'Requires'
    },
    {
      id: 'e-rec-it',
      source: 'task-employee-record',
      target: 'sys-it-account',
      relationship: 'ENABLES',
      label: 'Enables identity'
    },
    {
      id: 'e-it-app',
      source: 'sys-it-account',
      target: 'task-app-access',
      relationship: 'ENABLES',
      label: 'Enables access flow'
    },
    {
      id: 'e-app-approval',
      source: 'task-app-access',
      target: 'appr-security',
      relationship: 'REQUIRES',
      isCriticalPath: true,
      animated: true,
      label: 'Requires approval'
    },
    {
      id: 'e-owner-approval',
      source: 'person-app-owner',
      target: 'appr-security',
      relationship: 'RESPONSIBLE_FOR',
      isCriticalPath: true,
      animated: true,
      label: 'Responsible owner'
    },
    {
      id: 'e-app-verify',
      source: 'task-app-access',
      target: 'task-verification',
      relationship: 'FEEDS_INTO',
      isCriticalPath: true,
      animated: true,
      label: 'Prerequisite for'
    },
    {
      id: 'e-verify-wf',
      source: 'task-verification',
      target: 'wf-onboarding',
      relationship: 'VERIFIES',
      label: 'Verifies final outcome'
    }
  ]
};
