import { AlertTriangle } from 'lucide-react';
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
  updateReportArea,
  archiveReport,
  restoreReport,
}: AdminReportsListProps) {
  if (loadingReports) {
    return (
      <div className="h-[612px] flex flex-col gap-3 overflow-y-hidden pr-1">
        <AdminReportSkeletonRows count={pageSize} />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="h-[612px] flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 text-center select-none">
        <AlertTriangle size={32} className="animate-pulse-slow text-slate-300" />
        <p className="text-sm font-bold text-slate-500">No se encontraron reportes con los filtros aplicados.</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-9 cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-[612px] visible-scrollbar flex flex-col gap-3 overflow-y-auto pr-2">
      {loadingPage && reports.length === 0 ? (
        <AdminReportSkeletonRows count={pageSize} />
      ) : reports.map((report) => (
        <AdminReportRow
          key={report.id}
          report={report}
          actionLoading={actionLoading}
          updateReportStatus={updateReportStatus}
          updateReportArea={updateReportArea}
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
