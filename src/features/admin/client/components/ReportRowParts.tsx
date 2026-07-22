'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/constants/categories';
import type { ReportAssignedArea } from '@/types/report';
import { type AdminDataTableColumn } from './AdminDataTable';
import { CategoryLabel, PriorityBars } from './AdminDashboardParts';
import { AdminTooltipButton } from './AdminTooltipButton';
import { ReportHistorySheet } from './ReportHistorySheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  REPORT_AREA_OPTIONS,
  getReportAreaLabel,
  getReportPriority,
  getReportStatusLabel,
  getReportStatusTone,
} from './adminReportDisplay';
import type {
  AdminActionLoading,
  AdminReportActionHandlers,
  AdminReportListItem,
  AdminStatusFilter,
} from '../types/admin.types';
import type { ReportsViewProps } from '../types/adminDashboard.types';
import {
  Archive,
  CheckCircle2,
  Copy,
  History,
  Search,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

const REPORT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente', icon: History },
  { value: 'VERIFYING', label: 'En verificacion', icon: Search },
  { value: 'IN_PROGRESS', label: 'En proceso', icon: TrendingUp },
  { value: 'RESOLVED', label: 'Resuelta', icon: CheckCircle2 },
  { value: 'DUPLICATE', label: 'Duplicada', icon: Copy },
  { value: 'DISMISSED', label: 'Desestimada', icon: ShieldAlert },
] satisfies Array<{ value: AdminReportListItem['status']; label: string; icon: typeof History }>;

export {
  HIGH_PRIORITY_CATEGORIES,
  MEDIUM_PRIORITY_CATEGORIES,
  REPORT_AREA_OPTIONS,
  formatRecentDate,
  getCategoryPriority,
  getReportAreaLabel,
  getReportStatusLabel,
  getReportStatusTone,
} from './adminReportDisplay';

export const ALERT_COLUMNS: AdminDataTableColumn[] = [
  { key: 'category', label: 'Categoria' },
  { key: 'location', label: 'Ubicacion' },
  { key: 'status', label: 'Estado' },
  { key: 'reports', label: 'Reportes', className: 'center' },
  { key: 'priority', label: 'Prioridad' },
  { key: 'assigned', label: 'Area' },
  { key: 'actions', label: 'Acciones', className: 'right' },
];

export function ReportActionButtons({
  report,
  loading,
  role,
  updateReportStatus,
  restoreReport,
  onDetailOpenChange,
}: AdminReportActionHandlers & { report: AdminReportListItem; loading: boolean; role: ReportsViewProps['role']; onDetailOpenChange?: (open: boolean) => void }) {
  const canUpdate = role === 'admin' || role === 'official';
  const canModerate = role === 'admin';
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const handleDetailOpenChange = (open: boolean) => {
    onDetailOpenChange?.(open);
  };

  if (!canUpdate && !canModerate) return <div className="admin-actions" />;

  if (report.deletedAt) {
    if (!canModerate) return <div className="admin-actions" />;

    return (
      <div className="admin-actions">
        <ReportHistorySheet
          report={report}
          loading={loading}
          updateReportStatus={updateReportStatus}
          onOpenChange={handleDetailOpenChange}
        />
        <AdminTooltipButton label="Restaurar alerta" disabled={loading}>
          <button aria-label="Restaurar alerta" type="button" disabled={loading} onClick={() => restoreReport(report.id)}>
            <Archive size={16} />
          </button>
        </AdminTooltipButton>
      </div>
    );
  }

  return (
    <div className="admin-actions">
      <ReportHistorySheet
        report={report}
        loading={loading}
        updateReportStatus={updateReportStatus}
        open={detailSheetOpen}
        hideTrigger
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          handleDetailOpenChange(open);
        }}
      />
      <AdminTooltipButton label="Ver detalle" disabled={loading}>
        <button type="button" aria-label="Ver detalle" disabled={loading} onClick={() => { setDetailSheetOpen(true); handleDetailOpenChange(true); }}>
          <History size={16} />
        </button>
      </AdminTooltipButton>
    </div>
  );
}

