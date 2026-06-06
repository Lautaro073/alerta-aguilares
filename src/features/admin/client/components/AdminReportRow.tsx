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
  const locationText = report.locationLabel || 'Dirección no disponible';

  return (
    <div
      className={`border border-border/40 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 pointer-events-auto ${
        report.deletedAt
          ? 'bg-surface-1/10 opacity-60 hover:opacity-80'
          : 'bg-surface-1/30 hover:bg-surface-1/50 hover:border-border-strong'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${catColor}12`,
            borderColor: `${catColor}30`,
            color: catColor,
          }}
        >
          <CategoryIcon name={catConfig?.iconName || 'HelpCircle'} size={18} color={catColor} />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className={`font-outfit font-extrabold text-sm truncate max-w-[240px] sm:max-w-md ${
              report.deletedAt ? 'line-through text-muted' : 'text-foreground'
            }`}>
              {report.title}
            </h3>

            {report.deletedAt && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-700/40 border border-slate-600/30 text-slate-400">
                Archivado
              </span>
            )}
            {!report.deletedAt && report.status === 'ACTIVE' && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Activo
              </span>
            )}
            {!report.deletedAt && report.status === 'RESOLVED' && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Resuelto
              </span>
            )}
            {!report.deletedAt && report.status === 'DUPLICATE' && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-muted">
                Duplicado
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5 text-[10.5px] text-muted font-medium select-none">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="shrink-0" />
              <span>
                {new Date(report.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>
            <span className="flex items-center gap-1 font-mono text-[9.5px]">
              <MapPin size={11} className="shrink-0" />
              <span className="font-sans text-[10.5px]">
                {locationText}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} className="shrink-0 text-accent" />
              <span className="text-foreground/90 font-bold">
                {report.verifiedCount || 0} apoyos
              </span>
            </span>
            <span className="flex items-center gap-1">
              <UserCircle size={11} className={`shrink-0 ${report.userDisplayName ? 'text-emerald-400' : 'text-muted/50'}`} />
              <span className={report.userDisplayName ? 'text-emerald-400 font-bold' : 'text-muted/60 italic'}>
                {report.userDisplayName || 'Anónimo'}
              </span>
            </span>
            {hasPhotos && (
              <span className="text-[9px] bg-accent/10 border border-accent/20 text-accent font-bold px-1.5 py-0.1 rounded">
                Con Foto
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
        {report.deletedAt ? (
          <AdminTooltipButton label="Restaurar reporte" disabled={isOpLoading}>
            <button
              onClick={() => restoreReport(report.id)}
              disabled={isOpLoading}
              className="h-8 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10.5px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              aria-label="Restaurar reporte"
            >
              {isOpLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCcw size={12} />
              )}
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
                  className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Resolver incidente"
                >
                  {isOpLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
              </AdminTooltipButton>
            )}

            {report.status === 'ACTIVE' && (
              <AdminTooltipButton label="Marcar como duplicado" disabled={isOpLoading}>
                <button
                  onClick={() => updateReportStatus(report.id, 'DUPLICATE')}
                  disabled={isOpLoading}
                  className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Marcar como duplicado"
                >
                  {isOpLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </AdminTooltipButton>
            )}

            {report.status !== 'ACTIVE' && (
              <AdminTooltipButton label="Reabrir reporte" disabled={isOpLoading}>
                <button
                  onClick={() => updateReportStatus(report.id, 'ACTIVE')}
                  disabled={isOpLoading}
                  className="btn h-8 px-2 bg-surface-2 border border-border hover:bg-surface-3 text-foreground text-[10.5px] font-bold flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Reabrir reporte"
                >
                  {isOpLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <span>Reabrir</span>
                  )}
                </button>
              </AdminTooltipButton>
            )}

            <AdminTooltipButton label="Archivar reporte" disabled={isOpLoading}>
              <button
                onClick={() => archiveReport(report.id)}
                disabled={isOpLoading}
                className="w-8 h-8 rounded-lg bg-slate-500/10 border border-slate-500/20 hover:bg-slate-500/20 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Archivar reporte"
              >
                {isOpLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Archive size={13} />
                )}
              </button>
            </AdminTooltipButton>
          </>
        )}
      </div>
    </div>
  );
}
