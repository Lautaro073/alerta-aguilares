import type { AdminPageSize, AdminReportSummary } from '../types/admin.types';

export const PAGE_SIZE_OPTIONS: AdminPageSize[] = [10, 25, 50, 100];
export const ADMIN_LIST_HEIGHT_CLASS = 'h-[612px]';

export const EMPTY_ADMIN_SUMMARY: AdminReportSummary = {
  totalReports: 0,
  activeReports: 0,
  resolvedReports: 0,
  archivedReports: 0,
};
