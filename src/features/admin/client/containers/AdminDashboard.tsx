'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminReports } from '../hooks/useAdminReports';
import type { AdminPageSize, AdminStatusFilter, AdminTimeframeFilter } from '../types/admin.types';
import { AdminAuthLoading, AdminUnauthorized } from '../components/AdminAccessState';
import { AdminHeader } from '../components/AdminHeader';
import { AdminMetrics } from '../components/AdminMetrics';
import { AdminReportsPanel } from '../components/AdminReportsPanel';

export function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<AdminTimeframeFilter>('all');
  const [pageSize, setPageSize] = useState<AdminPageSize>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const adminFilters = useMemo(
    () => ({
      search: searchQuery,
      status: statusFilter,
      category: categoryFilter,
      timeframe: timeframeFilter,
    }),
    [categoryFilter, searchQuery, statusFilter, timeframeFilter]
  );
  const {
    reports,
    totalCount,
    summary,
    loadingReports,
    loadingPage,
    actionLoading,
    updateReportStatus,
    archiveReport,
    restoreReport,
  } = useAdminReports({
    user,
    isAdmin,
    pageSize,
    currentPage,
    filters: adminFilters,
  });

  if (authLoading) {
    return <AdminAuthLoading />;
  }

  if (!isAdmin) {
    return <AdminUnauthorized />;
  }

  const totalVisibleConfirmations = reports.reduce((acc, report) => acc + (report.verifiedCount || 0), 0);
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    timeframeFilter !== 'all';
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStartIndex = totalCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + reports.length, totalCount);
  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < pageCount;

  const resetPagination = () => setCurrentPage(1);
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setTimeframeFilter('all');
    resetPagination();
  };

  return (
    <div className="min-h-dvh bg-background text-foreground font-jakarta flex flex-col select-none">
      <AdminHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        <AdminMetrics
          activeReports={summary.activeReports}
          resolvedReports={summary.resolvedReports}
          visibleConfirmations={totalVisibleConfirmations}
          archivedReports={summary.archivedReports}
          loadingReports={loadingReports}
          loadingPage={loadingPage}
        />

        <AdminReportsPanel
          reports={reports}
          totalCount={totalCount}
          summary={summary}
          loadingReports={loadingReports}
          loadingPage={loadingPage}
          actionLoading={actionLoading}
          pageSize={pageSize}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          timeframeFilter={timeframeFilter}
          archivedCount={summary.archivedReports}
          hasActiveFilters={hasActiveFilters}
          pageCount={pageCount}
          safeCurrentPage={safeCurrentPage}
          pageStartIndex={pageStartIndex}
          pageEndIndex={pageEndIndex}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          setPageSize={setPageSize}
          setCurrentPage={setCurrentPage}
          setSearchQuery={setSearchQuery}
          setStatusFilter={setStatusFilter}
          setCategoryFilter={setCategoryFilter}
          setTimeframeFilter={setTimeframeFilter}
          resetPagination={resetPagination}
          clearFilters={clearFilters}
          updateReportStatus={updateReportStatus}
          archiveReport={archiveReport}
          restoreReport={restoreReport}
        />
      </main>
    </div>
  );
}