function ReportStatusSelect({
  value,
  loading,
  onChange,
}: {
  value: AdminReportListItem['status'];
  loading: boolean;
  onChange: (status: AdminReportListItem['status']) => void;
}) {
  const current = REPORT_STATUS_OPTIONS.find((option) => option.value === value) || REPORT_STATUS_OPTIONS[0];

  if (!current) return null;

  const CurrentIcon = current.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="admin-inline-select compact admin-status-select" disabled={loading}>
          <CurrentIcon size={14} />
          <span>{current.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="admin-status-popover">
        {REPORT_STATUS_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button key={option.value} type="button" disabled={loading || option.value === value} onClick={() => onChange(option.value)}>
              <Icon size={15} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

type ReportRowProps = AdminReportActionHandlers & {
  report: AdminReportListItem;
  loading: boolean;
  role: ReportsViewProps['role'];
  menuDirection?: 'up' | 'down';
};

export function ReportRow({ report, loading, role, menuDirection = 'down', updateReportStatus, updateReportArea, archiveReport, restoreReport }: ReportRowProps) {
  const category = CATEGORIES[report.category];
  const status = getReportStatusLabel(report.status);
  const priority = getReportPriority(report.priority, report.category);
  const canUpdate = role === 'admin' || role === 'official';
  const canEditStatus = canUpdate && !report.deletedAt;
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <tr className={[detailOpen ? 'admin-detail-focus' : '', menuDirection === 'up' ? 'admin-actions-menu-up' : ''].filter(Boolean).join(' ') || undefined}>
      <td><CategoryLabel label={category?.label || report.title} color={category?.color} iconName={category?.iconName} /></td>
      <td>{report.locationLabel || 'Dirección no disponible'}</td>
      <td>
        {canEditStatus ? (
          <ReportStatusSelect value={report.status} loading={loading} onChange={(statusValue) => updateReportStatus(report.id, statusValue)} />
        ) : (
          <span className={`admin-status ${getReportStatusTone(report.status)}`}>{status}</span>
        )}
      </td>
      <td className="center bold">{report.verifiedCount || 0}</td>
      <td><PriorityBars tone={priority.tone} count={priority.count} /></td>
      <td>
        {canUpdate ? (
          <select className="admin-inline-select" value={report.assignedArea || ''} disabled={loading} onChange={(event) => updateReportArea(report.id, event.target.value ? event.target.value as ReportAssignedArea : null)}>
            <option value="">Sin derivar</option>
            {REPORT_AREA_OPTIONS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
          </select>
        ) : getReportAreaLabel(report.assignedArea)}
      </td>
      <td className="right">
        <ReportActionButtons
          report={report}
          loading={loading}
          role={role}
          updateReportStatus={updateReportStatus}
          updateReportArea={updateReportArea}
          archiveReport={archiveReport}
          restoreReport={restoreReport}
          onDetailOpenChange={setDetailOpen}
        />
      </td>
    </tr>
  );
}

export function renderAlertRows(
  reports: AdminReportListItem[],
  actionLoading: AdminActionLoading,
  actions: AdminReportActionHandlers,
  role: ReportsViewProps['role']
) {
  return reports.length > 0
    ? reports.map((report, index) => (
      <ReportRow
        key={report.id}
        report={report}
        loading={Boolean(actionLoading[report.id])}
        role={role}
        menuDirection={index >= reports.length - 3 ? 'up' : 'down'}
        {...actions}
      />
    ))
    : <tr><td colSpan={ALERT_COLUMNS.length} className="admin-empty-cell">Sin alertas para mostrar</td></tr>;
}

export function ReportTableFilters({
  searchQuery,
  statusFilter,
  categoryFilter,
  setSearchQuery,
  setStatusFilter,
  setCategoryFilter,
  resetPage,
  clearFilters,
}: {
  searchQuery: string;
  statusFilter: AdminStatusFilter;
  categoryFilter: string;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: AdminStatusFilter) => void;
  setCategoryFilter: (category: string) => void;
  resetPage: () => void;
  clearFilters: () => void;
}) {
  const hasFilters = searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL';

  return (
    <div className="admin-filters">
      <input placeholder="Buscar alerta..." value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); resetPage(); }} />
      <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as AdminStatusFilter); resetPage(); }}>
        <option value="ALL">Todos los estados</option>
        <option value="PENDING">Pendientes</option>
        <option value="VERIFYING">En verificacion</option>
        <option value="IN_PROGRESS">En proceso</option>
        <option value="RESOLVED">Resueltas</option>
        <option value="DISMISSED">Desestimadas</option>
        <option value="DUPLICATE">Duplicadas</option>
        <option value="DELETED">Ocultas</option>
      </select>
      <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); resetPage(); }}>
        <option value="ALL">Todas las categorias</option>
        {Object.values(CATEGORIES).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
      </select>
      {hasFilters && <button type="button" onClick={clearFilters}>Limpiar</button>}
    </div>
  );
}
