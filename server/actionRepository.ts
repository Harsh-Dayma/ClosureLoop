import type {
  ActionItem,
  ActionStatus,
  ActionFilters,
  ActionStateTransitionPayload,
  ActionExecutionResponse,
  ActionActor,
  ActionAuditEvent
} from '../src/types/action.js';

// Validated State Transition Matrix
const VALID_TRANSITIONS: Record<ActionStatus, ActionStatus[]> = {
  PROPOSED: ['PENDING_REVIEW', 'CANCELLED'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['READY_FOR_EXECUTION', 'CANCELLED'],
  REJECTED: ['PENDING_REVIEW'], // Can be appealed back to review
  READY_FOR_EXECUTION: ['EXECUTING', 'CANCELLED'],
  EXECUTING: ['COMPLETED', 'FAILED', 'AWAITING_VERIFICATION'],
  AWAITING_VERIFICATION: ['COMPLETED', 'FAILED'],
  COMPLETED: [], // Terminal for execution; feeds into Module 6
  FAILED: ['READY_FOR_EXECUTION', 'CANCELLED'], // Can retry
  CANCELLED: ['PENDING_REVIEW'] // Can reopen
};

export const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 'ACT-2026-0901',
    title: 'Priority Security Approval Escalation for Jordan Hayes',
    description: 'Dispatch high-priority nudge and executive notification to Sarah Lin (SecOps Lead) to review pending production IAM sign-off on SEC-TKT-9912.',
    workflowId: 'wf-001',
    workflowTitle: 'Employee Onboarding - Jordan Hayes',
    department: 'Core Platform Engineering',
    investigationId: 'INV-2026-8812',
    actionType: 'DISPATCH_SECURITY_SIGN_OFF_REMINDER',
    urgency: 'CRITICAL',
    status: 'PENDING_REVIEW',
    blocker: {
      name: 'Missing Production IAM Security Approval',
      system: 'Jira Service Management',
      ticketId: 'SEC-TKT-9912',
      durationStalled: '4.2 days (102h elapsed vs 24h SLA)',
      responsibleParty: 'Sarah Lin',
      responsibleRole: 'SecOps Lead & Application Owner',
      authorizedEntityId: 'usr-008'
    },
    proposedResolution: 'Send an escalated Slack & Jira notification with the cryptographic onboarding audit trail to Sarah Lin, prompting immediate decision on SEC-TKT-9912.',
    expectedOutcome: 'Sarah Lin reviews and approves ticket SEC-TKT-9912 -> Production AWS IAM role granted -> Jordan Hayes can push initial commit.',
    requiredAuthorizations: [
      'Engineering Director (David Chen) OR Information Security Lead',
      'Confirmed SLA breach > 48 hours'
    ],
    impactAssessment: 'Zero disruption to production cluster. Unblocks Jordan Hayes Day-1 code commit milestone.',
    evidenceReferences: [
      {
        id: 'ev-001',
        type: 'GRAPH_EDGE',
        sourceSystem: 'FalkorDB Property Graph',
        title: 'Traversed Blocker Path',
        description: '(Access:acc-aws-iam)-[:REQUIRES_SECURITY_SIGNOFF]->(Approval:sec-tkt-9912)-[:ASSIGNED_TO]->(Person:Sarah Lin)'
      },
      {
        id: 'ev-002',
        type: 'AUDIT_LOG',
        sourceSystem: 'Jira Service Management REST API',
        title: 'SLA Breach Record',
        description: 'Ticket SEC-TKT-9912 created 2026-10-14 10:20:00Z. SLA: 24h. Status: In Review without decision.',
        recordIdentifier: 'SEC-TKT-9912'
      },
      {
        id: 'ev-003',
        type: 'TELEMETRY',
        sourceSystem: 'GitHub Enterprise Audit Webhook',
        title: 'Zero Commit Verification',
        description: 'Repository closureloop/core-services: 0 verified commits from jordan.hayes@closureloop.io.'
      }
    ],
    targetIntegration: {
      name: 'SecOps Emergency Notification Dispatcher',
      system: 'Slack Enterprise Grid + Jira Automation Webhook',
      isLive: false,
      adapterType: 'DEMO_ADAPTER',
      endpointNote: 'Simulated via demo adapter. Production requires SLACK_BOT_TOKEN and JIRA_API_TOKEN.',
      simulatedPayload: {
        channel: '#secops-escalations',
        assignee: 'sarah.lin@closureloop.io',
        ticketId: 'SEC-TKT-9912',
        priority: 'P1-URGENT',
        workflowId: 'wf-001'
      }
    },
    auditTrail: [
      {
        id: 'aud-001',
        timestamp: '2026-10-17T18:00:00Z',
        actor: {
          id: 'sys-closureloop',
          name: 'ClosureLoop Intelligence Engine',
          role: 'Graph Dependency Resolver',
          email: 'agent@closureloop.io'
        },
        event: 'Action Proposed',
        previousStatus: undefined,
        newStatus: 'PROPOSED',
        notes: 'Investigation INV-2026-8812 confirmed Sarah Lin is the sole authorized approver for SEC-TKT-9912.'
      },
      {
        id: 'aud-002',
        timestamp: '2026-10-17T18:05:00Z',
        actor: {
          id: 'sys-closureloop',
          name: 'ClosureLoop Intake Router',
          role: 'Workflow Automator',
          email: 'agent@closureloop.io'
        },
        event: 'Queued for Human Review',
        previousStatus: 'PROPOSED',
        newStatus: 'PENDING_REVIEW',
        notes: 'Assigned to Engineering Leadership approval queue.'
      }
    ],
    verificationRequirement: {
      metric: 'verified_commit_count',
      targetCondition: '>= 1 commit to closureloop/core-services',
      sourceSystem: 'GitHub Enterprise Audit Log',
      verificationStatus: 'FAILED_PRECONDITION',
      notes: 'Executing this action will NOT mark onboarding complete. Completion requires Module 6 telemetry verification.'
    },
    createdAt: '2026-10-17T18:00:00Z',
    updatedAt: '2026-10-17T18:05:00Z'
  },
  {
    id: 'ACT-2026-0902',
    title: 'Secondary Approver Escalation for Release v2.14.0',
    description: 'Reassign stale QA Gatekeeper sign-off ticket REL-TKT-1049 to alternate designated release engineer Marcus Vance.',
    workflowId: 'wf-002',
    workflowTitle: 'Production Deployment v2.14.0',
    department: 'DevOps / Release Engineering',
    investigationId: 'INV-2026-8813',
    actionType: 'ESCALATE_TO_SECONDARY_SIGNER',
    urgency: 'HIGH',
    status: 'READY_FOR_EXECUTION',
    blocker: {
      name: 'QA Gatekeeper Sign-off Pending',
      system: 'Jira Service Management',
      ticketId: 'REL-TKT-1049',
      durationStalled: '1.8 days overdue',
      responsibleParty: 'Alex Rivera (OOO)',
      responsibleRole: 'Lead QA Architect',
      authorizedEntityId: 'usr-012'
    },
    proposedResolution: 'Invoke secondary delegation policy to assign ticket REL-TKT-1049 to Marcus Vance (Secondary Release Gatekeeper).',
    expectedOutcome: 'Marcus Vance receives ownership -> Release gate unblocked -> Production rollout proceeds.',
    requiredAuthorizations: [
      'Release Manager OR VP Engineering sign-off'
    ],
    impactAssessment: 'Enables release pipeline deployment for 14 downstream microservices.',
    evidenceReferences: [
      {
        id: 'ev-004',
        type: 'GRAPH_EDGE',
        sourceSystem: 'FalkorDB Property Graph',
        title: 'Secondary Signer Path',
        description: '(Approval:REL-TKT-1049)-[:HAS_DELEGATE]->(Person:Marcus Vance)'
      }
    ],
    targetIntegration: {
      name: 'Jira Service Management Delegator',
      system: 'Jira Cloud REST API v3',
      isLive: false,
      adapterType: 'DEMO_ADAPTER',
      endpointNote: 'Simulated dispatch via backend demo adapter.'
    },
    auditTrail: [
      {
        id: 'aud-003',
        timestamp: '2026-10-17T19:00:00Z',
        actor: {
          id: 'sys-closureloop',
          name: 'ClosureLoop Intelligence Engine',
          role: 'System',
          email: 'agent@closureloop.io'
        },
        event: 'Action Proposed',
        newStatus: 'PROPOSED',
        notes: 'Alex Rivera confirmed Out of Office.'
      },
      {
        id: 'aud-004',
        timestamp: '2026-10-17T19:30:00Z',
        actor: {
          id: 'usr-104',
          name: 'David Chen',
          role: 'Engineering Director',
          email: 'david.chen@closureloop.io'
        },
        event: 'Action Approved',
        previousStatus: 'PENDING_REVIEW',
        newStatus: 'APPROVED',
        notes: 'Approved delegation to Marcus Vance due to SLA breach.'
      },
      {
        id: 'aud-005',
        timestamp: '2026-10-17T19:31:00Z',
        actor: {
          id: 'sys-closureloop',
          name: 'ClosureLoop Policy Engine',
          role: 'System',
          email: 'agent@closureloop.io'
        },
        event: 'Prerequisites Validated',
        previousStatus: 'APPROVED',
        newStatus: 'READY_FOR_EXECUTION',
        notes: 'Marcus Vance active duty confirmed in PagerDuty schedule.'
      }
    ],
    verificationRequirement: {
      metric: 'pipeline_deployment_status',
      targetCondition: 'status == "SUCCESS"',
      sourceSystem: 'ArgoCD / Kubernetes Telemetry',
      verificationStatus: 'NOT_VERIFIED',
      notes: 'Deployment verification pending execution.'
    },
    createdAt: '2026-10-17T19:00:00Z',
    updatedAt: '2026-10-17T19:31:00Z'
  },
  {
    id: 'ACT-2026-0903',
    title: 'ACH Micro-Deposit Re-Verification for CloudObservability Ltd',
    description: 'Trigger automated retry of twin ACH micro-deposits via Stripe Treasury to unblock vendor payment clearance.',
    workflowId: 'wf-003',
    workflowTitle: 'Vendor Setup & Compliance Audit',
    department: 'Finance & Procurement',
    investigationId: 'INV-2026-8814',
    actionType: 'TRIGGER_MICRO_DEPOSIT_REVERIFICATION',
    urgency: 'MEDIUM',
    status: 'AWAITING_VERIFICATION',
    blocker: {
      name: 'Bank Account ACH Verification Stalled',
      system: 'Stripe Treasury / NetSuite',
      ticketId: 'FIN-VND-4019',
      durationStalled: '3.1 days',
      responsibleParty: 'Treasury Operations',
      responsibleRole: 'Finance Controller'
    },
    proposedResolution: 'Re-issue micro-deposit challenge tokens and notify vendor billing contact.',
    expectedOutcome: 'Vendor verifies deposit amounts -> NetSuite vendor status moves to ACTIVE.',
    requiredAuthorizations: ['Finance Controller sign-off'],
    impactAssessment: 'Unblocks AP disbursement without manual wire fee overhead.',
    evidenceReferences: [
      {
        id: 'ev-005',
        type: 'AUDIT_LOG',
        sourceSystem: 'Stripe Treasury Webhooks',
        title: 'Micro-deposit Failure Code',
        description: 'DEPOSIT_EXPIRED_WINDOW: 48h confirmation window lapsed.'
      }
    ],
    targetIntegration: {
      name: 'Stripe Treasury Micro-Deposit Dispatcher',
      system: 'Stripe Financial Connections API',
      isLive: false,
      adapterType: 'DEMO_ADAPTER',
      endpointNote: 'Simulated execution.'
    },
    auditTrail: [
      {
        id: 'aud-006',
        timestamp: '2026-10-17T14:00:00Z',
        actor: {
          id: 'usr-fin-02',
          name: 'Elena Rostova',
          role: 'Finance Controller',
          email: 'elena.rostova@closureloop.io'
        },
        event: 'Action Executed',
        previousStatus: 'READY_FOR_EXECUTION',
        newStatus: 'AWAITING_VERIFICATION',
        notes: 'Dispatched micro-deposit challenge tokens via Stripe.'
      }
    ],
    verificationRequirement: {
      metric: 'vendor_bank_status',
      targetCondition: 'verified == true',
      sourceSystem: 'NetSuite ERP API',
      verificationStatus: 'AWAITING_TELEMETRY',
      notes: 'Waiting for vendor bank confirmation.'
    },
    createdAt: '2026-10-17T12:00:00Z',
    updatedAt: '2026-10-17T14:00:00Z',
    executedAt: '2026-10-17T14:00:00Z'
  },
  {
    id: 'ACT-2026-0904',
    title: 'Okta SCIM Directory Group Re-synchronization',
    description: 'Trigger SCIM directory reconciliation job for Engineering Staff group in Okta to fix stale group memberships.',
    workflowId: 'wf-004',
    workflowTitle: 'Okta Directory Attribute Sync',
    department: 'IT Operations',
    investigationId: 'INV-2026-8815',
    actionType: 'SYNCHRONIZE_DIRECTORY_PROFILE',
    urgency: 'LOW',
    status: 'COMPLETED',
    blocker: {
      name: 'Stale SCIM Group Token',
      system: 'Okta Enterprise Identity',
      durationStalled: 'Resolved',
      responsibleParty: 'Automated Identity Engine',
      responsibleRole: 'Directory Sync Daemon'
    },
    proposedResolution: 'Force incremental directory push from Workday to Okta SCIM endpoint.',
    expectedOutcome: 'Group memberships reconciled across all enterprise applications.',
    requiredAuthorizations: ['IT Admin'],
    impactAssessment: 'Zero impact. Read-only profile sync.',
    evidenceReferences: [
      {
        id: 'ev-006',
        type: 'AUDIT_LOG',
        sourceSystem: 'Okta System Log',
        title: 'SCIM Sync Complete',
        description: 'Successfully synced 182 group memberships.'
      }
    ],
    targetIntegration: {
      name: 'Okta SCIM API Connector',
      system: 'Okta Management API',
      isLive: false,
      adapterType: 'DEMO_ADAPTER',
      endpointNote: 'Simulated directory sync.'
    },
    auditTrail: [
      {
        id: 'aud-007',
        timestamp: '2026-10-16T11:00:00Z',
        actor: {
          id: 'usr-it-01',
          name: 'James Patel',
          role: 'IT Systems Admin',
          email: 'james.patel@closureloop.io'
        },
        event: 'Action Completed',
        previousStatus: 'AWAITING_VERIFICATION',
        newStatus: 'COMPLETED',
        notes: 'SCIM group token verified active.'
      }
    ],
    verificationRequirement: {
      metric: 'scim_sync_status',
      targetCondition: 'in_sync == true',
      sourceSystem: 'Okta System Log',
      verificationStatus: 'VERIFIED',
      notes: 'Verified by Okta sync webhook.'
    },
    createdAt: '2026-10-16T10:00:00Z',
    updatedAt: '2026-10-16T11:00:00Z',
    executedAt: '2026-10-16T10:30:00Z',
    completedAt: '2026-10-16T11:00:00Z'
  }
];

