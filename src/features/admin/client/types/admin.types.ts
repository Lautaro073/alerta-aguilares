import type { Report } from '@/types/report';

export type ReportStatus = 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';
export type AdminStatusFilter = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'DUPLICATE' | 'DELETED';
export type AdminTimeframeFilter = 'all' | '7d' | '30d';
export type AdminPageSize = 10 | 25 | 50 | 100;

export interface AdminReportFilters {
  search: string;
  status: AdminStatusFilter;
  category: string;
  timeframe: AdminTimeframeFilter;
}

export interface AdminReportSummary {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  archivedReports: number;
}

export type AdminActionLoading = Record<string, boolean>;

export type AdminReportActionHandlers = {
  updateReportStatus: (reportId: string, status: ReportStatus) => Promise<void>;
  archiveReport: (reportId: string) => Promise<void>;
  restoreReport: (reportId: string) => Promise<void>;
};

export type AdminReportListItem = Report;
