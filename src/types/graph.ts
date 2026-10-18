/**
 * FalkorDB Graph Data Types & Presentation Interfaces
 * Designed to mirror FalkorDB Cypher graph node & edge data structures.
 */

export type EntityType = 
  | 'WORKFLOW'
  | 'TASK'
  | 'EMPLOYEE'
  | 'APPROVAL'
  | 'APPLICATION'
  | 'ACCESS'
  | 'PERSON'
  | 'BUSINESS_OUTCOME'
  | 'SYSTEM'
  | 'VERIFICATION';

export type NodeStatus = 
  | 'COMPLETED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'CRITICAL'
  | 'PENDING'
  | 'UNKNOWN';

export interface GraphFilterParams {
  workflowId?: string;
  entityType?: EntityType | 'ALL';
  status?: NodeStatus | 'ALL';
  onlyBlockers?: boolean;
  userRole?: string;
}

export interface GraphResponseEnvelope {
  graph: FalkorGraphData;
  isDemo: boolean;
  databaseConnected: boolean;
  message?: string;
  error?: string;
  queryStats?: {
    nodesCount: number;
    edgesCount: number;
    executionTimeMs: number;
    cypherQuery?: string;
  };
}

export interface FalkorNodeProperties {
  [key: string]: unknown;
  label: string;
  entityType: EntityType;
  status: NodeStatus;
  sublabel?: string;
  owner?: string;
  team?: string;
  blockerReason?: string;
  confidence?: number;
  lastUpdated?: string;
  metadata?: Record<string, string | number | boolean>;
  /** OpenCypher representation for live query preview */
  cypherQuery?: string;
}

export interface FalkorEdgeProperties {
  id: string;
  source: string;
  target: string;
  relationship: string; // e.g. 'REQUIRES', 'ENABLES', 'RESPONSIBLE_FOR', 'VERIFIES', 'BLOCKS'
  isCriticalPath?: boolean;
  animated?: boolean;
  label?: string;
}

export interface FalkorGraphData {
  graphId: string;
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: FalkorNodeProperties;
  }>;
  edges: FalkorEdgeProperties[];
}
