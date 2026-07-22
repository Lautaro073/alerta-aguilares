'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Tags } from 'lucide-react';
import { CATEGORIES, CATEGORY_IDS, type CategoryId } from '@/lib/constants/categories';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminReports } from '../hooks/useAdminReports';
import type { AdminCategoryStat } from '../types/admin.types';
import type { ReportsViewProps } from '../types/adminDashboard.types';
import { CategoryLabel, PageTitle, SideCard, Timeline } from '../components/AdminDashboardParts';

const AdminHeatMap = dynamic(
  () => import('../components/AdminHeatMap').then((module) => module.AdminHeatMap),
  { ssr: false }
);

type RangePreset = 'week' | 'month' | 'year' | 'custom';

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return copy;
}

function getRange(preset: RangePreset) {
  const now = new Date();
  if (preset === 'week') return { from: toInputDate(startOfWeek(now)), to: toInputDate(now) };
  if (preset === 'year') return { from: `${now.getFullYear()}-01-01`, to: toInputDate(now) };
  return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: toInputDate(now) };
}

function formatRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${formatter.format(parseInputDate(from))} - ${formatter.format(parseInputDate(to))}`;
}

function formatShortRange(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  return `${formatter.format(parseInputDate(from))} - ${formatter.format(parseInputDate(to))}`;
}

function parseInputDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year || 0, (month || 1) - 1, day || 1);
}

function getNeighborhood(locationLabel?: string | null) {
  const match = locationLabel?.match(/Barrio\s+([^,]+)/i);
  return match?.[1]?.trim() || 'Sin barrio';
}

function formatResolutionTime(hours: number | null | undefined) {
  if (hours == null) return 'Sin datos';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 24) return `${Math.round(hours * 10) / 10} h`;
  return `${Math.round((hours / 24) * 10) / 10} dias`;
}

function formatResolvedReports(count: number) {
  return `${count} ${count === 1 ? 'resuelta' : 'resueltas'}`;
}

export function StatsView({ user, isAdmin }: ReportsViewProps) {
  const initialRange = getRange('month');
  const [rangePreset, setRangePreset] = useState<RangePreset>('month');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [category, setCategory] = useState('ALL');

  const { reports, summary, loadingReports } = useAdminReports({
    user,
    isAdmin,
    pageSize: 1000,
    currentPage: 1,
    filters: { search: '', status: 'ALL', category, timeframe: 'all', from, to },
  });
  const categoryStats = summary.categoryStats || [];
  const maxCategoryTotal = Math.max(1, ...categoryStats.map((item) => item.total));

  const heatPoints = useMemo(() => {
    const maxReports = Math.max(1, ...reports.map((report) => report.verifiedCount || 1));
    return reports.map((report) => {
      const weight = (report.verifiedCount || 1) / maxReports;
      return {
        lat: report.lat,
        lng: report.lng,
        weight: Math.min(1, Math.max(0.12, weight)),
      };
    });
  }, [reports]);

  const neighborhoodRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of reports) {
      const neighborhood = getNeighborhood(report.locationLabel);
      counts.set(neighborhood, (counts.get(neighborhood) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => `${name} - ${count} alertas`);
  }, [reports]);

  const setPreset = (preset: RangePreset) => {
    setRangePreset(preset);
    if (preset === 'custom') return;
    const nextRange = getRange(preset);
    setFrom(nextRange.from);
    setTo(nextRange.to);
  };

  return (
    <>
      <PageTitle
        title="Estadisticas de Gestion"
        description="Indicadores reales de alertas municipales."
        action={(
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button type="button" className="admin-date-filter-button">
                    <CalendarDays size={16} />
                    <span className="sm:hidden">{formatShortRange(from, to)}</span>
                    <span className="hidden sm:inline">{formatRange(from, to)}</span>
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Cambiar rango de fechas</TooltipContent>
            </Tooltip>
            <PopoverContent className="admin-date-popover" align="end">
              <div className="admin-date-presets">
                <button type="button" className={rangePreset === 'week' ? 'active' : ''} onClick={() => setPreset('week')}>Semana</button>
                <button type="button" className={rangePreset === 'month' ? 'active' : ''} onClick={() => setPreset('month')}>Mes</button>
                <button type="button" className={rangePreset === 'year' ? 'active' : ''} onClick={() => setPreset('year')}>Año</button>
              </div>
              <label>Desde<input type="date" value={from} onChange={(event) => { setRangePreset('custom'); setFrom(event.target.value); }} /></label>
              <label>Hasta<input type="date" value={to} onChange={(event) => { setRangePreset('custom'); setTo(event.target.value); }} /></label>
            </PopoverContent>
          </Popover>
        )}
      />
      <SideCard title="Tiempo de resolucion" className="admin-resolution-card admin-resolution-card-wide">
        <div className="admin-resolution-summary">
          <div className="admin-resolution-highlight">
            <span className="admin-resolution-summary-icon"><Clock3 size={22} /></span>
            <div>
              <small>Promedio</small>
              <strong>{loadingReports ? '...' : formatResolutionTime(summary.avgResolutionHours)}</strong>
            </div>
          </div>
          <div className="admin-resolution-detail">
            <CheckCircle2 size={19} />
            <div><small>En rango seleccionado</small><strong>{loadingReports ? '...' : formatResolvedReports(summary.resolvedReports)}</strong></div>
          </div>
          <div className="admin-resolution-detail">
            <Tags size={19} />
            <div><small>Categoria</small><strong>{category === 'ALL' ? 'Todas' : CATEGORIES[category as CategoryId]?.label || category}</strong></div>
          </div>
          <div className="admin-resolution-detail">
            <CalendarDays size={19} />
            <div><small>Periodo</small><strong>{formatRange(from, to)}</strong></div>
          </div>
        </div>
      </SideCard>
      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-alerts admin-stats-wide">
          <div className="admin-page-header">
            <div>
              <h2>Mapa de calor</h2>
              <p>Alertas registradas en el rango seleccionado.</p>
            </div>
            <div className="admin-filters compact">
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="ALL">Todas las categorias</option>
                {CATEGORY_IDS.map((categoryId) => (
                  <option key={categoryId} value={categoryId}>{CATEGORIES[categoryId].label}</option>
                ))}
              </select>
            </div>
          </div>
          <AdminHeatMap points={heatPoints} />
        </section>
        <aside className="admin-side-stack admin-stats-side-stack">
          <SideCard title="Alertas por Categoria" className="admin-stats-category-card">
            <div className="admin-category-chart compact">
              {categoryStats.length === 0 ? <p className="admin-empty-side">Sin datos en este rango.</p> : categoryStats.map((stat) => {
                const categoryItem = CATEGORIES[stat.category as CategoryId];
                return (
                  <div key={stat.category}>
                    <p><span>{categoryItem?.label || stat.category}</span><strong>{stat.resolved}/{stat.total}</strong></p>
                    <div><span style={{ width: `${(stat.total / maxCategoryTotal) * 100}%`, backgroundColor: categoryItem?.color || '#075985' }} /></div>
                  </div>
                );
              })}
            </div>
          </SideCard>
          <SideCard title="Ranking de barrios" className="admin-neighborhood-card">
            <Timeline rows={neighborhoodRows.length ? neighborhoodRows : ['Sin datos en este rango']} />
          </SideCard>
        </aside>
      </div>
      <section className="admin-panel admin-full admin-stats-table">
        <div className="admin-panel-header"><h2>Resumen por categoria</h2></div>
        <SummaryTable stats={categoryStats} />
      </section>
    </>
  );
}

function SummaryTable({ stats }: { stats: AdminCategoryStat[] }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Categoria</th><th>Total</th><th>Activas</th><th>Resueltas</th><th>Tasa</th></tr></thead>
        <tbody>
          {stats.map((stat) => {
            const category = CATEGORIES[stat.category as CategoryId];
            const rate = stat.total > 0 ? Math.round((stat.resolved / stat.total) * 100) : 0;
            return (
              <tr key={stat.category}>
                <td><CategoryLabel label={category?.label || stat.category} color={category?.color} iconName={category?.iconName} /></td>
                <td className="bold">{stat.total}</td>
                <td>{stat.total - stat.resolved}</td>
                <td>{stat.resolved}</td>
                <td>{rate}%</td>
              </tr>
            );
          })}
          {stats.length === 0 ? <tr><td className="admin-empty-cell" colSpan={5}>Sin datos para mostrar</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
