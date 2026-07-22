'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, History } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/lib/constants/categories';
import { CategoryLabel, PriorityBars } from './AdminDashboardParts';
import {
  formatRecentDate,
  formatReportAreaEventValue,
  formatReportEventValue,
  getReportPriority,
  getReportAreaLabel,
  getReportStatusLabel,
  getReportStatusTone,
} from './adminReportDisplay';
import type { AdminReportActionHandlers, AdminReportListItem } from '../types/admin.types';
import type { AdminReportsResponse, ReportHistoryData, ReportHistoryEvent } from '../types/adminDashboard.types';

export function getReportEventLabel(event: ReportHistoryEvent) {
  if (event.type === 'created') return 'Alerta registrada';
  if (event.type === 'area_changed') return `Derivada a ${formatReportAreaEventValue(event.metadata.to)}`;
  if (event.type === 'hidden') return 'Alerta ocultada';
  if (event.type === 'restored') return 'Alerta restaurada';
  if (event.type === 'duplicate_marked') return 'Marcada como duplicada';
  if (event.type === 'owner_feedback') {
    return event.metadata.resolved
      ? 'El creador confirmo que fue solucionada'
      : 'El creador indico que el problema continua';
  }
  return `Cambio de estado: ${formatReportEventValue(event.metadata.from)} a ${formatReportEventValue(event.metadata.to)}`;
}

export function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

type ReportHistorySheetProps = {
  report: AdminReportListItem;
  loading: boolean;
  updateReportStatus: AdminReportActionHandlers['updateReportStatus'];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerDisabled?: boolean;
};

