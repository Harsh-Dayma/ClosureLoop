import { falkorClient } from './falkorClient.js';
import type { 
  FalkorGraphData, 
  GraphFilterParams, 
  GraphResponseEnvelope,
  EntityType,
  NodeStatus
} from '../src/types/graph.js';

// ==============================================================================
// Fallback In-Memory Graph Dataset (Active when FalkorDB is offline)
// Demonstrates the Jordan Hayes onboarding bottleneck with exact relational integrity
// ==============================================================================
const fallbackGraphData: FalkorGraphData = {
  graphId: 'closureloop-core-graph',
  name: 'Enterprise Workflow & Dependency Property Graph',
  description: 'Cross-system dependency graph connecting Workday, Okta, Jira Service Management, AWS IAM, and GitHub Enterprise.',
  nodes: [
    {
      id: 'wf-001',
      type: 'customEntity',
      position: { x: 50, y: 150 },
      data: {
        label: 'Employee Onboarding - Jordan Hayes',
        entityType: 'WORKFLOW' as EntityType,
        status: 'BLOCKED' as NodeStatus,
        sublabel: 'HR / IT / Security Lifecycle',
        owner: 'HR Operations',
        team: 'People Operations',
        blockerReason: 'Blocked downstream on required Production Core Services AWS IAM role approval from Sarah Lin.',
        confidence: 0.98,
        lastUpdated: '12m ago',
        metadata: {
          'Workflow ID': 'wf-001',
          'Target Outcome': 'First Code Commit Telemetry Verified',
          'Days Stalled': 4.2,
          'Department': 'Core Platform Engineering'
        },
        cypherQuery: 'MATCH (w:Workflow {id: "wf-001"}) RETURN w'
      }
    },
    {
      id: 'emp-90214',
      type: 'customEntity',
      position: { x: 280, y: 40 },
      data: {
        label: 'Jordan Hayes',
        entityType: 'EMPLOYEE' as EntityType,
        status: 'ACTIVE' as NodeStatus,
        sublabel: 'Staff Platform Engineer',
        owner: 'David Chen',
        team: 'Engineering',
        confidence: 1.0,
        lastUpdated: '4d ago',
        metadata: {
          'Employee ID': 'EMP-90214',
          'Email': 'jordan.hayes@closureloop.io',
          'Start Date': '2026-10-14',
          'Provisioning Status': 'PROFILE_ACTIVE'
        },
        cypherQuery: 'MATCH (e:Employee {id: "emp-90214"}) RETURN e'
      }
    },
    {
      id: 'tsk-001',
      type: 'customEntity',
      position: { x: 280, y: 220 },
      data: {
        label: 'Workday HR Profile Creation',
        entityType: 'TASK' as EntityType,
        status: 'COMPLETED' as NodeStatus,
        sublabel: 'Workday HCM',
        owner: 'HR Operations',
        team: 'People Operations',
        confidence: 1.0,
        lastUpdated: '4d ago',
        metadata: {
          'External ID': 'WD-REC-88410',
          'Completed At': '2026-10-14T09:00:00Z',
          'Source System': 'Workday Human Capital Management'
        },
        cypherQuery: 'MATCH (t:Task {id: "tsk-001"}) RETURN t'
      }
    },
    {
      id: 'tsk-002',
      type: 'customEntity',
      position: { x: 500, y: 220 },
      data: {
        label: 'Okta Identity & SSO Provisioning',
        entityType: 'TASK' as EntityType,
        status: 'COMPLETED' as NodeStatus,
        sublabel: 'Okta Enterprise Identity',
        owner: 'Automated Lifecycle Engine',
        team: 'IT Operations',
        confidence: 1.0,
        lastUpdated: '4d ago',
        metadata: {
          'External ID': 'OKTA-USR-109283',
          'Username': 'jordan.hayes@closureloop.io',
          'Completed At': '2026-10-14T10:15:00Z'
        },
        cypherQuery: 'MATCH (t:Task {id: "tsk-002"}) RETURN t'
      }
    },
    {
      id: 'tsk-003',
      type: 'customEntity',
      position: { x: 720, y: 220 },
      data: {
        label: 'Manager Day-1 Checklist & Setup',
        entityType: 'TASK' as EntityType,
        status: 'COMPLETED' as NodeStatus,
        sublabel: 'Jira Service Management',
        owner: 'David Chen',
        team: 'Engineering',
        confidence: 1.0,
        lastUpdated: '3.8d ago',
        metadata: {
          'Ticket': 'IT-TKT-5519',
          'Completed At': '2026-10-14T14:30:00Z',
          'Sign-off Authority': 'David Chen (Director)'
        },
        cypherQuery: 'MATCH (t:Task {id: "tsk-003"})-[:ASSIGNED_TO]->(m:Person) RETURN t, m'
      }
    },
    {
      id: 'acc-aws-iam',
      type: 'customEntity',
      position: { x: 940, y: 220 },
      data: {
        label: 'Production Core AWS IAM Role',
        entityType: 'ACCESS' as EntityType,
        status: 'BLOCKED' as NodeStatus,
        sublabel: 'AWS Identity Center / Okta',
        owner: 'Sarah Lin',
        team: 'SecOps',
        blockerReason: 'Access request requires pending Tier-1 security sign-off (SEC-TKT-9912).',
        confidence: 0.99,
        lastUpdated: '4.2d ago',
        metadata: {
          'Role ARN': 'arn:aws:iam::102938475610:role/CorePlatformDev',
          'Status': 'UNAVAILABLE',
          'Target Environment': 'production'
        },
        cypherQuery: 'MATCH (a:Access {id: "acc-aws-iam"}) RETURN a'
      }
    },
    {
      id: 'sec-tkt-9912',
      type: 'customEntity',
      position: { x: 940, y: 400 },
      data: {
        label: 'Production IAM Access Security Sign-off',
        entityType: 'APPROVAL' as EntityType,
        status: 'CRITICAL' as NodeStatus,
        sublabel: 'Jira Service Management',
        owner: 'Sarah Lin',
        team: 'Information Security',
        blockerReason: 'SLA Breached: 4d 6h elapsed against 24h target. Sarah Lin is the sole authorized approver.',
        confidence: 1.0,
        lastUpdated: '4.2d ago',
        metadata: {
          'Ticket ID': 'SEC-TKT-9912',
          'Elapsed Hours': 102,
          'SLA Threshold': '24 Hours',
          'Status': 'PENDING_APPROVAL',
          'Is Critical Bottleneck': 'true'
        },
        cypherQuery: 'MATCH (app:Approval {id: "sec-tkt-9912"})-[:ASSIGNED_TO]->(p:Person) RETURN app, p'
      }
    },
    {
      id: 'usr-008',
      type: 'customEntity',
      position: { x: 1180, y: 400 },
      data: {
        label: 'Sarah Lin',
        entityType: 'PERSON' as EntityType,
        status: 'ACTIVE' as NodeStatus,
        sublabel: 'SecOps Lead & Application Owner',
        owner: 'Information Security',
        team: 'SecOps',
        confidence: 1.0,
        lastUpdated: '1h ago',
        metadata: {
          'Email': 'sarah.lin@closureloop.io',
          'Role': 'SecOps Lead & Tier-1 IAM Signer',
          'Authorized System': 'Production Core Services'
        },
        cypherQuery: 'MATCH (p:Person {id: "usr-008"}) RETURN p'
      }
    },
    {
      id: 'app-core-svc',
      type: 'customEntity',
      position: { x: 1180, y: 220 },
      data: {
        label: 'Production Core Microservices Cluster',
        entityType: 'APPLICATION' as EntityType,
        status: 'ACTIVE' as NodeStatus,
        sublabel: 'EKS Kubernetes / AWS',
        owner: 'Core Platform Team',
        team: 'Platform',
        confidence: 1.0,
        lastUpdated: '2d ago',
        metadata: {
          'Cluster': 'k8s-prod-us-east-1',
          'Tier': 'Tier-1 High Availability',
          'Repository': 'github.com/closureloop/core-services'
        },
        cypherQuery: 'MATCH (app:Application {id: "app-core-svc"}) RETURN app'
      }
    },
    {
      id: 'tsk-004',
      type: 'customEntity',
      position: { x: 1400, y: 220 },
      data: {
        label: 'First Git Commit to Production Repository',
        entityType: 'TASK' as EntityType,
        status: 'BLOCKED' as NodeStatus,
        sublabel: 'GitHub Enterprise',
        owner: 'Jordan Hayes',
        team: 'Engineering',
        blockerReason: 'Jordan Hayes cannot push commits because IAM write credentials have not been issued.',
        confidence: 0.99,
        lastUpdated: '4d ago',
        metadata: {
          'Target Repository': 'closureloop/core-services',
          'Commits Verified': 0,
          'Branch': 'main'
        },
        cypherQuery: 'MATCH (t:Task {id: "tsk-004"}) RETURN t'
      }
    },
    {
      id: 'bo-001',
      type: 'customEntity',
      position: { x: 1620, y: 220 },
      data: {
        label: 'First Code Commit Telemetry Verified',
        entityType: 'BUSINESS_OUTCOME' as EntityType,
        status: 'CRITICAL' as NodeStatus,
        sublabel: 'Autonomous Verification Metric',
        owner: 'Engineering Leadership',
        team: 'Core Platform',
        blockerReason: '0 commits verified via GitHub Enterprise audit logs. Target: >= 1 commit.',
        confidence: 1.0,
        lastUpdated: '15m ago',
        metadata: {
          'Condition': 'FAILED_PRECONDITION',
          'Current Value': 0,
          'Target Value': 1,
          'Verification System': 'GitHub Enterprise Webhook'
        },
        cypherQuery: 'MATCH (bo:BusinessOutcome {id: "bo-001"}) RETURN bo'
      }
    }
  ],
  edges: [
    {
      id: 'e-wf-outcome',
      source: 'wf-001',
      target: 'bo-001',
      relationship: 'TARGETS_OUTCOME',
      label: 'targets outcome',
      isCriticalPath: false
    },
    {
      id: 'e-wf-emp',
      source: 'wf-001',
      target: 'emp-90214',
      relationship: 'FOR_EMPLOYEE',
      label: 'onboards'
    },
    {
      id: 'e-wf-t1',
      source: 'wf-001',
      target: 'tsk-001',
      relationship: 'HAS_STAGE',
      label: 'stage 1'
    },
    {
      id: 'e-t1-t2',
      source: 'tsk-001',
      target: 'tsk-002',
      relationship: 'TRIGGERS_PROVISIONING',
      label: 'triggers'
    },
    {
      id: 'e-t2-t3',
      source: 'tsk-002',
      target: 'tsk-003',
      relationship: 'ENABLES_STAGE',
      label: 'enables'
    },
    {
      id: 'e-t3-acc',
      source: 'tsk-003',
      target: 'acc-aws-iam',
      relationship: 'PRECEDES',
      label: 'precedes'
    },
    {
      id: 'e-acc-sec',
      source: 'acc-aws-iam',
      target: 'sec-tkt-9912',
      relationship: 'REQUIRES_SECURITY_SIGNOFF',
      label: 'requires sign-off',
      isCriticalPath: true,
      animated: true
    },
    {
      id: 'e-sec-usr',
      source: 'sec-tkt-9912',
      target: 'usr-008',
      relationship: 'ASSIGNED_TO',
      label: 'assigned to owner',
      isCriticalPath: true,
      animated: true
    },
    {
      id: 'e-sec-app',
      source: 'sec-tkt-9912',
      target: 'app-core-svc',
      relationship: 'CONTROLS_ACCESS_TO',
      label: 'gates access'
    },
    {
      id: 'e-app-t4',
      source: 'app-core-svc',
      target: 'tsk-004',
      relationship: 'ENABLES_STAGE',
      label: 'enables commit',
      isCriticalPath: true
    },
    {
      id: 'e-t4-outcome',
      source: 'tsk-004',
      target: 'bo-001',
      relationship: 'FULFILLS_OUTCOME',
      label: 'fulfills target',
      isCriticalPath: true,
      animated: true
    }
  ]
};

