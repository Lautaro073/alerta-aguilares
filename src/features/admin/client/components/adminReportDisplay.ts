import type { CategoryId } from '@/lib/constants/categories';
import type { ReportAssignedArea, ReportPriority } from '@/types/report';
import type { AdminReportListItem } from '../types/admin.types';
import { getOptionLabel } from './AdminDashboardParts';

export const HIGH_PRIORITY_CATEGORIES: CategoryId[] = ['ACCIDENTE', 'SEMAFORO', 'ALUMBRADO'];
export const MEDIUM_PRIORITY_CATEGORIES: CategoryId[] = ['BACHE', 'SENALIZACION', 'VEHICULO_ABANDONADO'];
export const REPORT_AREA_OPTIONS: Array<{ value: ReportAssignedArea; label: string }> = [
  { value: 'traffic', label: 'Transito' },
  { value: 'public_works', label: 'Obras Publicas' },
  { value: 'lighting', label: 'Alumbrado' },
  { value: 'environment', label: 'Ambiente' },
];

export function getCategoryPriority(category: CategoryId) {
  if (HIGH_PRIORITY_CATEGORIES.includes(category)) return { tone: 'error', count: 3 };
  if (MEDIUM_PRIORITY_CATEGORIES.includes(category)) return { tone: 'primary', count: 2 };
  return { tone: 'secondary', count: 1 };
}

export function getReportPriority(priority: ReportPriority | null | undefined, category: CategoryId) {
  if (!priority) return getCategoryPriority(category);
  if (priority === 'high') return { tone: 'error', count: 3 };
  if (priority === 'medium') return { tone: 'primary', count: 2 };
  return { tone: 'secondary', count: 1 };
}

export function getReportStatusLabel(status: AdminReportListItem['status']) {
  if (status === 'PENDING') return 'PENDIENTE';
  if (status === 'VERIFYING') return 'EN VERIFICACION';
  if (status === 'IN_PROGRESS') return 'EN PROCESO';
  if (status === 'RESOLVED') return 'RESUELTO';
  if (status === 'DISMISSED') return 'DESESTIMADO';
  return 'DUPLICADO';
}

export function getReportStatusTone(status: AdminReportListItem['status']) {
  if (status === 'RESOLVED') return 'resolved';
  if (status === 'DUPLICATE' || status === 'DISMISSED') return 'duplicate';
  if (status === 'IN_PROGRESS') return 'primary';
  if (status === 'VERIFYING') return 'pending';
  return 'active';
}

export function getReportAreaLabel(area: ReportAssignedArea | null | undefined) {
  return REPORT_AREA_OPTIONS.find((option) => option.value === area)?.label || 'Sin derivar';
}

export function formatRecentDate(value: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffMinutes < 1440) return `Hace ${Math.round(diffMinutes / 60)} h`;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatReportEventValue(value: unknown) {
  if (typeof value !== 'string' || !value) return 'Sin dato';
  if (value === 'PENDING') return 'Pendiente';
  if (value === 'VERIFYING') return 'En verificacion';
  if (value === 'IN_PROGRESS') return 'En proceso';
  if (value === 'RESOLVED') return 'Resuelta';
  if (value === 'DISMISSED') return 'Desestimada';
  if (value === 'DUPLICATE') return 'Duplicada';
  return getOptionLabel(REPORT_AREA_OPTIONS, value) || value;
}

export function formatReportAreaEventValue(value: unknown) {
  if (typeof value !== 'string' || !value) return 'Sin derivacion';
  return getOptionLabel(REPORT_AREA_OPTIONS, value) || value;
}
