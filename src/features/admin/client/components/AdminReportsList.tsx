import { AlertTriangle } from 'lucide-react';
import { ADMIN_LIST_HEIGHT_CLASS } from '../constants/admin.constants';
import type {
  AdminActionLoading,
  AdminPageSize,
  AdminReportActionHandlers,
  AdminReportListItem,
} from '../types/admin.types';
import { AdminReportRow } from './AdminReportRow';
import { AdminReportSkeletonRows } from './AdminReportSkeletonRows';

type AdminReportsListProps = AdminReportActionHandlers & {
  reports: AdminReportListItem[];
  totalCount: number;
  loadingReports: boolean;
  loadingPage: boolean;
  actionLoading: AdminActionLoading;
  pageSize: AdminPageSize;
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

export function AdminReportsList({
  reports,
  totalCount,
  loadingReports,
  loadingPage,
  actionLoading,
  pageSize,
  hasActiveFilters,
  clearFilters,
  updateReportStatus,
  archiveReport,
  restoreReport,
}: AdminReportsListProps) {
  if (loadingReports) {
    return (
      <div className={`${ADMIN_LIST_HEIGHT_CLASS} flex flex-col gap-3 overflow-y-hidden pr-1`}>
        <AdminReportSkeletonRows count={pageSize} />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className={`${ADMIN_LIST_HEIGHT_CLASS} text-center select-none flex flex-col items-center justify-center gap-3 border border-dashed border-border/40 rounded-xl`}>
        <AlertTriangle size={32} className="text-muted/40 animate-pulse-slow" />
        <p className="text-sm font-bold text-muted">No se encontraron reportes con los filtros aplicados.</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-9 px-4 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 text-xs text-foreground font-bold transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${ADMIN_LIST_HEIGHT_CLASS} visible-scrollbar flex flex-col gap-3 overflow-y-auto pr-2`}>
      {loadingPage && reports.length === 0 ? (
        <AdminReportSkeletonRows count={pageSize} />
      ) : reports.map((report) => (
        <AdminReportRow
          key={report.id}
          report={report}
          actionLoading={actionLoading}
          updateReportStatus={updateReportStatus}
          archiveReport={archiveReport}
          restoreReport={restoreReport}
        />
      ))}
      {loadingPage && reports.length > 0 && reports.length < pageSize && (
        <AdminReportSkeletonRows count={pageSize - reports.length} />
      )}
    </div>
  );
}
