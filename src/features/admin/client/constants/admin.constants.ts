import type { AdminPageSize, AdminReportSummary } from '../types/admin.types';

export const PAGE_SIZE_OPTIONS: AdminPageSize[] = [6, 10, 25, 50, 100];
export const ADMIN_DEFAULT_PAGE_SIZE: AdminPageSize = 25;
export const ADMIN_HOME_ALERT_PAGE_SIZE: AdminPageSize = 6;
export const ADMIN_SUMMARY_CATEGORY_LIMIT = 4;
export const ADMIN_MOCK_TABLE_PAGE_SIZE: AdminPageSize = 10;

export const EMPTY_ADMIN_SUMMARY: AdminReportSummary = {
  totalReports: 0,
  activeReports: 0,
  pendingReports: 0,
  verifyingReports: 0,
  inProgressReports: 0,
  resolvedReports: 0,
  dismissedReports: 0,
  duplicateReports: 0,
  archivedReports: 0,
  avgResolutionHours: null,
};
