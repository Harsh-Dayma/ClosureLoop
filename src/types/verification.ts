/**
 * ClosureLoop — Module 6: Verification & Memory Type Definitions
 * 
 * Defines data structures for trustworthy business outcome verification,
 * evidence inspection, chronological audit history, and long-term enterprise graph memory.
 */

export type VerificationCheckStatus = 
  | 'PASSED'
  | 'FAILED'
  | 'INCONCLUSIVE'
  | 'UNAVAILABLE'
  | 'NOT_EVALUATED';

export type VerificationCategory = 
  | 'IDENTITY'
  | 'MANAGEMENT'
  | 'SECURITY_APPROVAL'
  | 'INFRASTRUCTURE_ACCESS'
  | 'BUSINESS_OUTCOME';

export type WorkflowVerificationStatus = 
  | 'VERIFIED_COMPLETE'
  | 'INCOMPLETE'
  | 'INCONCLUSIVE'
  | 'FAILED'
  | 'AWAITING_PREREQUISITES';

export interface VerificationCheck {
  id: string;
  name: string;
  category: VerificationCategory;
  mandatory: boolean;
  status: VerificationCheckStatus;
  evidenceSource: string;
  evidenceType: 'REST_API' | 'AUDIT_LOG' | 'WEBHOOK_EVENT' | 'GRAPH_TRAVERSAL' | 'SCIM_TELEMETRY';
  evidenceRecordId?: string;
  observedValue: string | number | boolean;
  expectedCondition: string;
  evaluationDetails: string;
  verifiedAt: string;
  isStale: boolean;
  confidence: number; // 0.0 - 1.0
  isLiveSource: boolean; // true = live system, false = demo adapter
  externalLink?: string;
}

export interface VerificationBlockerContext {
  blocker: string;
  system: string;
  responsibleParty: string;
  responsibleRole: string;
  slaBreach?: string;
  ticketId?: string;
}

export interface WorkflowVerificationRecord {
  id: string;
  workflowId: string;
  workflowTitle: string;
  department: string;
  targetOutcome: string;
  overallStatus: WorkflowVerificationStatus;
  completionPercentage: number; // 0 - 100
  passedChecksCount: number;
  totalChecksCount: number;
  mandatoryChecksPassed: boolean;
  lastVerifiedAt: string;
  verifiedBy: string;
  summary: string;
  checks: VerificationCheck[];
  relatedActionId?: string;
  relatedInvestigationId?: string;
  blockerContext?: VerificationBlockerContext;
  isSimulated: boolean;
}

export type VerificationEventType = 
  | 'INVESTIGATION_OPENED'
  | 'ACTION_PROPOSED'
  | 'HUMAN_DECISION'
  | 'ACTION_DISPATCHED'
  | 'EVIDENCE_INGESTED'
  | 'VERIFICATION_RUN'
  | 'OUTCOME_CHANGED'
  | 'MEMORY_ARCHIVED';

export interface VerificationEvent {
  id: string;
  workflowId: string;
  timestamp: string;
  type: VerificationEventType;
  title: string;
  description: string;
  actor: string;
  actorRole?: string;
  badgeVariant: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  evidenceRef?: string;
  metadata?: Record<string, any>;
}

export interface HistoricalMemoryRecord {
  id: string;
  incidentTitle: string;
  workflowId: string;
  workflowType: string;
  department: string;
  rootCauseCategory: string;
  patternSignature: string;
  resolutionTaken: string;
  timeToResolution: string;
  outcomeVerified: boolean;
  verificationSource: string;
  occurredAt: string;
  resolvedAt: string;
  keyLearnings: string[];
  confidenceScore: number;
  relatedActors: string[];
}

export interface VerificationFilterParams {
  status?: string;
  department?: string;
  searchQuery?: string;
}

export type VerificationScenario = 
  | 'DEFAULT'
  | 'APPROVAL_WITHOUT_ACCESS' // Case 2
  | 'MISSING_EVIDENCE'        // Case 3
  | 'FAILED_CHECK'            // Case 4
  | 'UNAVAILABLE_INTEGRATION' // Case 5
  | 'ALL_PASSED';             // Case 1

export interface VerificationRunRequest {
  workflowId: string;
  scenario?: VerificationScenario;
  actor?: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
}

export interface VerificationRunResponse {
  success: boolean;
  verificationRecord: WorkflowVerificationRecord;
  previousStatus: WorkflowVerificationStatus;
  newStatus: WorkflowVerificationStatus;
  actionUpdated?: boolean;
  memoryArchived?: boolean;
  message: string;
  executionTimestamp: string;
}

export interface VerificationStats {
  totalWorkflows: number;
  verifiedComplete: number;
  incompleteOrBlocked: number;
  awaitingPrerequisites: number;
  memoryRecordsIndexed: number;
}
