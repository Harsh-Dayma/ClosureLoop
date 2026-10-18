export type NavModuleId = 
  | 'overview'
  | 'workflows'
  | 'tasks'
  | 'attention_needed'
  | 'history'
  | 'settings'
  | 'investigations'
  | 'graph_explorer'
  | 'action_center'
  | 'verification_memory';

export interface NavModuleInfo {
  id: NavModuleId;
  label: string;
  badge?: string;
  badgeVariant?: 'default' | 'warning' | 'primary';
  status: 'implemented' | 'left_to_build';
  description: string;
  futureCapabilities: string[];
  estimatedDelivery?: string;
}
