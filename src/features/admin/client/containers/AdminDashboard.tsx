'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { startFeatureTourOnce } from '@/lib/onboarding/systemTour';
import { AdminAuthLoading, AdminUnauthorized } from '../components/AdminAccessState';
import { AdminDataTable } from '../components/AdminDataTable';
import { SideCard, Timeline } from '../components/AdminDashboardParts';
import { AdminTooltipButton } from '../components/AdminTooltipButton';
import { AdminNotifications, AdminProfileCard } from '../components/AdminTopbarWidgets';
import { getReportMetrics, ReportMetrics } from '../components/ReportMetrics';
import { StatsPanel } from '../components/StatsPanel';
import { ConfigView } from './ConfigView';
import { EmployeesView, getHomeActivityRows } from './EmployeesView';
import { StatsView } from './StatsView';
import { AlertsView } from './AlertsView';
import { ADMIN_HOME_ALERT_PAGE_SIZE } from '../constants/admin.constants';
import {
  getHashView,
  getStoredSidebarCollapsed,
  setStoredSidebarCollapsed,
  getStoredPageSize,
  setStoredPageSize,
} from '../helpers/adminDashboardStorage';
import { useAdminReports } from '../hooks/useAdminReports';
import { useAdminEmployees } from '../hooks/useAdminEmployees';
import type { AdminPageSize, AdminStatusFilter, AdminTimeframeFilter } from '../types/admin.types';
import type { AdminView, ReportsViewProps } from '../types/adminDashboard.types';
import {
  ALERT_COLUMNS,
  renderAlertRows,
  ReportTableFilters,
} from '../components/ReportRowParts';
import {
  Badge,
  BarChart3,
  Bell,
  Home,
  Map,
  Search,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const PAGE_SIZE_STORAGE_KEY_HOME = 'admin.home.pageSize' as const;

const ADMIN_VIEWS: Array<{ id: AdminView; label: string; icon: React.ReactNode }> = [
  { id: 'home', label: 'Inicio', icon: <Home size={18} /> },
  { id: 'alerts', label: 'Alertas', icon: <Bell size={18} /> },
  { id: 'employees', label: 'Empleados', icon: <Badge size={18} /> },
  { id: 'stats', label: 'Estadísticas', icon: <BarChart3 size={18} /> },
  { id: 'config', label: 'Configuración', icon: <Settings size={18} /> },
];
const ADMIN_VIEW_IDS = ADMIN_VIEWS.map((view) => view.id);

export function AdminDashboard() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const [activeView, setActiveView] = useState<AdminView>(() => getHashView(ADMIN_VIEW_IDS));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getStoredSidebarCollapsed());
  const canManageSystem = profile?.role === 'admin';

  useEffect(() => {
    if (!authLoading && isAdmin) {
      startFeatureTourOnce(`admin-${activeView}`, profile?.role);
    }
  }, [activeView, authLoading, isAdmin, profile?.role]);

  if (authLoading) return <AdminAuthLoading />;
  if (!isAdmin) return <AdminUnauthorized />;

  return (
    <div className={`admin-stitch ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="admin-stitch-sidebar">
        <div className="admin-brand">
          {sidebarCollapsed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/ciudadalerta_icon_1779261666586.png" alt="Alerta Aguilares" />
          ) : (
            <>
              <h1>Alerta Aguilares</h1>
              <p>Panel municipal</p>
            </>
          )}
        </div>

        <nav className="admin-nav">
          {ADMIN_VIEWS.filter((item) => (item.id !== 'employees' && item.id !== 'config') || canManageSystem).map((item) => (
            <AdminTooltipButton key={item.id} label={item.label} side="right">
              <button
                data-tour={`admin-nav-${item.id}`}
                className={activeView === item.id ? 'active' : ''}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  window.history.replaceState(null, '', `#${item.id}`);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </AdminTooltipButton>
          ))}
        </nav>

        <AdminTooltipButton label={sidebarCollapsed ? 'Expandir sidebar' : 'Ocultar sidebar'} side="right">
          <button
            className="admin-report-button"
            type="button"
            onClick={() => {
              const nextValue = !sidebarCollapsed;
              setSidebarCollapsed(nextValue);
              setStoredSidebarCollapsed(nextValue);
            }}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{sidebarCollapsed ? 'Abrir' : 'Ocultar sidebar'}</span>
          </button>
        </AdminTooltipButton>
      </aside>

      <header className="admin-stitch-topbar">
        <div className="admin-search">
          <Search size={17} />
          <input placeholder="Buscar alertas, calles o empleados..." type="text" />
        </div>
        <div className="admin-top-actions">
          <AdminNotifications user={user} />
          <AdminProfileCard profile={profile} user={user} role={profile?.role} />
        </div>
      </header>

      <main className="admin-stitch-main">
        {activeView === 'home' && <HomeView user={user} isAdmin={isAdmin} role={profile?.role ?? null} />}
        {activeView === 'alerts' && <AlertsView user={user} isAdmin={isAdmin} role={profile?.role ?? null} />}
        {activeView === 'employees' && canManageSystem && <EmployeesView />}
        {activeView === 'employees' && !canManageSystem && <HomeView user={user} isAdmin={isAdmin} role={profile?.role ?? null} />}
        {activeView === 'stats' && <StatsView user={user} isAdmin={isAdmin} role={profile?.role ?? null} />}
        {activeView === 'config' && canManageSystem && <ConfigView />}
        {activeView === 'config' && !canManageSystem && <HomeView user={user} isAdmin={isAdmin} role={profile?.role ?? null} />}
      </main>

      <AdminTooltipButton label="Ir al mapa" side="left">
        <Link className="admin-fab" href="/" aria-label="Ir al mapa">
          <Map size={24} />
        </Link>
      </AdminTooltipButton>
    </div>
  );
}

