'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { type AuthUser } from '@/hooks/useAuth';
import { CATEGORIES } from '@/lib/constants/categories';
import { AdminDataTable } from '../components/AdminDataTable';
import { SideCard, CategoryLabel } from '../components/AdminDashboardParts';
import { getReportMetrics, ReportMetrics } from '../components/ReportMetrics';
import { ADMIN_DEFAULT_PAGE_SIZE } from '../constants/admin.constants';
import { getStoredPageSize, setStoredPageSize } from '../helpers/adminDashboardStorage';
import { useAdminReports } from '../hooks/useAdminReports';
import type { AdminPageSize, AdminStatusFilter, AdminTimeframeFilter, AdminReportListItem } from '../types/admin.types';
import type { ReportsViewProps } from '../types/adminDashboard.types';
import {
  ALERT_COLUMNS,
  renderAlertRows,
  ReportTableFilters,
  getReportStatusLabel,
  getReportStatusTone,
  formatRecentDate,
} from '../components/ReportRowParts';
import { FileSpreadsheet } from 'lucide-react';

const PAGE_SIZE_STORAGE_KEY_ALERTS = 'admin.alerts.pageSize' as const;

export function AlertsView({ user, isAdmin, role }: ReportsViewProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(() => getStoredPageSize(PAGE_SIZE_STORAGE_KEY_ALERTS, ADMIN_DEFAULT_PAGE_SIZE));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<AdminTimeframeFilter>('all');
  const {
    reports,
    totalCount,
    summary,
    loadingReports,
    loadingPage,
    actionLoading,
    updateReportStatus,
    updateReportArea,
    updateReportPriority,
    archiveReport,
    restoreReport,
  } = useAdminReports({
    user,
    isAdmin,
    pageSize,
    currentPage: page,
    filters: { search: searchQuery, status: statusFilter, category: categoryFilter, timeframe: timeframeFilter },
  });
  const metrics = getReportMetrics(summary, loadingReports);
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setTimeframeFilter('all');
    setPage(1);
  }, []);

  return (
    <>
      <ReportMetrics
        {...metrics}
        activeFilter={statusFilter}
        onFilter={(status) => { setStatusFilter(status); setPage(1); }}
      />
      <div className="admin-dashboard-grid">
        <AdminDataTable
          title="Gestion de Alertas"
          columns={ALERT_COLUMNS}
          className="admin-alerts"
          height={760}
          width="100%"
          loading={loadingReports || loadingPage}
          skeletonRows={pageSize}
          filters={<ReportTableFilters searchQuery={searchQuery} statusFilter={statusFilter} categoryFilter={categoryFilter} setSearchQuery={setSearchQuery} setStatusFilter={setStatusFilter} setCategoryFilter={setCategoryFilter} resetPage={() => setPage(1)} clearFilters={clearFilters} />}
          toolbar={<ExportReportsButton user={user} searchQuery={searchQuery} statusFilter={statusFilter} categoryFilter={categoryFilter} timeframeFilter={timeframeFilter} sort="recent" />}
          pagination={{
            page,
            pageSize,
            total: totalCount,
            onPageChange: setPage,
            onPageSizeChange: (nextPageSize) => {
              setStoredPageSize(PAGE_SIZE_STORAGE_KEY_ALERTS, nextPageSize);
              setPageSize(nextPageSize);
              setPage(1);
            },
          }}
        >
          {renderAlertRows(reports, actionLoading, { updateReportStatus, updateReportArea, updateReportPriority, archiveReport, restoreReport }, role)}
        </AdminDataTable>
        <aside className="admin-side-stack admin-alerts-side-stack">
          <SideCard title="Alertas entrantes" className="admin-incoming-card">
            <IncomingAlerts reports={reports} />
          </SideCard>
        </aside>
      </div>
    </>
  );
}

function ExportReportsButton({
  user,
  searchQuery,
  statusFilter,
  categoryFilter,
  timeframeFilter,
  sort,
}: {
  user: AuthUser | null;
  searchQuery: string;
  statusFilter: AdminStatusFilter;
  categoryFilter: string;
  timeframeFilter: AdminTimeframeFilter;
  sort: 'recent' | 'priority';
}) {
  const exportReports = async () => {
    if (!user) throw new Error('Sesion no disponible.');

    const token = await user.getIdToken();
    const params = new URLSearchParams({
      status: statusFilter,
      category: categoryFilter,
      timeframe: timeframeFilter,
      sort,
    });
    const search = searchQuery.trim();
    if (search) params.set('search', search);

    const response = await fetch(`/api/admin/reports/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error || 'No se pudo exportar el Excel.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alertas-aguilares-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="admin-export-button"
      type="button"
      onClick={() => {
        void toast.promise(exportReports(), {
          loading: 'Generando Excel...',
          success: 'Excel exportado.',
          error: (error) => error instanceof Error ? error.message : 'No se pudo exportar el Excel.',
        });
      }}
      aria-label="Exportar alertas a Excel"
      title="Exportar alertas a Excel"
    >
      <FileSpreadsheet size={17} />
      <span>Exportar</span>
    </button>
  );
}

function IncomingAlerts({ reports }: { reports: AdminReportListItem[] }) {
  const rows = reports.slice(0, 6);

  if (rows.length === 0) {
    return <p className="admin-empty-side">Sin alertas entrantes</p>;
  }

  return (
    <div className="admin-incoming-alerts">
      {rows.map((report) => {
        const category = CATEGORIES[report.category];
        const status = getReportStatusLabel(report.status);

        return (
          <article key={report.id} className="admin-incoming-alert">
            <div className="admin-incoming-alert-top">
              <CategoryLabel label={category?.label || report.category} color={category?.color} iconName={category?.iconName} />
              <b>{report.verifiedCount || 0} reportes</b>
            </div>
            <strong>{report.title || 'Nueva alerta'}</strong>
            <small>{report.locationLabel || 'Direccion no disponible'}</small>
            <div className="admin-incoming-alert-bottom">
              <span className={`admin-status ${getReportStatusTone(report.status)}`}>{status}</span>
              <time>{formatRecentDate(report.createdAt)}</time>
            </div>
          </article>
        );
      })}
    </div>
  );
}
