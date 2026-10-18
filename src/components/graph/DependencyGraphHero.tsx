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
import type { FalkorNodeProperties } from '../../types/graph';
import { 
  Network, 
  RefreshCw, 
  Sparkles, 
  ExternalLink,
  AlertTriangle,
  Layers,
  MapPin,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DependencyGraphHeroProps {
  onOpenExplorer: () => void;
  onOpenInvestigation: (workflowTitle: string, suspectedBlocker: string) => void;
}

export const DependencyGraphHero: React.FC<DependencyGraphHeroProps> = ({
  onOpenExplorer,
  onOpenInvestigation,
}) => {
  // Convert mock data to Flow elements via the GraphService abstraction layer
  const initialElements = useMemo(() => {
    return GraphService.convertToFlowElements(onboardingGraphData);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

  // Selected node state - starts null so the graph canvas is 100% open and unobstructed
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<FalkorNodeProperties | null>(null);

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
  }, []);

  // Reset layout handler
  const handleResetLayout = useCallback(() => {
    const refreshed = GraphService.convertToFlowElements(onboardingGraphData);
    setNodes(refreshed.nodes);
    setEdges(refreshed.edges);
    setSelectedNodeId(null);
    setSelectedNodeData(null);
  }, [setNodes, setEdges]);

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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                  1 Bottleneck Detected
                </span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {nodes.length} Nodes · {edges.length} Edges
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active context: <strong className="text-slate-700 font-medium">{onboardingGraphData.name}</strong>
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

          <button
            type="button"
            onClick={onOpenExplorer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            title="Open Graph Explorer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenInvestigation(
              onboardingGraphData.name, 
              'Security Approval missing from Sarah Lin'
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Investigate</span>
          </button>
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
              <div className="bg-amber-950/80 border border-amber-500/50 rounded-lg px-2.5 py-1 text-[10px] text-amber-200 font-medium flex items-center gap-2 shadow-md backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Critical Path: Security Approval pending from Sarah Lin</span>
              </div>
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
        />
      </div>
    </section>
  );
};