class ActionRepository {
  private actions: ActionItem[];

  constructor() {
    this.actions = JSON.parse(JSON.stringify(INITIAL_ACTIONS));
  }

  /**
   * Returns list of actions filtered by status, urgency, or search query
   */
  public getActions(filters?: ActionFilters): ActionItem[] {
    let result = [...this.actions];

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((a) => a.status === filters.status);
    }

    if (filters?.urgency && filters.urgency !== 'ALL') {
      result = result.filter((a) => a.urgency === filters.urgency);
    }

    if (filters?.workflowId && filters.workflowId !== 'ALL') {
      result = result.filter((a) => a.workflowId === filters.workflowId);
    }

    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.workflowTitle.toLowerCase().includes(q) ||
          a.blocker.responsibleParty.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q)
      );
    }

    return result;
  }

  /**
   * Retrieves single action by ID
   */
  public getActionById(id: string): ActionItem | undefined {
    return this.actions.find((a) => a.id === id);
  }

  /**
   * Enforces valid state machine transition and appends an immutable audit event
   */
  public transitionAction(
    id: string,
    payload: ActionStateTransitionPayload
  ): { success: boolean; action?: ActionItem; error?: string } {
    const action = this.actions.find((a) => a.id === id);
    if (!action) {
      return { success: false, error: `Action '${id}' not found.` };
    }

    let targetStatus: ActionStatus;
    let eventName: string;

    switch (payload.decision) {
      case 'APPROVE':
        targetStatus = 'APPROVED';
        eventName = 'Human Review: Approved';
        break;
      case 'REJECT':
        targetStatus = 'REJECTED';
        eventName = 'Human Review: Rejected';
        break;
      case 'CANCEL':
        targetStatus = 'CANCELLED';
        eventName = 'Action Cancelled';
        break;
      case 'REQUEST_INFO':
        // Does not alter status, records comment event
        const auditEvent: ActionAuditEvent = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: payload.actor,
          event: 'Information Requested',
          notes: payload.notes || 'Additional context requested by reviewer.'
        };
        action.auditTrail.push(auditEvent);
        action.updatedAt = new Date().toISOString();
        return { success: true, action };
      default:
        return { success: false, error: `Unsupported decision: ${payload.decision}` };
    }

    // Validate transition
    const allowedNext = VALID_TRANSITIONS[action.status] || [];
    if (!allowedNext.includes(targetStatus)) {
      return {
        success: false,
        error: `Invalid transition: Cannot move action from '${action.status}' to '${targetStatus}'. Allowed: [${allowedNext.join(', ')}]`
      };
    }

    // Apply state change
    const prev = action.status;
    action.status = targetStatus;
    action.updatedAt = new Date().toISOString();

    // Auto-advance to READY_FOR_EXECUTION if approved
    if (targetStatus === 'APPROVED') {
      action.status = 'READY_FOR_EXECUTION';
      eventName = 'Approved & Ready for Execution';
    }

    const auditEvent: ActionAuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: payload.actor,
      event: eventName,
      previousStatus: prev,
      newStatus: action.status,
      notes: payload.notes || `Decision recorded by ${payload.actor.name} (${payload.actor.role}).`
    };

    action.auditTrail.push(auditEvent);
    return { success: true, action };
  }

  /**
   * Executes an action in READY_FOR_EXECUTION state with idempotency check
   */
  public executeAction(
    id: string,
    actor: ActionActor
  ): ActionExecutionResponse {
    const action = this.actions.find((a) => a.id === id);
    if (!action) {
      return {
        success: false,
        actionId: id,
        status: 'FAILED',
        message: `Action '${id}' not found.`,
        executionTimestamp: new Date().toISOString(),
        auditEvent: {
          id: `aud-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor,
          event: 'Execution Failed: Action Not Found'
        },
        isSimulated: true
      };
    }

    // Idempotency check: Cannot re-execute completed or executing actions
    if (action.status === 'EXECUTING') {
      return {
        success: false,
        actionId: id,
        status: action.status,
        message: `Action '${id}' is already executing in background.`,
        executionTimestamp: new Date().toISOString(),
        auditEvent: {
          id: `aud-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor,
          event: 'Duplicate Execution Rejected'
        },
        isSimulated: true
      };
    }

    if (action.status === 'COMPLETED' || action.status === 'AWAITING_VERIFICATION') {
      return {
        success: false,
        actionId: id,
        status: action.status,
        message: `Action '${id}' has already been executed. Current status: ${action.status}.`,
        executionTimestamp: new Date().toISOString(),
        auditEvent: {
          id: `aud-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor,
          event: 'Duplicate Execution Suppressed'
        },
        isSimulated: true
      };
    }

    if (action.status !== 'READY_FOR_EXECUTION' && action.status !== 'APPROVED') {
      return {
        success: false,
        actionId: id,
        status: action.status,
        message: `Action '${id}' is in status '${action.status}'. Only 'READY_FOR_EXECUTION' actions can be executed.`,
        executionTimestamp: new Date().toISOString(),
        auditEvent: {
          id: `aud-err-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor,
          event: 'Execution Rejected: Status Not Ready'
        },
        isSimulated: true
      };
    }

    // Execute state transition
    const prev = action.status;
    const now = new Date().toISOString();
    action.status = 'AWAITING_VERIFICATION';
    action.executedAt = now;
    action.updatedAt = now;

    const auditEvent: ActionAuditEvent = {
      id: `aud-exec-${Date.now()}`,
      timestamp: now,
      actor,
      event: 'Action Dispatched via Adapter',
      previousStatus: prev,
      newStatus: 'AWAITING_VERIFICATION',
      notes: `Dispatched payload to ${action.targetIntegration.name} (${action.targetIntegration.system}). Awaiting target business outcome telemetry verification.`
    };

    action.auditTrail.push(auditEvent);

    return {
      success: true,
      actionId: id,
      status: action.status,
      message: `Successfully dispatched action to ${action.targetIntegration.name}. System transitioned to AWAITING_VERIFICATION.`,
      executionTimestamp: now,
      auditEvent,
      isSimulated: true
    };
  }

  /**
   * Returns aggregate queue statistics
   */
  public getStats() {
    return {
      total: this.actions.length,
      pendingReview: this.actions.filter((a) => a.status === 'PENDING_REVIEW').length,
      readyForExecution: this.actions.filter((a) => a.status === 'READY_FOR_EXECUTION').length,
      awaitingVerification: this.actions.filter((a) => a.status === 'AWAITING_VERIFICATION').length,
      completed: this.actions.filter((a) => a.status === 'COMPLETED').length
    };
  }

  /**
   * Resets actions to clean seed state for demonstration repeatability
   */
  public resetToInitialState(): void {
    this.actions = JSON.parse(JSON.stringify(INITIAL_ACTIONS));
  }
}

export const actionRepository = new ActionRepository();
