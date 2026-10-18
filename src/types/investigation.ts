import type { EntityType, NodeStatus } from './graph';

export type InvestigationStatus = 
  | 'ROOT_CAUSE_CONFIRMED'
  | 'INVESTIGATING'
  | 'HYPOTHESIS_PENDING'
  | 'CLEARED';

export type FindingCategory = 
  | 'CONFIRMED_FINDING'
  | 'HYPOTHESIS'
  | 'UNAVAILABLE_DATA';

export interface InvestigationFinding {
  id: string;
  category: FindingCategory;
  title: string;
  description: string;
  evidenceRef?: string;
  confidence?: number;
}

export interface DependencyPathStep {
  id: string;
  order: number;
  entityId: string;
  entityType: EntityType;
  name: string;
  systemOrRole: string;
  status: NodeStatus;
  isBottleneck?: boolean;
  relationshipToNext?: string;
  details?: string;
}

export interface EvidenceRecord {
  id: string;
  type: 'GRAPH_EDGE' | 'AUDIT_LOG' | 'POLICY_RULE' | 'TELEMETRY_PROBE';
  sourceSystem: string;
  timestamp: string;
  summary: string;
  cypherRelationship?: string;
  verified: boolean;
  rawMetadata?: Record<string, string | number | boolean>;
}

export interface InvestigationCase {
  id: string;
  workflowId: string;
  workflowTitle: string;
  department: string;
  status: InvestigationStatus;
  urgency: 'high' | 'medium' | 'low';
  unmetBusinessOutcome: string;
  outcomeVerificationRule: string;
  identifiedBottleneck: {
    name: string;
    entityType: EntityType;
    status: string;
    durationStalled: string;
    impact: string;
  };
  responsibleOwner?: {
    name: string;
    role: string;
    email: string;
    slack?: string;
    authorizationPolicy?: string;
    queueCount?: number;
    backupDelegation?: string;
  };
  dependencyPath: DependencyPathStep[];
  findings: InvestigationFinding[];
  evidence: EvidenceRecord[];
  falkorCypherQuery: string;
  createdAt: string;
  updatedAt: string;
  dataSource: 'DEMO_ADAPTER' | 'LIVE_FALKORDB';
}
