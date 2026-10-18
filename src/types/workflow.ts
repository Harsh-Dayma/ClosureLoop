export type WorkflowStatus = 'Blocked' | 'Pending' | 'Overdue' | 'In Progress' | 'Verified';

export interface WorkflowItem {
  id: string;
  title: string;
  description?: string;
  team: string;
  blocker: string;
  status: WorkflowStatus;
  urgency: 'high' | 'medium' | 'low';
  owner: string;
  ownerEmail?: string;
  ownerRole?: string;
  daysStalled: number;
  unresolvedEntity: string;
  verificationGoal: string;
  createdAt?: string;
  updatedAt?: string;
  systems?: string[];
  completionPercentage?: number;
  slaHoursRemaining?: number;
  relatedGraphId?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'prerequisite_identified' | 'owner_assigned' | 'moved_to_verification' | 'outcome_confirmed' | 'blocker_detected';
  title: string;
  description: string;
  timestamp: string;
  workflowId: string;
  workflowTitle: string;
  author: string;
}

export interface DashboardMetrics {
  openWorkflows: number;
  blockedOutcomes: number;
  pendingActions: number;
  verifiedToday: number;
}
