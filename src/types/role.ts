export type UserRole = 
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'SECURITY_APPROVER'
  | 'IT_OPERATOR'
  | 'CEO'
  | 'ADMIN';

export interface UserPersona {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  email: string;
  avatarInitials: string;
  focusArea: string;
  nextActionPrompt: {
    headline: string;
    description: string;
    workflowId: string;
    actionId?: string;
    buttonLabel: string;
  };
  permissions: {
    canApproveEscalations: boolean;
    canSignOffSecurity: boolean;
    canTriggerTechnicalActions: boolean;
    canManageSettings: boolean;
    canViewExecutiveAudits: boolean;
  };
}

export const USER_PERSONAS: Record<UserRole, UserPersona> = {
  MANAGER: {
    id: 'usr-104',
    name: 'David Chen',
    role: 'MANAGER',
    roleTitle: 'Engineering Director',
    department: 'Engineering Leadership',
    email: 'david.chen@closureloop.io',
    avatarInitials: 'DC',
    focusArea: 'Team Workflows & Bottleneck Approvals',
    nextActionPrompt: {
      headline: 'Review Escalation on SEC-TKT-9912',
      description: 'Jordan Hayes employee onboarding is stalled 4.2 days on Tier-1 AWS IAM role sign-off from Sarah Lin.',
      workflowId: 'wf-001',
      actionId: 'ACT-2026-0901',
      buttonLabel: 'Review & Authorize Action'
    },
    permissions: {
      canApproveEscalations: true,
      canSignOffSecurity: false,
      canTriggerTechnicalActions: true,
      canManageSettings: false,
      canViewExecutiveAudits: true
    }
  },
  SECURITY_APPROVER: {
    id: 'usr-008',
    name: 'Sarah Lin',
    role: 'SECURITY_APPROVER',
    roleTitle: 'SecOps Lead & Application Owner',
    department: 'Information Security',
    email: 'sarah.lin@closureloop.io',
    avatarInitials: 'SL',
    focusArea: 'Pending Security Approvals & Sign-offs',
    nextActionPrompt: {
      headline: 'Tier-1 Security Approval Sign-off Needed',
      description: 'Ticket SEC-TKT-9912 is 102 hours overdue against 24h SLA for production cluster access.',
      workflowId: 'wf-001',
      actionId: 'ACT-2026-0901',
      buttonLabel: 'Sign Off Approval'
    },
    permissions: {
      canApproveEscalations: true,
      canSignOffSecurity: true,
      canTriggerTechnicalActions: false,
      canManageSettings: false,
      canViewExecutiveAudits: true
    }
  },
  IT_OPERATOR: {
    id: 'usr-019',
    name: 'James Patel',
    role: 'IT_OPERATOR',
    roleTitle: 'IT Systems Specialist',
    department: 'IT Operations',
    email: 'james.patel@closureloop.io',
    avatarInitials: 'JP',
    focusArea: 'Technical Provisioning & Directory Sync',
    nextActionPrompt: {
      headline: 'Verify AWS IAM Role Binding & SCIM Sync',
      description: 'Okta SSO completed. Awaiting security ticket clearance to issue CorePlatformDev role credentials.',
      workflowId: 'wf-001',
      actionId: 'ACT-2026-0901',
      buttonLabel: 'Inspect Technical Prerequisites'
    },
    permissions: {
      canApproveEscalations: false,
      canSignOffSecurity: false,
      canTriggerTechnicalActions: true,
      canManageSettings: true,
      canViewExecutiveAudits: false
    }
  },
  EMPLOYEE: {
    id: 'emp-90214',
    name: 'Jordan Hayes',
    role: 'EMPLOYEE',
    roleTitle: 'Staff Platform Engineer',
    department: 'Core Platform Engineering',
    email: 'jordan.hayes@closureloop.io',
    avatarInitials: 'JH',
    focusArea: 'My Onboarding & Requests',
    nextActionPrompt: {
      headline: 'Onboarding Stalled on Production Access',
      description: 'Workday, Okta, and Manager orientation complete. Waiting for SecOps to sign off on production access.',
      workflowId: 'wf-001',
      buttonLabel: 'View Onboarding Status'
    },
    permissions: {
      canApproveEscalations: false,
      canSignOffSecurity: false,
      canTriggerTechnicalActions: false,
      canManageSettings: false,
      canViewExecutiveAudits: false
    }
  },
  CEO: {
    id: 'usr-001',
    name: 'Elena Rostova',
    role: 'CEO',
    roleTitle: 'Chief Executive Officer',
    department: 'Executive Leadership',
    email: 'elena.rostova@closureloop.io',
    avatarInitials: 'ER',
    focusArea: 'Company Workflow Health & Critical Bottlenecks',
    nextActionPrompt: {
      headline: '3 Stalled Workflows Breaching Department SLAs',
      description: 'Core Platform and Treasury onboarding stalled on human dependencies. Avg queue latency is 4.2 days.',
      workflowId: 'wf-001',
      buttonLabel: 'Inspect Bottlenecks'
    },
    permissions: {
      canApproveEscalations: true,
      canSignOffSecurity: true,
      canTriggerTechnicalActions: false,
      canManageSettings: true,
      canViewExecutiveAudits: true
    }
  },
  ADMIN: {
    id: 'usr-000',
    name: 'Alex Morgan',
    role: 'ADMIN',
    roleTitle: 'System Administrator',
    department: 'Platform Administration',
    email: 'alex.morgan@closureloop.io',
    avatarInitials: 'AM',
    focusArea: 'Graph Engine & Integrations Management',
    nextActionPrompt: {
      headline: 'FalkorDB Engine Status: Fallback Active',
      description: 'Backend is serving isolated demonstration property graph. Connect Docker to engage live Cypher execution.',
      workflowId: 'wf-001',
      buttonLabel: 'Configure Graph Settings'
    },
    permissions: {
      canApproveEscalations: true,
      canSignOffSecurity: true,
      canTriggerTechnicalActions: true,
      canManageSettings: true,
      canViewExecutiveAudits: true
    }
  }
};
