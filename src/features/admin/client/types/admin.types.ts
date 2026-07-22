import type { Report, ReportAssignedArea, ReportStatus } from '@/types/report';

export type AdminStatusFilter = 'ALL' | ReportStatus | 'DELETED';
export type AdminTimeframeFilter = 'all' | '7d' | '30d';
export type AdminPageSize = 6 | 10 | 25 | 50 | 100;

export interface AdminReportFilters {
  search: string;
  status: AdminStatusFilter;
  category: string;
  timeframe: AdminTimeframeFilter;
  from?: string;
  to?: string;
}

export interface AdminReportSummary {
  totalReports: number;
  activeReports: number;
  pendingReports: number;
  verifyingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  dismissedReports: number;
  duplicateReports: number;
  archivedReports: number;
  avgResolutionHours: number | null;
  categoryStats?: AdminCategoryStat[];
}

export interface AdminCategoryStat {
  category: string;
  total: number;
  resolved: number;
}

export type AdminActionLoading = Record<string, boolean>;

export type AdminReportActionHandlers = {
  updateReportStatus: (reportId: string, status: ReportStatus, duplicateOfReportId?: string | null) => Promise<void>;
  updateReportArea: (reportId: string, assignedArea: ReportAssignedArea | null) => Promise<void>;
  archiveReport: (reportId: string) => Promise<void>;
  restoreReport: (reportId: string) => Promise<void>;
};

export type AdminReportListItem = Report;
