import type { AuthUser } from '@/hooks/useAuth';
import type { AdminReportListItem } from './admin.types';
import type { EmployeeRole } from '../../shared/employeeOptions';

export type AdminView = 'home' | 'alerts' | 'employees' | 'stats' | 'config';
export type ReportsViewProps = { user: AuthUser | null; isAdmin: boolean; role?: EmployeeRole | 'user' | null };

export type AdminProfile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type AdminNotification = {
  id: string;
  title: string;
  detail: string;
  createdAt: Date;
};

export type ReportHistoryEvent = {
  id: string;
  type: string;
  actorName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type RelatedReport = {
  id: string;
  title: string;
  locationLabel: string | null;
  status: string;
  createdAt: string;
  distanceMeters: number;
};

export type ReportHistoryData = {
  events: ReportHistoryEvent[];
  related: RelatedReport[];
};

export type AdminReportsResponse = {
  data?: AdminReportListItem[];
};

export type AdminEmployee = {
  uid: string;
  displayName: string | null;
  email: string | null;
  role: EmployeeRole;
  area: string | null;
  shift: string | null;
  employeeStatus: 'pending' | 'active' | 'disabled';
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminEmployeesSummary = {
  total: number;
  activeOperators: number;
  officials: number;
  admins: number;
};

export type AdminEmployeesResponse = {
  data?: AdminEmployee[];
  count?: number;
  summary?: AdminEmployeesSummary;
};

export type EmployeeActionHandlers = {
  editEmployee: (employee: AdminEmployee, values: Record<string, string>) => Promise<boolean>;
  resendInvite: (employee: AdminEmployee) => Promise<void>;
  setEmployeeStatus: (employee: AdminEmployee, disabled: boolean) => Promise<void>;
};

export type PageSizeStorageKey = 'admin.home.pageSize' | 'admin.alerts.pageSize' | 'admin.employees.pageSize';