export class GraphRepository {
  /**
   * Retrieves the graph topology.
   * If FalkorDB is connected, executes real Cypher query and formats nodes/edges.
   * If FalkorDB is offline, returns fallback demo graph data with transparent status.
   */
  public async getGraphTopology(filter?: GraphFilterParams): Promise<GraphResponseEnvelope> {
    const health = await falkorClient.checkHealth();

    if (!health.connected) {
      // Apply filters to in-memory fallback
      let filteredNodes = [...fallbackGraphData.nodes];

      if (filter?.entityType && filter.entityType !== 'ALL') {
        filteredNodes = filteredNodes.filter((n) => n.data.entityType === filter.entityType);
      }

      if (filter?.status && filter.status !== 'ALL') {
        filteredNodes = filteredNodes.filter((n) => n.data.status === filter.status);
      }

      if (filter?.onlyBlockers) {
        filteredNodes = filteredNodes.filter(
          (n) => n.data.status === 'BLOCKED' || n.data.status === 'CRITICAL'
        );
      }

      const activeNodeIds = new Set(filteredNodes.map((n) => n.id));
      const filteredEdges = fallbackGraphData.edges.filter(
        (e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target)
      );

      return {
        graph: {
          ...fallbackGraphData,
          nodes: filteredNodes,
          edges: filteredEdges
        },
        isDemo: true,
        databaseConnected: false,
        message: `FalkorDB is offline (${health.error || 'Connection refused'}). Serving isolated demonstration graph.`,
        error: health.error,
        queryStats: {
          nodesCount: filteredNodes.length,
          edgesCount: filteredEdges.length,
          executionTimeMs: 4,
          cypherQuery: 'MATCH (n)-[r]->(m) RETURN n, r, m'
        }
      };
    }

    // FalkorDB is actively connected: execute real Cypher queries!
    try {
      const cypher = `
        MATCH (n)
        OPTIONAL MATCH (n)-[r]->(m)
        RETURN n, labels(n) AS nodeLabels, r, type(r) AS relType, m, labels(m) AS targetLabels
        LIMIT 250
      `;

      const result = await falkorClient.executeQuery(cypher);

      if (!result.success) {
        throw new Error(result.error || 'Cypher query failed');
      }

      // Parse FalkorDB response rows into nodes and edges
      const nodesMap = new Map<string, any>();
      const edgesList: any[] = [];

      for (const row of result.data) {
        const sourceNode = row[0];
        const edge = row[2];
        const targetNode = row[4];

        if (sourceNode && sourceNode.properties) {
          const id = sourceNode.properties.id || String(sourceNode.id);
          if (!nodesMap.has(id)) {
            nodesMap.set(id, {
              id,
              type: 'customEntity',
              position: { x: Math.random() * 800 + 100, y: Math.random() * 400 + 100 },
              data: {
                label: sourceNode.properties.name || sourceNode.properties.title || id,
                entityType: (row[1]?.[0] || 'WORKFLOW').toUpperCase() as EntityType,
                status: (sourceNode.properties.status || 'ACTIVE').toUpperCase() as NodeStatus,
                owner: sourceNode.properties.assignee || sourceNode.properties.owner,
                metadata: sourceNode.properties
              }
            });
          }
        }

        if (edge && targetNode && targetNode.properties) {
          const targetId = targetNode.properties.id || String(targetNode.id);
          if (!nodesMap.has(targetId)) {
            nodesMap.set(targetId, {
              id: targetId,
              type: 'customEntity',
              position: { x: Math.random() * 800 + 100, y: Math.random() * 400 + 100 },
              data: {
                label: targetNode.properties.name || targetNode.properties.title || targetId,
                entityType: (row[5]?.[0] || 'TASK').toUpperCase() as EntityType,
                status: (targetNode.properties.status || 'ACTIVE').toUpperCase() as NodeStatus,
                owner: targetNode.properties.assignee || targetNode.properties.owner,
                metadata: targetNode.properties
              }
            });
          }

          const sourceId = sourceNode.properties.id || String(sourceNode.id);
          const relType = row[3] || 'RELATED_TO';
          edgesList.push({
            id: `e-${sourceId}-${targetId}-${relType}`,
            source: sourceId,
            target: targetId,
            relationship: relType,
            label: relType.toLowerCase().replace(/_/g, ' ')
          });
        }
      }

      const liveGraph: FalkorGraphData = {
        graphId: health.graphName,
        name: `Live FalkorDB: ${health.graphName}`,
        description: `Direct Cypher graph retrieved from FalkorDB at ${health.host}:${health.port}`,
        nodes: Array.from(nodesMap.values()),
        edges: edgesList
      };

      return {
        graph: liveGraph,
        isDemo: false,
        databaseConnected: true,
        message: 'Successfully retrieved live graph topology from FalkorDB.',
        queryStats: {
          nodesCount: liveGraph.nodes.length,
          edgesCount: liveGraph.edges.length,
          executionTimeMs: result.executionTimeMs,
          cypherQuery: cypher.trim()
        }
      };
    } catch (err: any) {
      return {
        graph: fallbackGraphData,
        isDemo: true,
        databaseConnected: true,
        message: `FalkorDB connected, but query failed (${err.message}). Using fallback schema.`,
        error: err.message
      };
    }
  }

