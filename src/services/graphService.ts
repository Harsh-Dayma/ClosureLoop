import { onboardingGraphData } from '../data/mockGraphData';
import type { 
  FalkorGraphData, 
  GraphFilterParams, 
  GraphResponseEnvelope 
} from '../types/graph';
import { MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

export interface FalkorHealthResponse {
  status: 'healthy' | 'degraded';
  falkorConnected: boolean;
  host: string;
  port: number;
  graphName: string;
  checkedAt: string;
  error?: string | null;
  instructions?: string;
}

/**
 * Graph Service Boundary
 * 
 * Secure frontend service connecting to backend endpoints (/api/health, /api/graph, /api/cypher, /api/graph/seed).
 * Never connects directly to raw Redis/FalkorDB TCP sockets from the browser.
 */
export class GraphService {
  /**
   * Check FalkorDB health and connection status via backend
   */
  public static async checkHealth(): Promise<FalkorHealthResponse> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`Health check returned ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        status: 'degraded',
        falkorConnected: false,
        host: '127.0.0.1',
        port: 6379,
        graphName: 'closureloop',
        checkedAt: new Date().toISOString(),
        error: err.message || 'Failed to reach backend API'
      };
    }
  }

  /**
   * Fetch dependency graph topology with filters from the backend
   */
  public static async getGraphTopology(filter?: GraphFilterParams): Promise<GraphResponseEnvelope> {
    try {
      const params = new URLSearchParams();
      if (filter?.workflowId) params.append('workflowId', filter.workflowId);
      if (filter?.entityType && filter.entityType !== 'ALL') params.append('entityType', filter.entityType);
      if (filter?.status && filter.status !== 'ALL') params.append('status', filter.status);
      if (filter?.onlyBlockers) params.append('onlyBlockers', 'true');
      if (filter?.userRole) params.append('userRole', filter.userRole);

      const url = `/api/graph${params.toString() ? `?${params.toString()}` : ''}`;
      const headers: Record<string, string> = {};
      if (filter?.userRole) {
        headers['x-user-role'] = filter.userRole;
      }

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        throw new Error(`Graph API returned status ${res.status}`);
      }

      const envelope: GraphResponseEnvelope = await res.json();
      return envelope;
    } catch (err: any) {
      // Graceful fallback to client-side demo dataset if backend is unreachable
      let fallbackGraph = onboardingGraphData;
      if (filter?.userRole === 'EMPLOYEE') {
        const employeeAllowedNodeIds = new Set([
          'wf-onboarding',
          'person-employee',
          'task-employee-record',
          'sys-it-account',
          'appr-security',
          'task-verification',
          'wf-001',
          'emp-90214',
          'tsk-001',
          'tsk-002',
          'tsk-004',
          'sec-tkt-9912',
          'bo-001',
          'out-001'
        ]);
        const scopedNodes = onboardingGraphData.nodes.filter((n) => employeeAllowedNodeIds.has(n.id));
        const activeIds = new Set(scopedNodes.map((n) => n.id));
        const scopedEdges = onboardingGraphData.edges.filter((e) => activeIds.has(e.source) && activeIds.has(e.target));
        fallbackGraph = {
          ...onboardingGraphData,
          nodes: scopedNodes,
          edges: scopedEdges
        };
      }
      return {
        graph: fallbackGraph,
        isDemo: true,
        databaseConnected: false,
        message: `Offline mode: ${err.message}. Serving local demo graph.`,
        error: err.message,
        queryStats: {
          nodesCount: fallbackGraph.nodes.length,
          edgesCount: fallbackGraph.edges.length,
          executionTimeMs: 2,
          cypherQuery: 'MATCH (n)-[r]->(m) RETURN n, r, m'
        }
      };
    }
  }

  /**
   * Execute parameterized Cypher query on backend
   */
  public static async executeCypher(
    query: string, 
    params?: Record<string, any>,
    userRole?: string
  ): Promise<any> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userRole) {
        headers['x-user-role'] = userRole;
      }

      const res = await fetch('/api/cypher', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, params })
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to execute query'
      };
    }
  }

  /**
   * Request backend to seed FalkorDB with onboarding dataset
   */
  public static async seedFalkorDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/graph/seed', { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to trigger database seeding'
      };
    }
  }

  /**
   * Converts FalkorDB graph schema into React Flow format with rich styling
   */
  public static convertToFlowElements(graphData: FalkorGraphData): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = graphData.nodes.map((n) => ({
      id: n.id,
      type: n.type || 'customEntity',
      position: n.position,
      data: n.data,
      draggable: true
    }));

    const edges: Edge[] = graphData.edges.map((e) => {
      const isCritical = Boolean(e.isCriticalPath);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: Boolean(e.animated),
        className: isCritical ? 'animated-critical-edge' : '',
        label: e.label || e.relationship.toLowerCase().replace(/_/g, ' '),
        labelStyle: {
          fill: isCritical ? '#b45309' : '#475569',
          fontWeight: 600,
          fontSize: 10
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.95,
          rx: 4,
          ry: 4
        },
        labelBgPadding: [6, 2] as [number, number],
        style: {
          stroke: isCritical ? '#f59e0b' : '#94a3b8',
          strokeWidth: isCritical ? 2.5 : 1.5,
          opacity: isCritical ? 1 : 0.85
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: isCritical ? '#f59e0b' : '#94a3b8'
        }
      };
    });

    return { nodes, edges };
  }

  /**
   * OpenCypher query template generator for inspecting entity relationships
   */
  public static generateCypherForNode(nodeId: string): string {
    return `// FalkorDB Cypher traversal for entity: ${nodeId}
MATCH (n {id: "${nodeId}"})
OPTIONAL MATCH (n)-[r]->(target)
OPTIONAL MATCH (source)-[r_in]->(n)
RETURN n, r, target, source, r_in
LIMIT 50;`;
  }
}
