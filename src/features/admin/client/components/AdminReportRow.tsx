import CategoryIcon from '@/components/ui/CategoryIcon';
import { CATEGORIES } from '@/lib/constants/categories';
import {
  Archive,
  Calendar,
  Check,
  Copy,
  Loader2,
  MapPin,
  RotateCcw,
  UserCircle,
  Users,
} from 'lucide-react';
import type {
  AdminActionLoading,
  AdminReportActionHandlers,
  AdminReportListItem,
} from '../types/admin.types';
import { AdminTooltipButton } from './AdminTooltipButton';

type AdminReportRowProps = AdminReportActionHandlers & {
  report: AdminReportListItem;
  actionLoading: AdminActionLoading;
};

export function AdminReportRow({
  report,
  actionLoading,
  updateReportStatus,
  archiveReport,
  restoreReport,
}: AdminReportRowProps) {
  const catConfig = CATEGORIES[report.category];
  const catColor = catConfig?.color || '#9CA3AF';
  const hasPhotos = report.images && report.images.length > 0;
  const isOpLoading = actionLoading[report.id];
  const locationText = report.locationLabel || 'Direccion no disponible';

  return (
    <div
      className={`pointer-events-auto flex flex-col justify-between gap-4 rounded-lg border p-4 transition-all md:flex-row md:items-center ${
        report.deletedAt
          ? 'border-slate-200 bg-slate-50 opacity-70 hover:opacity-90'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border"
          style={{
            backgroundColor: `${catColor}12`,
            borderColor: `${catColor}30`,
            color: catColor,
          }}
        >
          <CategoryIcon name={catConfig?.iconName || 'HelpCircle'} size={18} color={catColor} />
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-outfit max-w-[240px] truncate text-sm font-extrabold sm:max-w-md ${
              report.deletedAt ? 'line-through text-slate-400' : 'text-slate-900'
            }`}>
              {report.title}
            </h3>

            {report.deletedAt && <StatusChip tone="slate">Archivado</StatusChip>}
            {!report.deletedAt && report.status === 'PENDING' && <StatusChip tone="amber">Pendiente</StatusChip>}
            {!report.deletedAt && report.status === 'VERIFYING' && <StatusChip tone="amber">En verificacion</StatusChip>}
            {!report.deletedAt && report.status === 'IN_PROGRESS' && <StatusChip tone="amber">En proceso</StatusChip>}
            {!report.deletedAt && report.status === 'RESOLVED' && <StatusChip tone="emerald">Resuelto</StatusChip>}
            {!report.deletedAt && report.status === 'DISMISSED' && <StatusChip tone="slate">Desestimado</StatusChip>}
            {!report.deletedAt && report.status === 'DUPLICATE' && <StatusChip tone="slate">Duplicado</StatusChip>}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] font-medium text-slate-500 select-none">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="shrink-0" />
              <span>
                {new Date(report.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
            <span className="flex items-center gap-1 font-mono text-[9.5px]">
              <MapPin size={11} className="shrink-0" />
              <span className="font-sans text-[10.5px]">{locationText}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} className="shrink-0 text-[#075985]" />
              <span className="font-bold text-slate-800">{report.verifiedCount || 0} apoyos</span>
            </span>
            <span className="flex items-center gap-1">
              <UserCircle size={11} className={`shrink-0 ${report.userDisplayName ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span className={report.userDisplayName ? 'font-bold text-emerald-700' : 'italic text-slate-400'}>
                {report.userDisplayName || 'Anonimo'}
              </span>
            </span>
            {hasPhotos && (
              <span className="rounded-sm border border-sky-200 bg-sky-50 px-1.5 py-0.1 text-[9px] font-bold text-[#075985]">
                Con foto
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end md:self-center">
        {report.deletedAt ? (
          <AdminTooltipButton label="Restaurar reporte" disabled={isOpLoading}>
            <button
              onClick={() => restoreReport(report.id)}
              disabled={isOpLoading}
              className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-[10.5px] font-bold text-emerald-700 transition-all hover:bg-emerald-100"
              aria-label="Restaurar reporte"
            >
              {isOpLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              <span>Restaurar</span>
            </button>
          </AdminTooltipButton>
        ) : (
          <>
            {report.status !== 'RESOLVED' && (
              <AdminTooltipButton label="Resolver incidente" disabled={isOpLoading}>
                <button
                  onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                  disabled={isOpLoading}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all hover:bg-emerald-100"
                  aria-label="Resolver incidente"
                >
                  {isOpLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                </button>
              </AdminTooltipButton>
            )}

            {report.status !== 'DUPLICATE' && (
              <AdminTooltipButton label="Marcar como duplicado" disabled={isOpLoading}>
                <button
                  onClick={() => updateReportStatus(report.id, 'DUPLICATE')}
                  disabled={isOpLoading}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-[#075985] transition-all hover:bg-sky-100"
                  aria-label="Marcar como duplicado"
                >
                  {isOpLoading ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
                </button>
              </AdminTooltipButton>
            )}

            {report.status !== 'PENDING' && (
              <AdminTooltipButton label="Reabrir reporte" disabled={isOpLoading}>
                <button
                  onClick={() => updateReportStatus(report.id, 'PENDING')}
                  disabled={isOpLoading}
                  className="flex h-8 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-2 text-[10.5px] font-bold text-slate-700 transition-all hover:bg-slate-100"
                  aria-label="Reabrir reporte"
                >
                  {isOpLoading ? <Loader2 size={12} className="animate-spin" /> : <span>Reabrir</span>}
                </button>
              </AdminTooltipButton>
            )}

            <AdminTooltipButton label="Archivar reporte" disabled={isOpLoading}>
              <button
                onClick={() => archiveReport(report.id)}
                disabled={isOpLoading}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100"
                aria-label="Archivar reporte"
              >
                {isOpLoading ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
              </button>
            </AdminTooltipButton>
          </>
        )}
      </div>
    </div>
  );
}

function StatusChip({ tone, children }: { tone: 'amber' | 'emerald' | 'slate'; children: React.ReactNode }) {
  const className = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-300 bg-slate-100 text-slate-600',
  }[tone];

  return (
    <span className={`rounded-sm border px-2 py-0.5 text-[9px] font-bold ${className}`}>
      {children}
    </span>
  );
}
