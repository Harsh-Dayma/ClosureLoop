export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN_OPERATIONS';

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
    canViewFullEnterpriseGraph: boolean;
    canExecuteCypherQueries: boolean;
    canInvestigateDeepGraph: boolean;
  };
}

export const USER_PERSONAS: Record<UserRole, UserPersona> = {
  EMPLOYEE: {
    id: 'emp-90214',
    name: 'Rahul Sharma',
    role: 'EMPLOYEE',
    roleTitle: 'Staff Platform Engineer',
    department: 'Core Platform Engineering',
    email: 'rahul.sharma@closureloop.io',
    avatarInitials: 'RS',
    focusArea: 'My Workflows, Tasks & Next Steps',
    nextActionPrompt: {
      headline: 'Onboarding Stalled on Production Access',
      description: 'Workday, Okta, and Manager orientation complete. Waiting for SecOps to sign off on production access. Nothing required from you right now.',
      workflowId: 'wf-001',
      buttonLabel: 'View Onboarding Status'
    },
    permissions: {
      canApproveEscalations: false,
      canSignOffSecurity: false,
      canTriggerTechnicalActions: false,
      canManageSettings: false,
      canViewExecutiveAudits: false,
      canViewFullEnterpriseGraph: false,
      canExecuteCypherQueries: false,
      canInvestigateDeepGraph: false
    }
  },
  MANAGER: {
    id: 'usr-104',
    name: 'David Chen',
    role: 'MANAGER',
    roleTitle: 'Engineering Director',
    department: 'Engineering Leadership',
    email: 'david.chen@closureloop.io',
    avatarInitials: 'DC',
    focusArea: 'Team Workflows, Blockers & Actions',
    nextActionPrompt: {
      headline: 'Review Escalation on SEC-TKT-9912',
      description: "Rahul Sharma's employee onboarding is blocked 4.2 days on Tier-1 AWS IAM role sign-off from Sarah Lin. Next step: Authorized approver must review request.",
      workflowId: 'wf-001',
      actionId: 'ACT-2026-0901',
      buttonLabel: 'Review & Authorize Action'
    },
    permissions: {
      canApproveEscalations: true,
      canSignOffSecurity: false,
      canTriggerTechnicalActions: true,
      canManageSettings: false,
      canViewExecutiveAudits: true,
      canViewFullEnterpriseGraph: true,
      canExecuteCypherQueries: false,
      canInvestigateDeepGraph: true
    }
  },
  ADMIN_OPERATIONS: {
    id: 'usr-008',
    name: 'Sarah Lin',
    role: 'ADMIN_OPERATIONS',
    roleTitle: 'SecOps Lead & Operations Admin',
    department: 'Security & IT Operations',
    email: 'sarah.lin@closureloop.io',
    avatarInitials: 'SL',
    focusArea: 'Pending Approvals, Action Queue & System Operations',
    nextActionPrompt: {
      headline: 'Tier-1 Security Approval Sign-off Needed',
      description: 'Ticket SEC-TKT-9912 is 102 hours overdue against 24h SLA for production cluster access for Rahul Sharma.',
      workflowId: 'wf-001',
      actionId: 'ACT-2026-0901',
      buttonLabel: 'Sign Off Approval'
    },
    permissions: {
      canApproveEscalations: true,
      canSignOffSecurity: true,
      canTriggerTechnicalActions: true,
      canManageSettings: true,
      canViewExecutiveAudits: true,
      canViewFullEnterpriseGraph: true,
      canExecuteCypherQueries: true,
      canInvestigateDeepGraph: true
    }
  }
};
