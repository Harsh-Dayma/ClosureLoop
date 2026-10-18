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
import type { NodeMouseHandler } from '@xyflow/react';
import { CustomDependencyNode } from './CustomDependencyNode';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { GraphLegend } from './GraphLegend';
import { GraphService } from '../../services/graphService';
import { onboardingGraphData } from '../../data/mockGraphData';
import type { FalkorNodeProperties, FalkorGraphData } from '../../types/graph';
import type { UserPersona, UserRole } from '../../types/role';
import { 
  Network, 
  RefreshCw, 
  Sparkles, 
  ExternalLink,
  AlertTriangle,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Lock,
  Info
} from 'lucide-react';

interface DependencyGraphHeroProps {
  currentPersona?: UserPersona;
  onOpenExplorer: () => void;
  onOpenInvestigation: (workflowTitle: string, suspectedBlocker: string) => void;
}

/**
 * Generates dynamically scoped graph data based on user role authorization.
 * Role EMPLOYEE (Rahul Sharma):
 *   - Strictly scoped to his personal onboarding journey (Least Privilege Access)
 *   - Internal SecOps architect nodes (Sarah Lin) and Manager oversight nodes (David Chen) are redacted.
 *   - Sensitive metadata (private Slack, bypass links, risk algorithms) is sanitized.
 * Role MANAGER (David Chen):
 *   - Team oversight view with workflow blockers and escalation capabilities.
 * Role ADMIN_OPERATIONS (Sarah Lin):
 *   - Full enterprise topology with all 9 nodes, Cypher execution, and root remediation controls.
 */
function getScopedGraphData(role?: UserRole): FalkorGraphData {
  if (role === 'EMPLOYEE') {
    const employeeAllowedNodeIds = new Set([
      'person-employee',
      'wf-onboarding',
      'task-employee-record',
      'sys-it-account',
      'appr-security',
      'task-verification'
    ]);

    const employeeNodes = onboardingGraphData.nodes
      .filter((n) => employeeAllowedNodeIds.has(n.id))
      .map((n) => {
        if (n.id === 'person-employee') {
          return {
            ...n,
            position: { x: 100, y: 60 },
            data: {
              ...n.data,
              label: 'Rahul Sharma (You)',
              sublabel: 'New Hire · Staff Platform Engineer',
              blockerReason: 'Waiting for standard InfoSec review before AWS development access is issued.',
              cypherQuery: '// OpenCypher query inspection restricted for EMPLOYEE role under Enterprise Security Policy'
            }
          };
        }
        if (n.id === 'wf-onboarding') {
          return {
            ...n,
            position: { x: 420, y: 60 },
            data: {
              ...n.data,
              label: 'My Onboarding Journey',
              sublabel: 'Candidate: Rahul Sharma',
              cypherQuery: '// OpenCypher query inspection restricted for EMPLOYEE role under Enterprise Security Policy'
            }
          };
        }
        if (n.id === 'task-employee-record') {
          return {
            ...n,
            position: { x: 420, y: 190 },
            data: {
              ...n.data,
              cypherQuery: '// OpenCypher query inspection restricted for EMPLOYEE role under Enterprise Security Policy'
            }
          };
        }
        if (n.id === 'sys-it-account') {
          return {
            ...n,
            position: { x: 420, y: 320 },
            data: {
              ...n.data,
              cypherQuery: '// OpenCypher query inspection restricted for EMPLOYEE role under Enterprise Security Policy'
            }
          };
        }
        if (n.id === 'appr-security') {
          return {
            ...n,
            position: { x: 420, y: 450 },
            data: {
              ...n.data,
              label: 'Security & Access Review',
              sublabel: 'Pending InfoSec Sign-off',
              owner: 'InfoSec Team',
              team: 'Security Operations',
              blockerReason: 'Standard security review in progress by the InfoSec team. Turnaround SLA: 24-48 hours. No action required from you.',
              cypherQuery: '// OpenCypher query inspection restricted for EMPLOYEE role under Enterprise Security Policy',
              metadata: {
                'Status': 'Under Security Review',
                'Assigned Group': 'Corporate Information Security',
                'Your Action': 'None (Awaiting automated provisioning)',
                'Expected SLA': '24-48 hours'
              }
            }
          };
        }
        if (n.id === 'task-verification') {
          return {
            ...n,
            position: { x: 420, y: 580 },
            data: {
              ...n.data,
              cypherQuery: '// OpenCypher query inspection restricted for EMPLOYEE role under Enterprise Security Policy'
            }
          };
        }
        return n;
      });

    const employeeEdges = [
      {
        id: 'e-wf-employee',
        source: 'wf-onboarding',
        target: 'person-employee',
        relationship: 'FOR_EMPLOYEE',
        label: 'My Journey'
      },
      {
        id: 'e-wf-rec',
        source: 'wf-onboarding',
        target: 'task-employee-record',
        relationship: 'REQUIRES',
        label: 'HR Profile (Done)'
      },
      {
        id: 'e-rec-it',
        source: 'task-employee-record',
        target: 'sys-it-account',
        relationship: 'ENABLES',
        label: 'SSO Identity (Done)'
      },
      {
        id: 'e-it-security',
        source: 'sys-it-account',
        target: 'appr-security',
        relationship: 'AWAITING_REVIEW',
        isCriticalPath: true,
        animated: true,
        label: 'Awaiting InfoSec Sign-off'
      },
      {
        id: 'e-security-verify',
        source: 'appr-security',
        target: 'task-verification',
        relationship: 'PREREQUISITE_FOR',
        isCriticalPath: true,
        animated: true,
        label: 'Unlocks Final Verification'
      },
      {
        id: 'e-verify-wf',
        source: 'task-verification',
        target: 'wf-onboarding',
        relationship: 'VERIFIES',
        label: 'Completes Onboarding'
      }
    ];

    return {
      graphId: 'graph-onboarding-employee',
      name: 'Personal Onboarding Subgraph: Rahul Sharma',
      description: 'Role-Scoped View: Least Privilege Access (Confidential Administrative Nodes Redacted)',
      nodes: employeeNodes,
      edges: employeeEdges
    };
  }

  return onboardingGraphData;
}

