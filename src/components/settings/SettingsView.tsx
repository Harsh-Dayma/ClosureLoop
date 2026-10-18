import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Activity,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Layers,
  Terminal,
  Cpu,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import type {
  SettingsPayload,
  IntegrationCategory
} from '../../types/settings';
import { SettingsService } from '../../services/settingsService';

interface SettingsViewProps {
  onBackToOverview: () => void;
  onOpenExplorer?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBackToOverview,
  onOpenExplorer
}) => {
  // Tabs: 'falkor' | 'integrations' | 'general' | 'diagnostics'
  const [activeTab, setActiveTab] = useState<'falkor' | 'integrations' | 'general' | 'diagnostics'>('falkor');

  // Data state
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [_isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isTestingFalkor, setIsTestingFalkor] = useState<boolean>(false);
  const [copiedDockerCmd, setCopiedDockerCmd] = useState<boolean>(false);

  // Category filter for integrations tab
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Feedback notifications
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Manual refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Fetch Settings on Mount & Refresh
  useEffect(() => {
    let isCancelled = false;

    const loadSettings = async () => {
      try {
        const data = await SettingsService.getSettings();
        if (isCancelled) return;
        setSettings(data);
      } catch (err: any) {
        console.error('Failed to load settings:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadSettings();

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  // Test FalkorDB Connectivity
  const handleTestFalkor = async () => {
    setIsTestingFalkor(true);
    try {
      const res = await SettingsService.testFalkorConnection();
      handleRefresh();

      if (res.success) {
        setFeedbackNotice({
          type: 'success',
          message: `FalkorDB connection verified! Ping response time: ${res.latencyMs}ms. Graph '${res.status.graphName}' is ready.`
        });
      } else {
        setFeedbackNotice({
          type: 'warning',
          message: `FalkorDB is unreachable at ${res.status.host}:${res.status.port}. Running in structured relational fallback mode.`
        });
      }
      setTimeout(() => setFeedbackNotice(null), 6000);
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        message: err.message || 'Failed to ping FalkorDB.'
      });
    } finally {
      setIsTestingFalkor(false);
    }
  };

  // Master Reset of All Repositories
  const handleResetAll = async () => {
    setIsRefreshing(true);
    try {
      const res = await SettingsService.resetAll();
      handleRefresh();
      setFeedbackNotice({
        type: 'success',
        message: res.message
      });
      setTimeout(() => setFeedbackNotice(null), 5000);
    } catch (err: any) {
      setFeedbackNotice({
        type: 'error',
        message: err.message || 'Reset failed.'
      });
    }
  };

  // Copy Docker Command Helper
  const handleCopyDockerCmd = () => {
    if (!settings?.falkor.dockerRunCommand) return;
    navigator.clipboard.writeText(settings.falkor.dockerRunCommand);
    setCopiedDockerCmd(true);
    setTimeout(() => setCopiedDockerCmd(false), 2000);
  };

  // Filter Integrations by Category
  const filteredIntegrations = settings?.integrations.filter((int) => {
    if (selectedCategory === 'ALL') return true;
    return int.category === selectedCategory;
  }) || [];

  // Category Badge Helper
  const getCategoryBadge = (category: IntegrationCategory) => {
    switch (category) {
      case 'DATABASE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">Database</span>;
      case 'IDENTITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">Identity / SCIM</span>;
      case 'ITSM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">ITSM & Approvals</span>;
      case 'INFRASTRUCTURE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">Cloud IAM</span>;
      case 'DEV_TOOLS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">Dev Tools</span>;
      case 'NOTIFICATIONS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">Notifications</span>;
      case 'PAYMENTS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Treasury</span>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Navigation Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <button
              onClick={onBackToOverview}
              className="hover:underline text-slate-500 hover:text-slate-800 transition-colors"
            >
              ClosureLoop
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-slate-500">System</span>
            <span className="text-slate-400">/</span>
            <span className="text-blue-600">Settings & Integrations</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Settings & Integrations
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                settings?.falkor.connected
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {settings?.falkor.connected ? 'FalkorDB Live Engine' : 'Structured Fixture Mode'}
              </span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
            Enterprise system connectors, FalkorDB property graph configuration, credential isolation boundaries, and system telemetry diagnostics.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetAll}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Reset Actions, Verifications, and Memories to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Baseline</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            title="Refresh settings"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleTestFalkor}
            disabled={isTestingFalkor}
            className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
          >
            <Activity className={`w-3.5 h-3.5 ${isTestingFalkor ? 'animate-spin' : ''}`} />
            <span>{isTestingFalkor ? 'Testing...' : 'Test FalkorDB Connection'}</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Notice */}
      {feedbackNotice && (
        <div
          className={`px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 border shadow-xs transition-all ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : feedbackNotice.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : feedbackNotice.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedbackNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. Primary Settings Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('falkor')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'falkor'
              ? 'text-teal-600 border-b-2 border-teal-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>FalkorDB Engine</span>
          <span
            className={`w-2 h-2 rounded-full ${
              settings?.falkor.connected ? 'bg-teal-500' : 'bg-amber-500'
            }`}
          />
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'integrations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Application Integrations</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
            {settings?.integrations.length || 8}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'general'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>General & Demo Mode</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'diagnostics'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>System Diagnostics</span>
        </button>
      </div>

      {/* 3. Tab 1: FalkorDB Graph Engine Configuration */}
      {activeTab === 'falkor' && settings && (
        <div className="space-y-6">
          {/* FalkorDB Hero Status Card */}
          <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    settings.falkor.connected
                      ? 'bg-teal-50 text-teal-600 border-teal-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}
                >
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      FalkorDB Property Graph Engine
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        settings.falkor.connected
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {settings.falkor.connected ? 'ONLINE / CONNECTED' : 'OFFLINE / FIXTURE FALLBACK'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    FalkorDB powers ClosureLoop's relationship-aware reasoning, discovering multi-hop dependencies across Workflows, Approvals, People, and Infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleTestFalkor}
                  disabled={isTestingFalkor}
                  className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingFalkor ? 'animate-spin' : ''}`} />
                  <span>{isTestingFalkor ? 'Testing Ping...' : 'Test Connection'}</span>
                </button>

                {onOpenExplorer && (
                  <button
                    onClick={onOpenExplorer}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span>Open Graph Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Connection Telemetry Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Target Host & Port
                </span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {settings.falkor.host}:{settings.falkor.port}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Graph Name
                </span>
                <span className="font-mono font-bold text-teal-700 text-sm">
                  {settings.falkor.graphName}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    settings.falkor.connected ? 'text-teal-700' : 'text-amber-700'
                  }`}
                >
                  {settings.falkor.connected ? 'VERIFIED ACTIVE' : 'UNREACHABLE'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Last Checked
                </span>
                <span className="font-mono text-slate-600 text-xs">
                  {new Date(settings.falkor.lastChecked).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Status Message / Error Callout */}
            {settings.falkor.error ? (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>FalkorDB Diagnostic Notice:</span>
                </div>
                <p className="font-mono text-[11px] bg-white/70 p-2 rounded border border-amber-200 break-all">
                  {settings.falkor.error}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ClosureLoop has gracefully engaged the structured property graph fallback fixture. All graph traversal, multi-hop blocker analysis, and node inspectors remain fully operational.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/60 text-teal-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>FalkorDB client connection is live and executing OpenCypher queries on port 6379.</span>
              </div>
            )}

            {/* Docker Launch Instructions for Hackathon Judges */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] text-white space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-400">
                  <Terminal className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Quickstart: Run FalkorDB in Docker
                  </span>
                </div>
                <button
                  onClick={handleCopyDockerCmd}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  {copiedDockerCmd ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-teal-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-2.5 rounded bg-black/60 text-teal-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
                <code>{settings.falkor.dockerRunCommand}</code>
              </pre>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Once the container starts on port 6379, click <strong>"Test Connection"</strong> above to immediately link live Cypher query execution.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab 2: Integrations Catalog */}
      {activeTab === 'integrations' && settings && (
        <div className="space-y-4">
          {/* Integrations Header & Filter Toolbar */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Enterprise System Connectors Catalog
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative SaaS and infrastructure connectors inspected and integrated into ClosureLoop's dependency graph.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                <option value="DATABASE">Database</option>
                <option value="IDENTITY">Identity / SCIM</option>
                <option value="ITSM">ITSM & Approvals</option>
                <option value="INFRASTRUCTURE">Cloud IAM</option>
                <option value="DEV_TOOLS">Dev Tools</option>
                <option value="NOTIFICATIONS">Notifications</option>
                <option value="PAYMENTS">Treasury</option>
              </select>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIntegrations.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(item.category)}
                      <span className="text-[10px] font-mono font-semibold text-slate-400">
                        {item.id}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {item.name}
                    </h4>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      item.status === 'connected'
                        ? 'bg-teal-100 text-teal-800'
                        : item.adapterType === 'LIVE_DRIVER'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.status === 'connected'
                      ? 'CONNECTED'
                      : item.adapterType === 'LIVE_DRIVER'
                      ? 'UNAVAILABLE'
                      : 'DEMO ADAPTER'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-[11px]">
                  <div className="text-slate-700">
                    <strong className="text-slate-900">Target Role: </strong>
                    <span>{item.targetPurpose}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[10px] pt-1">
                    Required Keys: <code className="text-slate-700 font-bold">{item.requiredConfig}</code>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Mode: {item.adapterType}
                  </span>
                  {item.docsUrl && (
                    <a
                      href={item.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>API Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab 3: General Settings & Demo Mode */}
      {activeTab === 'general' && settings && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              General Enterprise Preferences & Demonstration Mode
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Runtime environment flags, strict service boundary guarantees, and demo mode management.
            </p>
          </div>

          <div className="space-y-4">
            {/* Demo Mode Notice Banner */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Demonstration Mode Active</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                ClosureLoop is currently running in <strong>Demonstration Mode</strong> for the Graph Hacks hackathon. All database queries and credentials live exclusively in the backend (<code className="font-mono text-[11px] bg-blue-100 px-1 rounded">server/</code>). Simulated adapters allow testing realistic enterprise workflows without exposing live API tokens.
              </p>
            </div>

            {/* Architecture Standards Checklist */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Architectural Guarantees Enforced:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Strict Service Boundary (Zero credentials in browser)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Anti-Fabrication Principle (Simulated data clearly tagged)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>State Machine Idempotency (Duplicate execution suppressed)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cryptographic Telemetry (Action completion != Outcome completion)</span>
                </div>
              </div>
            </div>

            {/* System Reset Section */}
            <div className="pt-2 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Restore Baseline Demonstration State
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Resets all action reviews, verification criteria checks, and archived memories back to the pristine Day-1 onboarding baseline.
                </p>
              </div>

              <button
                onClick={handleResetAll}
                className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Repositories</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 4: System Diagnostics */}
      {activeTab === 'diagnostics' && settings && (
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Operational Telemetry & System Diagnostics
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Live operational health metrics, runtime versions, and cross-module entity statistics.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Node.js Runtime
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {settings.diagnostics.nodeVersion}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Server Uptime
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {Math.floor(settings.diagnostics.uptimeSeconds / 60)} min {settings.diagnostics.uptimeSeconds % 60} sec
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Active Actions
              </span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                {settings.diagnostics.activeActions} Managed
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Indexed Memories
              </span>
              <span className="font-mono font-bold text-purple-700 text-sm">
                {settings.diagnostics.indexedMemories} Records
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-tight text-[11px]">
              End-to-End Enterprise Module Pipeline:
            </h4>
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-600">
              <span className="px-2 py-1 bg-white rounded border border-slate-200">1. Dashboard</span>
              <span>&rarr;</span>
              <span className="px-2 py-1 bg-white rounded border border-slate-200">2. Workflow Registry</span>
              <span>&rarr;</span>
              <span className="px-2 py-1 bg-white rounded border border-slate-200">3. Investigation Room</span>
              <span>&rarr;</span>
              <span className="px-2 py-1 bg-white rounded border border-slate-200">4. Graph Explorer</span>
              <span>&rarr;</span>
              <span className="px-2 py-1 bg-white rounded border border-slate-200">5. Action Center</span>
              <span>&rarr;</span>
              <span className="px-2 py-1 bg-white rounded border border-slate-200">6. Verification & Memory</span>
              <span>&rarr;</span>
              <span className="px-2 py-1 bg-teal-50 text-teal-800 font-bold rounded border border-teal-200">7. Settings</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
