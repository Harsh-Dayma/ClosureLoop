import { sampleWorkflows, dashboardMetrics } from '../data/mockWorkflows';
import { sampleActivityFeed } from '../data/mockActivity';
import type { WorkflowItem, DashboardMetrics, ActivityEvent } from '../types/workflow';

export interface WorkflowFilters {
  search?: string;
  status?: string;
  team?: string;
  urgency?: string;
  system?: string;
  sortBy?: 'daysStalled' | 'updatedAt' | 'title' | 'urgency' | 'status' | 'completionPercentage';
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowRegistryStats {
  total: number;
  blocked: number;
  pending: number;
  inProgress: number;
  overdue: number;
  verified: number;
  avgStalledDays: number;
  slaBreachCount: number;
}

export interface InvestigationRequest {
  workflowId: string;
  workflowTitle: string;
  suspectedBlocker: string;
  urgency: 'high' | 'medium' | 'low';
  requestedBy: string;
  notes?: string;
}

export interface InvestigationConfirmation {
  investigationId: string;
  status: 'QUEUED' | 'ACTIVE';
  submittedAt: string;
  message: string;
  simulatedAgentPlan: string[];
}

export class WorkflowService {
  public static async getMetrics(): Promise<DashboardMetrics> {
    return dashboardMetrics;
  }

  public static async getWorkflows(filters?: WorkflowFilters): Promise<WorkflowItem[]> {
    let items = [...sampleWorkflows];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.team.toLowerCase().includes(q) ||
          w.blocker.toLowerCase().includes(q) ||
          w.owner.toLowerCase().includes(q) ||
          w.unresolvedEntity.toLowerCase().includes(q) ||
          w.verificationGoal.toLowerCase().includes(q) ||
          (w.description && w.description.toLowerCase().includes(q))
      );
    }

    if (filters?.status && filters.status !== 'All') {
      items = items.filter((w) => w.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters?.team && filters.team !== 'All Teams' && filters.team !== 'All') {
      items = items.filter((w) => w.team.toLowerCase() === filters.team?.toLowerCase());
    }

    if (filters?.urgency && filters.urgency !== 'All') {
      items = items.filter((w) => w.urgency.toLowerCase() === filters.urgency?.toLowerCase());
    }

    if (filters?.system && filters.system !== 'All') {
      items = items.filter((w) => w.systems && w.systems.includes(filters.system!));
    }

    // Apply sorting
    if (filters?.sortBy) {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      items.sort((a, b) => {
        switch (filters.sortBy) {
          case 'daysStalled':
            return (a.daysStalled - b.daysStalled) * order;
          case 'updatedAt': {
            const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return (timeA - timeB) * order;
          }
          case 'title':
            return a.title.localeCompare(b.title) * order;
          case 'urgency': {
            const urgencyWeight = { high: 3, medium: 2, low: 1 };
            return (urgencyWeight[a.urgency] - urgencyWeight[b.urgency]) * order;
          }
          case 'status':
            return a.status.localeCompare(b.status) * order;
          case 'completionPercentage':
            return ((a.completionPercentage || 0) - (b.completionPercentage || 0)) * order;
          default:
            return 0;
        }
      });
    }

    return items;
  }

  public static async getRegistryStats(): Promise<WorkflowRegistryStats> {
    const all = sampleWorkflows;
    const total = all.length;
    const blocked = all.filter((w) => w.status === 'Blocked').length;
    const pending = all.filter((w) => w.status === 'Pending').length;
    const inProgress = all.filter((w) => w.status === 'In Progress').length;
    const overdue = all.filter((w) => w.status === 'Overdue').length;
    const verified = all.filter((w) => w.status === 'Verified').length;
    const totalDays = all.reduce((sum, w) => sum + w.daysStalled, 0);
    const avgStalledDays = total > 0 ? Number((totalDays / total).toFixed(1)) : 0;
    const slaBreachCount = all.filter((w) => (w.slaHoursRemaining || 0) < 0).length;

    return {
      total,
      blocked,
      pending,
      inProgress,
      overdue,
      verified,
      avgStalledDays,
      slaBreachCount
    };
  }

  public static async getDepartments(): Promise<string[]> {
    const teams = new Set(sampleWorkflows.map((w) => w.team));
    return ['All Teams', ...Array.from(teams).sort()];
  }

  public static async getAvailableSystems(): Promise<string[]> {
    const sysSet = new Set<string>();
    sampleWorkflows.forEach((w) => {
      w.systems?.forEach((s) => sysSet.add(s));
    });
    return ['All Systems', ...Array.from(sysSet).sort()];
  }

  public static async getWorkflowById(id: string): Promise<WorkflowItem | undefined> {
    return sampleWorkflows.find((w) => w.id === id);
  }

  public static async getActivityFeed(): Promise<ActivityEvent[]> {
    return sampleActivityFeed;
  }

  /**
   * Submits a mock investigation request
   */
  public static async submitInvestigation(req: InvestigationRequest): Promise<InvestigationConfirmation> {
    await new Promise((res) => setTimeout(res, 400));
    return {
      investigationId: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ACTIVE',
      submittedAt: new Date().toLocaleTimeString(),
      message: `Investigation intake confirmed for "${req.workflowTitle}". ClosureLoop agent initialized on FalkorDB dependency graph.`,
      simulatedAgentPlan: [
        `Trace multi-hop dependencies from "${req.workflowTitle}" in FalkorDB`,
        `Pinpoint stalled prerequisite "${req.suspectedBlocker}"`,
        `Inspect responsible owner availability & org graph escalation path`,
        `Synthesize recommended action with cryptographic outcome verification criteria`
      ]
    };
  }
}