export const DependencyGraphHero: React.FC<DependencyGraphHeroProps> = ({
  currentPersona,
  onOpenExplorer,
  onOpenInvestigation,
}) => {
  // Dynamically resolve scoped graph dataset based on current persona role
  const scopedGraph = useMemo(() => {
    return getScopedGraphData(currentPersona?.role);
  }, [currentPersona?.role]);

  // Convert scoped data to Flow elements via the GraphService abstraction layer
  const initialElements = useMemo(() => {
    return GraphService.convertToFlowElements(scopedGraph);
  }, [scopedGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

  // Selected node state - starts null so the graph canvas is 100% open and unobstructed
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<FalkorNodeProperties | null>(null);

  // Adjust Flow elements during render when persona role changes (idiomatic React pattern)
  const [prevRole, setPrevRole] = useState(currentPersona?.role);
  if (currentPersona?.role !== prevRole) {
    setPrevRole(currentPersona?.role);
    const updated = GraphService.convertToFlowElements(scopedGraph);
    setNodes(updated.nodes);
    setEdges(updated.edges);
    setSelectedNodeId(null);
    setSelectedNodeData(null);
  }

  const [showMinimap, setShowMinimap] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Listen for ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedNodeId) {
          setSelectedNodeId(null);
          setSelectedNodeData(null);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, selectedNodeId]);

  // Custom node types registration
  const nodeTypes = useMemo(() => ({
    customDependency: CustomDependencyNode,
  }), []);

  // Handle node selection
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeData(node.data as unknown as FalkorNodeProperties);
  }, [setSelectedNodeId, setSelectedNodeData]);

  // Reset layout handler
  const handleResetLayout = useCallback(() => {
    const refreshed = GraphService.convertToFlowElements(scopedGraph);
    setNodes(refreshed.nodes);
    setEdges(refreshed.edges);
    setSelectedNodeId(null);
    setSelectedNodeData(null);
  }, [scopedGraph, setNodes, setEdges, setSelectedNodeId, setSelectedNodeData]);

  return (
    <section 
      className={`bg-white border border-slate-200/90 shadow-xs overflow-hidden flex flex-col transition-all ${
        isFullscreen 
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none' 
          : 'relative w-full rounded-xl'
      }`}
    >
      {/* Hero Section Header */}
      <div className="px-4 md:px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Knowledge Graph Canvas
                </h2>
                
                {/* Dynamic Role Authorization Badge */}
                {currentPersona?.role === 'EMPLOYEE' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Role: Employee (Least Privilege Scoped)</span>
                  </span>
                ) : currentPersona?.role === 'MANAGER' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    <span>Role: Manager (Team Oversight)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    <span>Role: SecOps Admin (Full Enterprise Topology)</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                  1 Bottleneck Detected
                </span>
                
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {nodes.length} {currentPersona?.role === 'EMPLOYEE' ? 'Personal Nodes' : 'Nodes'} · {edges.length} Edges
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active context: <strong className="text-slate-700 font-medium">{scopedGraph.name}</strong>
                {currentPersona?.role === 'EMPLOYEE' && (
                  <span className="ml-1 text-slate-400 font-normal">
                    (Administrative & SecOps topology redacted under Enterprise Least Privilege policy)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Toggles */}
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className={`p-1.5 text-xs rounded-lg border transition-colors ${
              showLegend
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Graph Legend"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowMinimap(!showMinimap)}
            className={`p-1.5 text-xs rounded-lg border transition-colors ${
              showMinimap
                ? 'bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Minimap"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            title="Reset Coordinates & View"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors shadow-2xs ${
              isFullscreen
                ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
            title={isFullscreen ? "Exit Full Screen (ESC)" : "Open Graph in Full Screen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span>Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Full Screen</span>
              </>
            )}
          </button>

          {/* Explorer Button: Only for Manager & Admin */}
          {currentPersona?.role !== 'EMPLOYEE' ? (
            <button
              type="button"
              onClick={onOpenExplorer}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Open Graph Explorer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Explorer</span>
            </button>
          ) : (
            <span 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed opacity-75"
              title="Enterprise Graph Explorer is restricted to Manager and Admin roles under Least Privilege Access policy."
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="hidden md:inline">Explorer (Restricted)</span>
            </span>
          )}

          {/* Investigate Button: Only for Manager & Admin; Employee gets friendly Status View */}
          {currentPersona?.role !== 'EMPLOYEE' ? (
            <button
              type="button"
              onClick={() => onOpenInvestigation(
                scopedGraph.name, 
                'Security Approval missing from Sarah Lin'
              )}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Investigate</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedNodeId('appr-security');
                const apprNode = nodes.find(n => n.id === 'appr-security');
                if (apprNode) setSelectedNodeData(apprNode.data as unknown as FalkorNodeProperties);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-xs transition-colors"
              title="Inspect pending security review requirements"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>View Blocker Status</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Graph Canvas & Side Inspector */}
      <div className={`relative w-full ${isFullscreen ? 'flex-1 h-full min-h-0' : 'h-[620px] md:h-[660px]'} flex bg-[#080d1a] overflow-hidden select-none`}>
        {/* Left: React Flow Graph Area */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.22 }}
            minZoom={0.25}
            maxZoom={2.0}
            defaultViewport={{ x: 0, y: 0, zoom: 0.88 }}
          >
            {/* Dark Dot Background */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1}
              color="#1e293b"
            />

            {/* Built-in Controls */}
            <Controls 
              position="top-left" 
              showInteractive={false} 
              className="bg-slate-900/95 border border-slate-700 fill-white text-white rounded-lg shadow-xl overflow-hidden m-3"
            />

            {/* Minimap */}
            {showMinimap && (
              <MiniMap
                position="bottom-left"
                nodeColor={(node) => {
                  if (node.id === 'appr-security') return '#f59e0b';
                  if (node.id === 'task-verification') return '#0d9488';
                  return '#38bdf8';
                }}
                maskColor="rgba(8, 13, 26, 0.75)"
                className="m-3 rounded-lg border border-slate-700 overflow-hidden shadow-lg"
              />
            )}

            {/* Legend Panel at Bottom Right */}
            {showLegend && (
              <Panel position="bottom-right" className="m-3">
                <GraphLegend />
              </Panel>
            )}

            {/* Floating Banner indicating Active Critical Path */}
            <Panel position="top-right" className="m-3 hidden md:block">
              {currentPersona?.role === 'EMPLOYEE' ? (
                <div className="bg-blue-950/85 border border-blue-500/50 rounded-lg px-2.5 py-1 text-[10px] text-blue-200 font-medium flex items-center gap-2 shadow-md backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                  <span>Status: Security Review Underway with InfoSec (No action needed from you)</span>
                </div>
              ) : (
                <div className="bg-amber-950/80 border border-amber-500/50 rounded-lg px-2.5 py-1 text-[10px] text-amber-200 font-medium flex items-center gap-2 shadow-md backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                  <span>Critical Path: Security Approval pending from Sarah Lin</span>
                </div>
              )}
            </Panel>
          </ReactFlow>
        </div>

        {/* Floating Slide-over Node Inspector Drawer Panel */}
        <NodeDetailsPanel
          nodeId={selectedNodeId}
          nodeData={selectedNodeData}
          onClose={() => {
            setSelectedNodeId(null);
            setSelectedNodeData(null);
          }}
          onInvestigate={(title, blocker) => onOpenInvestigation(title, blocker)}
          currentPersona={currentPersona}
        />
      </div>
    </section>
  );
};
