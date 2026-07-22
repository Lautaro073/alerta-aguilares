export type AdminConfigArea = {
  id: string;
  label: string;
  responsible: string | null;
  isActive: boolean;
  updatedAt: string | null;
};

export type AdminConfigCategory = {
  id: string;
  label: string;
  name: string;
  iconName: string;
  color: string;
  defaultAreaId: string | null;
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  updatedAt: string | null;
};

export type AdminConfigResponse = {
  data?: {
    areas: AdminConfigArea[];
    categories: AdminConfigCategory[];
  };
};

export type AdminConfigStatusFilter = 'active' | 'inactive' | 'all';
export type AdminConfigMutation = (body: Record<string, unknown>) => Promise<void>;

