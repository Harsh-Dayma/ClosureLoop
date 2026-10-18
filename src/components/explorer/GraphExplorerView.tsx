import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import type { NodeMouseHandler, EdgeMouseHandler, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { CustomDependencyNode } from '../graph/CustomDependencyNode.js';
import { GraphService, type FalkorHealthResponse } from '../../services/graphService.js';
import type { 
  FalkorNodeProperties, 
  EntityType, 
  NodeStatus, 
  GraphResponseEnvelope 
} from '../../types/graph.js';
import type { UserPersona } from '../../types/role.js';
import {
  Network,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Database,
  Copy,
  Check,
  X,
  ExternalLink,
  Info,
  Zap,
  ChevronRight,
  Sparkles,
  Lock,
  ShieldCheck
} from 'lucide-react';

interface GraphExplorerViewProps {
  onBackToOverview: () => void;
  onOpenInvestigation: (workflowTitle: string, blocker: string, workflowId?: string) => void;
  onOpenActionCenter?: (actionId?: string) => void;
  onSelectWorkflow?: (workflowId: string) => void;
  initialWorkflowId?: string;
  currentPersona?: UserPersona;
}

export const GraphExplorerView: React.FC<GraphExplorerViewProps> = ({
  onBackToOverview,
  onOpenInvestigation,
  onOpenActionCenter,
  initialWorkflowId = 'wf-001',
  currentPersona
}) => {
  // Graph Data & Envelope
  const [graphEnvelope, setGraphEnvelope] = useState<GraphResponseEnvelope | null>(null);
  const [health, setHealth] = useState<FalkorHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const [showFalkorPrereqsModal, setShowFalkorPrereqsModal] = useState<boolean>(false);

  // Filters State
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(initialWorkflowId);
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<NodeStatus | 'ALL'>('ALL');
  const [onlyBlockers, setOnlyBlockers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Inspector Panel State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('sec-tkt-9912');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'dependencies' | 'cypher' | 'remediation'>('overview');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [copiedCypher, setCopiedCypher] = useState<boolean>(false);
  const [reminderDispatched, setReminderDispatched] = useState<boolean>(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Register custom node types
  const nodeTypes = useMemo(() => ({
    customEntity: CustomDependencyNode,
    customDependency: CustomDependencyNode
  }), []);

  // Manual refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Synchronize graph data from backend
  useEffect(() => {
    let isCancelled = false;

    const runFetch = async () => {
      try {
        const [healthStatus, envelope] = await Promise.all([
          GraphService.checkHealth(),
          GraphService.getGraphTopology({
            workflowId: selectedWorkflowId === 'ALL' ? undefined : selectedWorkflowId,
            entityType: selectedEntityType,
            status: selectedStatus,
            onlyBlockers
          })
        ]);

        if (isCancelled) return;

        setHealth(healthStatus);
        setGraphEnvelope(envelope);

        const flowElements = GraphService.convertToFlowElements(envelope.graph);
        let filteredNodes = flowElements.nodes;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filteredNodes = flowElements.nodes.filter((n) => {
            const d = n.data as unknown as FalkorNodeProperties;
            return (
              n.id.toLowerCase().includes(q) ||
              d.label.toLowerCase().includes(q) ||
              d.owner?.toLowerCase().includes(q) ||
              d.sublabel?.toLowerCase().includes(q)
            );
          });
        }

        const activeIds = new Set(filteredNodes.map((n) => n.id));
        const filteredEdges = flowElements.edges.filter(
          (e) => activeIds.has(e.source) && activeIds.has(e.target)
        );

        setNodes(filteredNodes);
        setEdges(filteredEdges);

        if (!selectedNodeId || !activeIds.has(selectedNodeId)) {
          const bottleneck = filteredNodes.find((n) => {
            const d = n.data as unknown as FalkorNodeProperties;
            return d.status === 'CRITICAL' || d.status === 'BLOCKED';
          });
          if (bottleneck) {
            setSelectedNodeId(bottleneck.id);
          } else if (filteredNodes.length > 0) {
            setSelectedNodeId(filteredNodes[0].id);
          } else {
            setSelectedNodeId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load graph topology:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    runFetch();

    return () => {
      isCancelled = true;
    };
  }, [
    selectedWorkflowId,
    selectedEntityType,
    selectedStatus,
    onlyBlockers,
    searchQuery,
    refreshTrigger,
    selectedNodeId,
    setNodes,
    setEdges
  ]);

  // Active selected node data
  const selectedNodeData = useMemo<FalkorNodeProperties | null>(() => {
    if (!selectedNodeId || !graphEnvelope) return null;
    const node = graphEnvelope.graph.nodes.find((n) => n.id === selectedNodeId);
    return node ? node.data : null;
  }, [selectedNodeId, graphEnvelope]);

  // Node Click
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setIsInspectorOpen(true);
  }, []);

  // Edge Click
  const onEdgeClick: EdgeMouseHandler = useCallback((_, edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setIsInspectorOpen(true);
  }, []);

  // Active selected edge data
  const selectedEdgeData = useMemo(() => {
    if (!selectedEdgeId || !graphEnvelope) return null;
    return graphEnvelope.graph.edges.find((e) => e.id === selectedEdgeId) || null;
  }, [selectedEdgeId, graphEnvelope]);

  // Copy Cypher code
  const handleCopyCypher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Seed FalkorDB handler
  const handleSeedDatabase = async () => {
    setSeedNotice('Seeding FalkorDB graph schema and records...');
    const res = await GraphService.seedFalkorDatabase();
    setSeedNotice(res.message);
    setTimeout(() => setSeedNotice(null), 4000);
    if (res.success) {
      handleRefresh();
    }
  };

  // Focus Jordan Hayes bottleneck handler
  const handleFocusBottleneck = () => {
    setSelectedWorkflowId('wf-001');
    setSelectedEntityType('ALL');
    setSelectedStatus('ALL');
    setOnlyBlockers(false);
    setSearchQuery('');
    setSelectedNodeId('sec-tkt-9912');
    setIsInspectorOpen(true);
  };

  // Dispatch reminder simulation
  const handleDispatchReminder = () => {
    setReminderDispatched(true);
    setTimeout(() => setReminderDispatched(false), 3000);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedWorkflowId('ALL');
    setSelectedEntityType('ALL');
    setSelectedStatus('ALL');
    setOnlyBlockers(false);
    setSearchQuery('');
  };

  // Incoming and Outgoing relationships for selected node
  const nodeConnections = useMemo(() => {
    if (!selectedNodeId || !graphEnvelope) return { incoming: [], outgoing: [] };
    const incoming = graphEnvelope.graph.edges
      .filter((e) => e.target === selectedNodeId)
      .map((e) => {
        const sourceNode = graphEnvelope.graph.nodes.find((n) => n.id === e.source);
        return { edge: e, node: sourceNode };
      });
    const outgoing = graphEnvelope.graph.edges
      .filter((e) => e.source === selectedNodeId)
      .map((e) => {
        const targetNode = graphEnvelope.graph.nodes.find((n) => n.id === e.target);
        return { edge: e, node: targetNode };
      });
    return { incoming, outgoing };
  }, [selectedNodeId, graphEnvelope]);

  // Enterprise Role Authorization Guard for EMPLOYEE
  if (currentPersona?.role === 'EMPLOYEE') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-200 select-none min-h-[600px]">
        <div className="max-w-md w-full bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
              Access Restricted · Least Privilege Policy
            </span>
            <h2 className="text-lg font-bold text-white mt-2">
              Enterprise Graph Explorer Locked
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Role <strong className="text-slate-200 font-mono">EMPLOYEE</strong> ({currentPersona.name}) does not have security authorization to inspect full organizational dependency topologies or execute raw OpenCypher queries on FalkorDB.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Authorized Locations for Employee Role:</span>
            </div>
            <ul className="list-disc list-inside text-slate-400 pl-1 space-y-1 text-[10px]">
              <li>Home Dashboard &rarr; Scoped Personal Onboarding Subgraph</li>
              <li>My Work &rarr; Pending Tasks & Identity Handshakes</li>
              <li>History &rarr; Cryptographic Outcome Verification</li>
            </ul>
          </div>

          <button
            onClick={onBackToOverview}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Return to Home Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden select-none">
      {/* 1. Header & Navigation Shell (from shadcn-admin / next-shadcn-dashboard-starter) */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Breadcrumb & Title */}
          <div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mb-1">
              <button 
                onClick={onBackToOverview}
                className="hover:text-blue-600 transition-colors"
              >
                ClosureLoop
              </button>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span>Intelligence</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-semibold">Graph Explorer (Module 4)</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                Enterprise Graph Explorer
              </h1>

              {/* Live FalkorDB Connectivity Badge */}
              {health?.falkorConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live FalkorDB: {health.graphName}</span>
                  <span className="text-emerald-500 font-mono text-[9px]">({health.host}:{health.port})</span>
                </span>
              ) : (
                <button
                  onClick={() => setShowFalkorPrereqsModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shadow-xs"
                >
                  <Database className="w-3 h-3 text-amber-600" />
                  <span>Demo Graph Mode · FalkorDB Disconnected</span>
                  <Info className="w-3 h-3 text-amber-600" />
                </button>
              )}
            </div>
          </div>

          {/* Context Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleFocusBottleneck}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Focus Jordan Hayes onboarding critical path"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Focus Onboarding Blocker</span>
            </button>

            {health?.falkorConnected && (
              <button
                onClick={handleSeedDatabase}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Seed database schema into FalkorDB"
              >
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Seed FalkorDB</span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
              title="Refresh graph from backend"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Temporary Seed Notice */}
        {seedNotice && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{seedNotice}</span>
          </div>
        )}
      </div>

      {/* 2. Filter & Query Toolbar (shadcn-admin table filter pattern) */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Workflow Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Workflow:</span>
            <select
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="wf-001">Employee Onboarding - Jordan Hayes (wf-001)</option>
              <option value="wf-002">Release Approval v2.14.0 (wf-002)</option>
              <option value="ALL">All Enterprise Workflows (Full Topology)</option>
            </select>
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Entity:</span>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value as any)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="WORKFLOW">Workflow</option>
              <option value="TASK">Task</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="APPROVAL">Approval</option>
              <option value="ACCESS">Access</option>
              <option value="APPLICATION">Application</option>
              <option value="PERSON">Person</option>
              <option value="BUSINESS_OUTCOME">Business Outcome</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Only Blockers Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium ml-1">
            <input
              type="checkbox"
              checked={onlyBlockers}
              onChange={(e) => setOnlyBlockers(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-amber-900 font-semibold">Blockers Only</span>
          </label>
        </div>

        {/* Right Search Box & Graph Stats */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-6 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 md:w-48"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-500 border-l border-slate-200 pl-3">
            <span>{nodes.length} Nodes</span>
            <span>·</span>
            <span>{edges.length} Edges</span>
            {graphEnvelope?.queryStats?.executionTimeMs !== undefined && (
              <>
                <span>·</span>
                <span className="text-emerald-600 font-semibold">
                  {graphEnvelope.queryStats.executionTimeMs}ms Cypher
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Investigation Context Callout Banner */}
      <div className="bg-amber-50/70 border-b border-amber-200/80 px-6 py-2 flex items-center justify-between text-xs text-amber-950">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Bottleneck Demonstration:</strong> Jordan Hayes (EMP-90214) HR & Okta tasks are 100% complete, but target outcome (<strong>First Code Commit</strong>) is blocked by pending Tier-1 security sign-off from <strong>Sarah Lin</strong>.
          </span>
        </div>
        <button
          onClick={() => onOpenInvestigation(
            'Employee onboarding incomplete',
            'Application access approval missing from Sarah Lin',
            'wf-001'
          )}
          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0 ml-4 hover:underline"
        >
          <span>Open in Module 3 Investigation Room</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* 4. Canvas Viewport + Docked Details Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Traversing Property Graph...</h3>
            <p className="text-xs text-slate-500 mt-1">Executing Cypher query against backend repository layer.</p>
          </div>
        ) : nodes.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Network className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Graph Entities Match Your Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Try adjusting your entity type, workflow selection, or search query to explore other nodes.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Main React Flow Canvas */
          <div className="flex-1 h-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={2.0}
              className="bg-[#0b0f19]"
            >
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={18} 
                size={1.2} 
                color="#1e293b" 
              />
              <Controls className="bg-slate-900/90 border-slate-800 text-slate-300 fill-slate-300 rounded-lg shadow-lg" />
              <MiniMap
                className="bg-slate-950/90 border border-slate-800 rounded-lg overflow-hidden shadow-lg"
                nodeColor={(n) => {
                  const d = n.data as unknown as FalkorNodeProperties;
                  if (d?.status === 'CRITICAL' || d?.status === 'BLOCKED') return '#f59e0b';
                  if (d?.status === 'COMPLETED') return '#10b981';
                  if (d?.entityType === 'WORKFLOW') return '#3b82f6';
                  if (d?.entityType === 'EMPLOYEE') return '#06b6d4';
                  return '#64748b';
                }}
                maskColor="rgba(15, 23, 42, 0.7)"
              />

              {/* Floating Legend Panel */}
              <Panel position="top-left" className="m-3">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 px-3 py-2 rounded-lg text-[10px] space-y-1 shadow-md">
                  <div className="font-bold text-white uppercase tracking-wider text-[9px] mb-1">
                    Graph Schema Legend
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Workflow
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      Task
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Approval Blocker
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Owner (Sarah Lin)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Completed / Verified
                    </span>
                  </div>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        )}

        {/* 5. Entity & Relationship Inspector (Right Side Panel) */}
        {isInspectorOpen && (
          <aside className="w-80 md:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 z-10 shadow-lg text-xs overflow-hidden">
            {/* Inspector Header */}
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {selectedEdgeData ? 'RELATIONSHIP EDGE' : selectedNodeData?.entityType || 'ENTITY'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    ID: {selectedEdgeId || selectedNodeId}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate mt-1">
                  {selectedEdgeData 
                    ? selectedEdgeData.relationship
                    : selectedNodeData?.label || 'Select an entity'}
                </h3>
              </div>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-white px-2">
              {(['overview', 'dependencies', 'cypher', 'remediation'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInspectorTab(tab)}
                  className={`py-2 px-3 text-[11px] font-medium capitalize border-b-2 transition-colors ${
                    inspectorTab === tab
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab === 'cypher' ? 'OpenCypher' : tab}
                </button>
              ))}
            </div>

            {/* Inspector Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* EDGE VIEW */}
              {selectedEdgeData ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Relationship Traversal
                    </span>
                    <div className="font-mono text-xs text-slate-800 break-all font-semibold">
                      ({selectedEdgeData.source}) -[:{selectedEdgeData.relationship}]-&gt; ({selectedEdgeData.target})
                    </div>
                  </div>
                  {selectedEdgeData.isCriticalPath && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>This relationship lies directly on the active workflow bottleneck path.</span>
                    </div>
                  )}
                </div>
              ) : selectedNodeData ? (
                /* NODE VIEW */
                <>
                  {inspectorTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Status Banner */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-slate-500 font-medium">Node Status:</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            selectedNodeData.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : selectedNodeData.status === 'CRITICAL' || selectedNodeData.status === 'BLOCKED'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {selectedNodeData.status}
                        </span>
                      </div>

                      {/* Blocker Reason if present */}
                      {selectedNodeData.blockerReason && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-950 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Bottleneck Explanation</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            {selectedNodeData.blockerReason}
                          </p>
                        </div>
                      )}

                      {/* Metadata Table */}
                      {selectedNodeData.metadata && (
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Entity Properties
                          </h4>
                          <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white overflow-hidden text-[11px]">
                            {Object.entries(selectedNodeData.metadata).map(([key, val]) => (
                              <div key={key} className="p-2 flex items-start justify-between gap-2">
                                <span className="text-slate-500 font-medium">{key}</span>
                                <span className="font-mono text-slate-900 text-right truncate max-w-[180px]">
                                  {String(val)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {inspectorTab === 'dependencies' && (
                    <div className="space-y-4">
                      {/* Incoming */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Preceded By / Depends On ({nodeConnections.incoming.length})
                        </h4>
                        {nodeConnections.incoming.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">No incoming dependency edges.</div>
                        ) : (
                          <div className="space-y-1.5">
                            {nodeConnections.incoming.map(({ edge, node }) => (
                              <div
                                key={edge.id}
                                onClick={() => node && setSelectedNodeId(node.id)}
                                className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/40 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span>{edge.relationship}</span>
                                  <span>{node?.id}</span>
                                </div>
                                <div className="font-semibold text-slate-900 mt-0.5 truncate">
                                  {node?.data.label || edge.source}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Outgoing */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Enables / Feeds Into ({nodeConnections.outgoing.length})
                        </h4>
                        {nodeConnections.outgoing.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">No outgoing dependency edges.</div>
                        ) : (
                          <div className="space-y-1.5">
                            {nodeConnections.outgoing.map(({ edge, node }) => (
                              <div
                                key={edge.id}
                                onClick={() => node && setSelectedNodeId(node.id)}
                                className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/40 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                  <span>{edge.relationship}</span>
                                  <span>{node?.id}</span>
                                </div>
                                <div className="font-semibold text-slate-900 mt-0.5 truncate">
                                  {node?.data.label || edge.target}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {inspectorTab === 'cypher' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          FalkorDB Cypher Query
                        </span>
                        <button
                          onClick={() => handleCopyCypher(
                            selectedNodeData.cypherQuery || GraphService.generateCypherForNode(selectedNodeId || '')
                          )}
                          className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          {copiedCypher ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Cypher</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                        {selectedNodeData.cypherQuery || GraphService.generateCypherForNode(selectedNodeId || '')}
                      </pre>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        This Cypher statement can be executed directly in the FalkorDB Redis CLI or FalkorDB Browser to trace incoming and outgoing property relationships.
                      </p>
                    </div>
                  )}

                  {inspectorTab === 'remediation' && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Authorized Owner
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            SL
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">Sarah Lin</div>
                            <div className="text-[10px] text-slate-500">SecOps Lead & Application Owner</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleDispatchReminder}
                        disabled={reminderDispatched}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          reminderDispatched
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {reminderDispatched ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Reminder Dispatched to Sarah Lin!</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Simulate Dispatch Reminder</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onOpenInvestigation(
                          'Employee onboarding incomplete',
                          'Application access approval missing from Sarah Lin',
                          'wf-001'
                        )}
                        className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Full Investigation Case</span>
                      </button>

                      {onOpenActionCenter && (
                        <button
                          onClick={() => onOpenActionCenter('ACT-2026-0901')}
                          className="w-full py-2 px-3 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-900 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-blue-600" />
                          <span>Review in Action Center (ACT-2026-0901)</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Select a node or edge to inspect its graph properties.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* 6. FalkorDB Connection & Setup Modal */}
      {showFalkorPrereqsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">FalkorDB Connection Status</h3>
                  <p className="text-xs text-slate-500">How ClosureLoop handles real graph database operations</p>
                </div>
              </div>
              <button
                onClick={() => setShowFalkorPrereqsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold">Database Status: OFFLINE</span>
              <p className="text-[11px] leading-relaxed">
                The frontend communicates securely via the backend API at <code className="font-mono bg-amber-100/80 px-1 rounded">/api/graph</code>. No Redis TCP socket was detected on port 6379, so the system automatically serves the verified demonstration graph.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900">To connect a live FalkorDB instance:</h4>
              <p className="text-[11px] text-slate-600">
                Run the official FalkorDB Docker container on your machine:
              </p>
              <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
                docker run -p 6379:6379 -p 3000:3000 -v falkordb_data:/var/lib/falkordb/data --name falkordb falkordb/falkordb:edge
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowFalkorPrereqsModal(false);
                  handleRefresh();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Retry Health Check
              </button>
              <button
                onClick={() => setShowFalkorPrereqsModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
