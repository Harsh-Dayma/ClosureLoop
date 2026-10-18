import type { InvestigationCase } from '../types/investigation';
import { mockInvestigationCases } from '../data/mockInvestigations';

export interface InvestigationFilters {
  search?: string;
  status?: string;
  department?: string;
  urgency?: string;
}

export interface InvestigationStatsSummary {
  total: number;
  confirmedRootCause: number;
  investigating: number;
  hypothesisPending: number;
  avgResolutionTimeHours: number;
}

/**
 * Service Layer for Dependency Investigations
 * Provides a clean boundary between UI components and graph data access.
 * 
 * Current State: Uses Demo Investigation Adapter.
 * When FalkorDB is connected via a backend API (e.g., Express/Fastify + FalkorDB driver),
 * this service can switch to making HTTP/WebSocket calls without changing the UI components.
 */
export class InvestigationService {
  /**
   * Check if a live FalkorDB instance is genuinely connected.
   * Explicitly returns false until an actual backend endpoint is configured.
   */
  public static isLiveFalkorDBConnected(): boolean {
    return false;
  }

  /**
   * Explains what infrastructure is missing before real graph queries can run.
   */
  public static getMissingPrerequisites(): string[] {
    return [
      'Local or hosted FalkorDB Docker container (e.g. docker run -p 6379:6379 falkordb/falkordb)',
      'Backend API service (Node.js/Express or Python/FastAPI) holding FalkorDB client credentials',
      'API proxy endpoint (e.g. /api/investigations/:id/traverse) executing OpenCypher queries on behalf of the client'
    ];
  }

  public static async getInvestigations(filters?: InvestigationFilters): Promise<InvestigationCase[]> {
    // Simulated network latency
    let items = [...mockInvestigationCases];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.workflowTitle.toLowerCase().includes(q) ||
          inv.department.toLowerCase().includes(q) ||
          inv.identifiedBottleneck.name.toLowerCase().includes(q) ||
          inv.unmetBusinessOutcome.toLowerCase().includes(q) ||
          (inv.responsibleOwner && inv.responsibleOwner.name.toLowerCase().includes(q))
      );
    }

    if (filters?.status && filters.status !== 'All') {
      items = items.filter((inv) => inv.status === filters.status);
    }

    if (filters?.department && filters.department !== 'All Departments' && filters.department !== 'All') {
      items = items.filter((inv) => inv.department.toLowerCase() === filters.department?.toLowerCase());
    }

    if (filters?.urgency && filters.urgency !== 'All') {
      items = items.filter((inv) => inv.urgency === filters.urgency);
    }

    return items;
  }

  public static async getInvestigationById(id: string): Promise<InvestigationCase | undefined> {
    return mockInvestigationCases.find((inv) => inv.id === id);
  }

  public static async getInvestigationByWorkflowId(workflowId: string): Promise<InvestigationCase | undefined> {
    return mockInvestigationCases.find((inv) => inv.workflowId === workflowId);
  }

  public static async getStats(): Promise<InvestigationStatsSummary> {
    const all = mockInvestigationCases;
    return {
      total: all.length,
      confirmedRootCause: all.filter((inv) => inv.status === 'ROOT_CAUSE_CONFIRMED').length,
      investigating: all.filter((inv) => inv.status === 'INVESTIGATING').length,
      hypothesisPending: all.filter((inv) => inv.status === 'HYPOTHESIS_PENDING').length,
      avgResolutionTimeHours: 18.4
    };
  }

  /**
   * Simulates re-running an investigation traversal over the dependency graph.
   */
  public static async rerunInvestigation(id: string): Promise<InvestigationCase | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const inv = mockInvestigationCases.find((c) => c.id === id);
    if (!inv) return undefined;

    return {
      ...inv,
      updatedAt: new Date().toISOString()
    };
  }
}
