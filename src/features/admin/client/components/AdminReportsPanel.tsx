'use client';

import { Loader2 } from 'lucide-react';
import type {
  AdminActionLoading,
  AdminPageSize,
  AdminReportActionHandlers,
  AdminReportListItem,
  AdminReportSummary,
  AdminStatusFilter,
  AdminTimeframeFilter,
} from '../types/admin.types';
import { AdminReportFilters } from './AdminReportFilters';
import { AdminReportsList } from './AdminReportsList';
import { AdminReportsPagination } from './AdminReportsPagination';

type AdminReportsPanelProps = AdminReportActionHandlers & {
  reports: AdminReportListItem[];
  totalCount: number;
  summary: AdminReportSummary;
  loadingReports: boolean;
  loadingPage: boolean;
  actionLoading: AdminActionLoading;
  pageSize: AdminPageSize;
  searchQuery: string;
  statusFilter: AdminStatusFilter;
  categoryFilter: string;
  timeframeFilter: AdminTimeframeFilter;
  archivedCount: number;
  hasActiveFilters: boolean;
  pageCount: number;
  safeCurrentPage: number;
  pageStartIndex: number;
  pageEndIndex: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  setPageSize: (pageSize: AdminPageSize) => void;
  setCurrentPage: (updater: number | ((page: number) => number)) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: AdminStatusFilter) => void;
  setCategoryFilter: (category: string) => void;
  setTimeframeFilter: (timeframe: AdminTimeframeFilter) => void;
  resetPagination: () => void;
  clearFilters: () => void;
};

export function AdminReportsPanel({
  reports,
  totalCount,
  summary,
  loadingReports,
  loadingPage,
  actionLoading,
  pageSize,
  searchQuery,
  statusFilter,
  categoryFilter,
  timeframeFilter,
  archivedCount,
  hasActiveFilters,
  pageCount,
  safeCurrentPage,
  pageStartIndex,
  pageEndIndex,
  canGoPrevious,
  canGoNext,
  setPageSize,
  setCurrentPage,
  setSearchQuery,
  setStatusFilter,
  setCategoryFilter,
  setTimeframeFilter,
  resetPagination,
  clearFilters,
  updateReportStatus,
  updateReportArea,
  archiveReport,
  restoreReport,
}: AdminReportsPanelProps) {
  return (
    <section id="alertas" className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 select-none md:flex-row md:items-center">
        <h2 className="font-outfit flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">
          <span>Alertas recientes</span>
          {loadingReports ? (
            <Loader2 size={14} className="animate-spin text-slate-400" />
          ) : (
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-500">
              {totalCount}
            </span>
          )}
        </h2>

        <AdminReportFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          timeframeFilter={timeframeFilter}
          archivedCount={archivedCount}
          hasActiveFilters={hasActiveFilters}
          setSearchQuery={setSearchQuery}
          setStatusFilter={setStatusFilter}
          setCategoryFilter={setCategoryFilter}
          setTimeframeFilter={setTimeframeFilter}
          resetPagination={resetPagination}
          clearFilters={clearFilters}
        />
      </div>

      <AdminReportsList
        reports={reports}
        totalCount={totalCount}
        loadingReports={loadingReports}
        loadingPage={loadingPage}
        actionLoading={actionLoading}
        pageSize={pageSize}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        updateReportStatus={updateReportStatus}
        updateReportArea={updateReportArea}
        archiveReport={archiveReport}
        restoreReport={restoreReport}
      />

      {!loadingReports && (
        <AdminReportsPagination
          totalCount={totalCount}
          summary={summary}
          pageSize={pageSize}
          pageCount={pageCount}
          safeCurrentPage={safeCurrentPage}
          pageStartIndex={pageStartIndex}
          pageEndIndex={pageEndIndex}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          hasActiveFilters={hasActiveFilters}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
          resetPagination={resetPagination}
        />
      )}
    </section>
  );
}
