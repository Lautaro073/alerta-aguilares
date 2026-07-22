import { AlertTriangle, CheckCircle2, Copy, EyeOff, Search, ShieldAlert, TrendingUp } from 'lucide-react';
import { Metric } from './AdminDashboardParts';
import type { AdminReportSummary, AdminStatusFilter } from '../types/admin.types';

export function ReportMetrics({
  pendingReports,
  verifyingReports,
  inProgressReports,
  resolvedReports,
  duplicateReports,
  dismissedReports,
  archivedReports,
  activeFilter,
  onFilter,
}: {
  pendingReports: string | number;
  verifyingReports: string | number;
  inProgressReports: string | number;
  resolvedReports: string | number;
  duplicateReports: string | number;
  dismissedReports: string | number;
  archivedReports: string | number;
  activeFilter?: AdminStatusFilter;
  onFilter?: (status: AdminStatusFilter) => void;
}) {
  return (
    <section className="admin-metrics">
      <Metric tone="error" icon={<AlertTriangle size={22} />} label="Pendientes" value={pendingReports} active={activeFilter === 'PENDING'} {...(onFilter ? { onClick: () => onFilter('PENDING') } : {})} />
      <Metric tone="primary" icon={<Search size={22} />} label="En verificacion" value={verifyingReports} active={activeFilter === 'VERIFYING'} {...(onFilter ? { onClick: () => onFilter('VERIFYING') } : {})} />
      <Metric tone="tertiary" icon={<TrendingUp size={22} />} label="En proceso" value={inProgressReports} active={activeFilter === 'IN_PROGRESS'} {...(onFilter ? { onClick: () => onFilter('IN_PROGRESS') } : {})} />
      <Metric tone="secondary" icon={<CheckCircle2 size={22} />} label="Resueltas" value={resolvedReports} active={activeFilter === 'RESOLVED'} {...(onFilter ? { onClick: () => onFilter('RESOLVED') } : {})} />
      <Metric tone="warning" icon={<Copy size={22} />} label="Duplicadas" value={duplicateReports} active={activeFilter === 'DUPLICATE'} {...(onFilter ? { onClick: () => onFilter('DUPLICATE') } : {})} />
      <Metric tone="danger" icon={<ShieldAlert size={22} />} label="Desestimadas" value={dismissedReports} active={activeFilter === 'DISMISSED'} {...(onFilter ? { onClick: () => onFilter('DISMISSED') } : {})} />
      <Metric tone="muted" icon={<EyeOff size={22} />} label="Ocultas" value={archivedReports} active={activeFilter === 'DELETED'} {...(onFilter ? { onClick: () => onFilter('DELETED') } : {})} />
    </section>
  );
}

export function getReportMetrics(summary: AdminReportSummary, loadingReports: boolean) {
  const isInitialLoad = loadingReports && summary.totalReports === 0;

  return {
    pendingReports: isInitialLoad ? '...' : summary.pendingReports,
    verifyingReports: isInitialLoad ? '...' : summary.verifyingReports,
    inProgressReports: isInitialLoad ? '...' : summary.inProgressReports,
    resolvedReports: isInitialLoad ? '...' : summary.resolvedReports,
    duplicateReports: isInitialLoad ? '...' : summary.duplicateReports,
    dismissedReports: isInitialLoad ? '...' : summary.dismissedReports,
    archivedReports: isInitialLoad ? '...' : summary.archivedReports,
  };
}
