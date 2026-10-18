/**
 * Action Center Domain Types & Lifecycle Interfaces
 * 
 * Defines state transitions, review mechanisms, execution boundaries,
 * and immutable audit provenance for enterprise dependency resolutions.
 */

export type ActionStatus = 
  | 'PROPOSED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'READY_FOR_EXECUTION'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'AWAITING_VERIFICATION'
  | 'CANCELLED';

export type ActionUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ActionType =
  | 'DISPATCH_SECURITY_SIGN_OFF_REMINDER'
  | 'ESCALATE_TO_SECONDARY_SIGNER'
  | 'TRIGGER_MICRO_DEPOSIT_REVERIFICATION'
  | 'REQUEST_EXCEPTION_WAIVER'
  | 'SYNCHRONIZE_DIRECTORY_PROFILE';

export type ReviewDecision = 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'CANCEL';

export interface ActionActor {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarInitials?: string;
}

export interface ActionAuditEvent {
  id: string;
  timestamp: string;
  actor: ActionActor;
  event: string;
  previousStatus?: ActionStatus;
  newStatus?: ActionStatus;
  notes?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ActionEvidenceRef {
  id: string;
  type: 'GRAPH_EDGE' | 'AUDIT_LOG' | 'TELEMETRY' | 'CYPHER_RECORD';
  sourceSystem: string;
  title: string;
  description: string;
  timestamp?: string;
  recordIdentifier?: string;
}

export interface TargetIntegration {
  name: string;
  system: string;
  isLive: boolean;
  adapterType: 'SLACK_WEBHOOK' | 'JIRA_SERVICE_MANAGEMENT' | 'OKTA_PROVISIONING_API' | 'AWS_IAM_API' | 'DEMO_ADAPTER';
  endpointNote: string;
  simulatedPayload?: Record<string, unknown>;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  workflowId: string;
  workflowTitle: string;
  department: string;
  investigationId: string;
  actionType: ActionType;
  urgency: ActionUrgency;
  status: ActionStatus;
  
  // Blocker context from graph investigation
  blocker: {
    name: string;
    system: string;
    ticketId?: string;
    durationStalled: string;
    responsibleParty: string;
    responsibleRole: string;
    authorizedEntityId?: string;
  };

  // Resolution definition
  proposedResolution: string;
  expectedOutcome: string;
  requiredAuthorizations: string[];
  impactAssessment: string;

  // Evidence provenance
  evidenceReferences: ActionEvidenceRef[];

  // External execution interface
  targetIntegration: TargetIntegration;

  // Complete audit history
  auditTrail: ActionAuditEvent[];

  // Outcome verification coupling (leads to Module 6)
  verificationRequirement: {
    metric: string;
    targetCondition: string;
    sourceSystem: string;
    verificationStatus: 'NOT_VERIFIED' | 'AWAITING_TELEMETRY' | 'VERIFIED' | 'FAILED_PRECONDITION';
    notes: string;
  };

  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  completedAt?: string;
}

export interface ActionFilters {
  status?: ActionStatus | 'ALL';
  urgency?: ActionUrgency | 'ALL';
  workflowId?: string | 'ALL';
  searchQuery?: string;
}

export interface ActionStateTransitionPayload {
  decision: ReviewDecision;
  actor: ActionActor;
  notes?: string;
}

export interface ActionExecutionResponse {
  success: boolean;
  actionId: string;
  status: ActionStatus;
  message: string;
  executionTimestamp: string;
  auditEvent: ActionAuditEvent;
  isSimulated: boolean;
}