export function ReportHistorySheet({
  report,
  loading,
  updateReportStatus,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  triggerLabel = 'Ver detalle',
  triggerIcon = <History size={15} />,
  triggerDisabled = false,
}: ReportHistorySheetProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [data, setData] = useState<ReportHistoryData | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<AdminReportListItem[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSearched, setManualSearched] = useState(false);

  const loadHistory = useCallback(async (cancelled?: () => boolean) => {
    if (!user) return;
    await user.getIdToken()
      .then((token) => fetch(`/api/reports/${report.id}/events`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }))
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { data?: ReportHistoryData; error?: string };
        if (!response.ok) throw new Error(result.error || 'No se pudo cargar el historial.');
        if (!cancelled?.()) setData(result.data || { events: [], related: [] });
      })
      .catch((error) => {
        console.error('Error al cargar historial:', error);
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar el historial.');
      });
  }, [report.id, user]);

  useEffect(() => {
    if (!open || !user) return;

    let cancelled = false;
    void loadHistory(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [loadHistory, open, user]);

  const searchDuplicateParent = async () => {
    const query = manualQuery.trim();
    if (!query || !user) return;

    setManualLoading(true);
    setManualSearched(false);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        search: query,
        status: 'ALL',
        category: 'ALL',
        timeframe: 'all',
        sort: 'recent',
        offset: '0',
        limit: '8',
      });
      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({})) as AdminReportsResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudieron buscar alertas.');
      setManualResults((result.data || []).filter((candidate) => candidate.id !== report.id && !candidate.deletedAt));
      setManualSearched(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron buscar alertas.');
    } finally {
      setManualLoading(false);
    }
  };

  const linkDuplicate = async (duplicateOfReportId: string) => {
    await updateReportStatus(report.id, 'DUPLICATE', duplicateOfReportId);
    await loadHistory();
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (controlledOpen === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
      if (nextOpen) {
        setData(null);
        document.querySelectorAll<HTMLDetailsElement>('.admin-actions-menu[open]').forEach((menu) => {
          menu.open = false;
        });
      }
    }}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <button type="button" disabled={triggerDisabled}>{triggerIcon} {triggerLabel}</button>
        </SheetTrigger>
      )}
      <SheetContent className="admin-alert-detail-sheet">
        <SheetHeader className="admin-alert-detail-head">
          <SheetTitle>Detalle de alerta</SheetTitle>
        </SheetHeader>
        <div className="admin-alert-detail-content">
          <section className="admin-alert-detail-summary">
            <div>
              <div className="admin-alert-detail-kicker">
                <CategoryLabel
                  label={CATEGORIES[report.category]?.label || report.category}
                  color={CATEGORIES[report.category]?.color}
                  iconName={CATEGORIES[report.category]?.iconName}
                />
                <span className={`admin-status ${getReportStatusTone(report.status)}`}>{getReportStatusLabel(report.status)}</span>
              </div>
              <h3>{report.title}</h3>
              <p>{report.locationLabel || 'Direccion no disponible'}</p>
            </div>
          </section>

          <section className="admin-alert-detail-grid">
            <div><span>Reportes</span><strong>{report.verifiedCount || 0}</strong></div>
            <div><span>Prioridad</span><PriorityBars tone={getReportPriority(report.priority, report.category).tone} count={getReportPriority(report.priority, report.category).count} /></div>
            <div><span>Area</span><strong>{getReportAreaLabel(report.assignedArea)}</strong></div>
            <div><span>Creada</span><strong>{formatRecentDate(report.createdAt)}</strong></div>
          </section>

          <section>
            <div className="admin-alert-detail-section-title admin-duplicate-title">
              <div>
                <h3>Vincular duplicado</h3>
                <p>Elegi una sugerida o busca la alerta principal manualmente.</p>
              </div>
              <span>40 m / 30 dias</span>
            </div>
            <div className="admin-duplicate-box">
              <form className="admin-duplicate-search" onSubmit={(event) => {
                event.preventDefault();
                void searchDuplicateParent();
              }}>
                <Search size={15} />
                <input
                  value={manualQuery}
                  onChange={(event) => setManualQuery(event.target.value)}
                  placeholder="Buscar por titulo, direccion o folio..."
                />
                <button type="submit" disabled={manualLoading || manualQuery.trim().length < 2}>
                  {manualLoading ? 'Buscando' : 'Buscar'}
                </button>
              </form>

              <div className="admin-duplicate-subhead">
                <strong>Sugeridas por cercania</strong>
                <span>{data?.related.length || 0} coincidencias</span>
              </div>
              {!data ? (
                <div className="admin-duplicate-empty">
                  <strong>Buscando sugerencias</strong>
                  <span>Estamos revisando alertas cercanas de la misma categoria.</span>
                </div>
              ) : data.related.length === 0 ? (
                <div className="admin-duplicate-empty">
                  <strong>Sin sugerencias automaticas</strong>
                  <span>No hay alertas cercanas de la misma categoria. Usa la busqueda manual si conoces la alerta principal.</span>
                </div>
              ) : (
                <div className="admin-duplicate-list">
                  {data.related.map((related) => (
                    <article className="admin-duplicate-row" key={related.id}>
                      <div>
                        <strong>{related.title}</strong>
                        <span>{related.locationLabel || 'Direccion no disponible'}</span>
                        <small>{related.distanceMeters} m - {formatRecentDate(related.createdAt)}</small>
                      </div>
                      <button type="button" disabled={loading || report.status === 'DUPLICATE'} onClick={() => void linkDuplicate(related.id)}>
                        Vincular
                      </button>
                    </article>
                  ))}
                </div>
              )}
              {manualResults.length > 0 && (
                <>
                  <div className="admin-duplicate-subhead">
                    <strong>Busqueda manual</strong>
                    <span>{manualResults.length} alertas</span>
                  </div>
                  <div className="admin-duplicate-list">
                    {manualResults.map((candidate) => (
                      <article className="admin-duplicate-row" key={candidate.id}>
                        <div>
                          <strong>{candidate.title}</strong>
                          <span>{candidate.locationLabel || 'Direccion no disponible'}</span>
                          <small>{getReportStatusLabel(candidate.status)} - {formatRecentDate(candidate.createdAt)}</small>
                        </div>
                        <button type="button" disabled={loading || report.status === 'DUPLICATE'} onClick={() => void linkDuplicate(candidate.id)}>
                          Vincular
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )}
              {manualSearched && manualResults.length === 0 && (
                <>
                  <div className="admin-duplicate-subhead">
                    <strong>Busqueda manual</strong>
                    <span>0 alertas</span>
                  </div>
                  <div className="admin-duplicate-empty">
                    <strong>Sin resultados manuales</strong>
                    <span>No encontramos alertas con esos datos. Proba con menos palabras o solo calle/numero.</span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <div className="admin-alert-detail-section-title">
              <h3>Historial</h3>
              <span>{data?.events.length || 0} eventos</span>
            </div>
            {!data ? (
              <p className="admin-history-empty">Cargando historial...</p>
            ) : data.events.length === 0 ? (
              <p className="admin-history-empty">Sin eventos registrados.</p>
            ) : (
              <div className="admin-history-list">
                {data.events.map((event) => (
                  <article key={event.id}>
                    <strong>{getReportEventLabel(event)}</strong>
                    <small><span>{event.actorName || 'Sistema'}</span><time>{formatHistoryDate(event.createdAt)}</time></small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