  /**
   * Seeds the real FalkorDB graph using the schema in seedFalkor.cypher
   */
  public async seedDatabase(): Promise<{ success: boolean; message: string; executionTimeMs?: number }> {
    const health = await falkorClient.checkHealth();
    if (!health.connected) {
      return {
        success: false,
        message: `Cannot seed FalkorDB: Database is offline at ${health.host}:${health.port}.`
      };
    }

    try {
      const client = await falkorClient.getClient();
      const graph = client.selectGraph(health.graphName);
      
      // Execute the seed Cypher commands in sequence
      await graph.query('MATCH (n) DETACH DELETE n');
      
      await graph.query(`
        CREATE (wf:Workflow {id: 'wf-001', title: 'Employee Onboarding - Jordan Hayes', department: 'Engineering', status: 'BLOCKED'})
        CREATE (outcome:BusinessOutcome {id: 'bo-001', name: 'First Code Commit Telemetry Verified', status: 'FAILED_PRECONDITION', target: 1, current: 0})
        CREATE (emp:Employee {id: 'emp-90214', name: 'Jordan Hayes', role: 'Staff Platform Engineer', email: 'jordan.hayes@closureloop.io'})
        CREATE (t1:Task {id: 'tsk-001', name: 'Workday HR Profile Creation', system: 'Workday', status: 'COMPLETED'})
        CREATE (t2:Task {id: 'tsk-002', name: 'Okta Identity & SSO Provisioning', system: 'Okta', status: 'COMPLETED'})
        CREATE (t3:Task {id: 'tsk-003', name: 'Manager Day-1 Checklist', system: 'Jira Service Management', status: 'COMPLETED'})
        CREATE (mgr:Person {id: 'usr-104', name: 'David Chen', role: 'Engineering Director'})
        CREATE (acc:Access {id: 'acc-aws-iam', name: 'Production Core Services AWS IAM Role', status: 'UNAVAILABLE'})
        CREATE (app:Approval {id: 'sec-tkt-9912', name: 'Production IAM Access Security Sign-off', status: 'PENDING', isBottleneck: true})
        CREATE (approver:Person {id: 'usr-008', name: 'Sarah Lin', role: 'SecOps Lead & Application Owner', email: 'sarah.lin@closureloop.io'})
        CREATE (appSys:Application {id: 'app-core-svc', name: 'Production Core Microservices Cluster'})
        CREATE (tFinal:Task {id: 'tsk-004', name: 'First Git Commit to Production Repository', status: 'BLOCKED'})
        CREATE (wf)-[:TARGETS_OUTCOME]->(outcome)
        CREATE (wf)-[:FOR_EMPLOYEE]->(emp)
        CREATE (wf)-[:HAS_STAGE]->(t1)
        CREATE (t1)-[:TRIGGERS_PROVISIONING]->(t2)
        CREATE (t2)-[:ENABLES_STAGE]->(t3)
        CREATE (t3)-[:ASSIGNED_TO]->(mgr)
        CREATE (t3)-[:PRECEDES]->(acc)
        CREATE (acc)-[:REQUIRES_SECURITY_SIGNOFF]->(app)
        CREATE (app)-[:ASSIGNED_TO]->(approver)
        CREATE (app)-[:CONTROLS_ACCESS_TO]->(appSys)
        CREATE (appSys)-[:ENABLES_STAGE]->(tFinal)
        CREATE (tFinal)-[:FULFILLS_OUTCOME]->(outcome)
      `);

      return {
        success: true,
        message: 'Successfully seeded FalkorDB graph with employee onboarding scenario.'
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Seeding failed: ${err.message}`
      };
    }
  }
}

export const graphRepository = new GraphRepository();
