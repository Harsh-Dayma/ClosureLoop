export type NavModuleId = 
  | 'overview'
  | 'workflows'
  | 'tasks'
  | 'history'
  | 'investigations'
  | 'graph_explorer'
  | 'action_center'
  | 'verification_memory'
  | 'settings';

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