function HomeView({ user, isAdmin, role }: ReportsViewProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(() => getStoredPageSize(PAGE_SIZE_STORAGE_KEY_HOME, ADMIN_HOME_ALERT_PAGE_SIZE));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<AdminTimeframeFilter>('all');
  const { employees } = useAdminEmployees({ user, isAdmin: isAdmin && role === 'admin', page: 1, pageSize: 6 });
  const {
    reports,
    totalCount,
    summary,
    loadingReports,
    loadingPage,
    actionLoading,
    updateReportStatus,
    updateReportArea,
    archiveReport,
    restoreReport,
  } = useAdminReports({
    user,
    isAdmin,
    pageSize,
    currentPage: page,
    filters: { search: searchQuery, status: statusFilter, category: categoryFilter, timeframe: timeframeFilter },
    sort: 'priority',
  });
  const metrics = getReportMetrics(summary, loadingReports);
  const clearHomeAlertFilters = useCallback(() => {
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
          title="Alertas Importantes"
          columns={ALERT_COLUMNS}
          className="admin-alerts"
          height={760}
          width="100%"
          loading={loadingReports || loadingPage}
          skeletonRows={pageSize}
          filters={<ReportTableFilters searchQuery={searchQuery} statusFilter={statusFilter} categoryFilter={categoryFilter} setSearchQuery={setSearchQuery} setStatusFilter={setStatusFilter} setCategoryFilter={setCategoryFilter} resetPage={() => setPage(1)} clearFilters={clearHomeAlertFilters} />}
          pagination={{
            page,
            pageSize,
            total: totalCount,
            onPageChange: setPage,
            onPageSizeChange: (nextPageSize) => {
              setStoredPageSize(PAGE_SIZE_STORAGE_KEY_HOME, nextPageSize);
              setPageSize(nextPageSize);
              setPage(1);
            },
          }}
        >
          {renderAlertRows(reports, actionLoading, { updateReportStatus, updateReportArea, archiveReport, restoreReport }, role)}
        </AdminDataTable>

        <aside className="admin-side-stack admin-home-side-stack">
          <StatsPanel stats={summary.categoryStats || []} loading={loadingReports && summary.totalReports === 0} />
          <SideCard title="Actividad reciente" className="admin-home-activity-card">
            <Timeline rows={getHomeActivityRows(reports, employees)} className="admin-home-activity-list" />
          </SideCard>
        </aside>
      </div>
    </>
  );
}
