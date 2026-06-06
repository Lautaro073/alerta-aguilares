'use client';

import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/lib/constants/categories';
import CategoryIcon from '@/components/ui/CategoryIcon';
import Link from 'next/link';
import { useAdminReports } from '@/features/admin/client/useAdminReports';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  ShieldAlert,
  ArrowLeft,
  Users,
  Check,
  Copy,
  Archive,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  MapPin,
  Activity,
  CheckCircle,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  Clock,
  UserCircle,
} from 'lucide-react';

type AdminStatusFilter = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'DUPLICATE' | 'DELETED';
type AdminTimeframeFilter = 'all' | '7d' | '30d';
type AdminPageSize = 10 | 25 | 50 | 100;

const PAGE_SIZE_OPTIONS: AdminPageSize[] = [10, 25, 50, 100];
const ADMIN_LIST_HEIGHT_CLASS = 'h-[612px]';

function AdminReportSkeletonRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="min-h-[92px] border border-border/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-1/20 animate-pulse"
          aria-hidden="true"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg shrink-0 border border-border/40 bg-surface-2/60" />
            <div className="flex flex-col min-w-0 flex-1 gap-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-44 max-w-full rounded bg-surface-2/70" />
                <div className="h-4 w-14 rounded-full bg-surface-2/60" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-3 w-24 rounded bg-surface-2/50" />
                <div className="h-3 w-32 rounded bg-surface-2/50" />
                <div className="h-3 w-16 rounded bg-surface-2/50" />
                <div className="h-3 w-20 rounded bg-surface-2/50" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <div className="w-8 h-8 rounded-lg bg-surface-2/60" />
            <div className="w-8 h-8 rounded-lg bg-surface-2/60" />
            <div className="w-8 h-8 rounded-lg bg-surface-2/60" />
          </div>
        </div>
      ))}
    </>
  );
}

function AdminTooltipButton({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? <span className="inline-flex">{children}</span> : children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function AdminDashboard() {
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

  // Pantalla de carga inicial de autenticación
  if (authLoading) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center font-jakarta gap-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-slate-800 border-t-accent animate-spin" />
          <Shield size={24} className="absolute text-accent animate-pulse-slow" />
        </div>
        <p className="text-xs font-bold text-muted tracking-wider uppercase animate-pulse">
          Validando credenciales...
        </p>
      </div>
    );
  }

  // Pantalla de acceso no autorizado
  if (!isAdmin) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center p-6 font-jakarta select-none relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-md w-full glass border border-red-500/25 p-8 rounded-xl shadow-glow shadow-red-500/5 text-center flex flex-col items-center gap-6 animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <ShieldAlert size={28} className="animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="font-outfit font-extrabold text-xl md:text-2xl tracking-tight text-red-200">
              Acceso Restringido
            </h2>
            <p className="text-xs text-muted leading-relaxed max-w-[320px]">
              Esta sección está reservada exclusivamente para moderadores y administradores autorizados de <strong>Alertas Aguilares</strong>.
            </p>
          </div>

          <Link
            href="/"
            className="btn btn-primary w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mt-2 h-10 select-none cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </div>
    );
  }

  // Métricas calculadas
  const totalActivos = summary.activeReports;
  const totalResueltos = summary.resolvedReports;
  const totalValidaciones = reports.reduce((acc, r) => acc + (r.verifiedCount || 0), 0);
  const archivedCount = summary.archivedReports;
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
      
      {/* Encabezado del Panel */}
      <header className="glass-strong border-b border-border py-4 px-4 sm:px-6 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
              <Shield size={18} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-outfit font-extrabold text-base sm:text-lg tracking-tight text-foreground">
                Alertas<span className="gradient-text">Aguilares</span>
              </h1>
              <span className="text-[10px] uppercase font-bold bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded text-yellow-400 tracking-wider">
                Consola
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="btn btn-ghost py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Volver al Mapa</span>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        {/* Sección de Tarjetas de Métricas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          
          <div className="glass px-4 py-4 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl" />
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Reportes Activos</span>
              <span className="font-outfit font-extrabold text-2xl text-foreground mt-0.5">
                {loadingReports ? '...' : totalActivos}
              </span>
            </div>
          </div>

          <div className="glass px-4 py-4 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Incidentes Solucionados</span>
              <span className="font-outfit font-extrabold text-2xl text-foreground mt-0.5">
                {loadingReports ? '...' : totalResueltos}
              </span>
            </div>
          </div>

          <div className="glass px-4 py-4 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Apoyos Visibles</span>
              <span className="font-outfit font-extrabold text-2xl text-foreground mt-0.5">
                {loadingReports || loadingPage ? '...' : totalValidaciones}
              </span>
            </div>
          </div>

          <div className="glass px-4 py-4 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-slate-500/5 rounded-full blur-2xl" />
            <div className="w-10 h-10 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-400">
              <Archive size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Reportes Archivados</span>
              <span className="font-outfit font-extrabold text-2xl text-foreground mt-0.5">
                {loadingReports ? '...' : archivedCount}
              </span>
            </div>
          </div>

        </section>

        {/* Consola de Control y Filtros */}
        <section className="glass border border-border p-4 sm:p-5 flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4 select-none">
            <h2 className="font-outfit font-extrabold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-2">
              <span>Listado de Reportes</span>
              {loadingReports ? (
                <Loader2 size={14} className="animate-spin text-muted" />
              ) : (
                <span className="text-xs bg-surface-2 border border-border px-2 py-0.5 rounded-full text-muted font-mono font-bold">
                  {totalCount}
                </span>
              )}
            </h2>
            
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 md:self-end">
              {/* Buscador */}
              <div className="relative flex items-center min-w-[200px] flex-1 sm:flex-initial">
                <Search size={14} className="absolute left-3 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar reporte..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    resetPagination();
                  }}
                  className="w-full bg-surface-1 border border-border focus:border-accent rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none text-foreground transition-all placeholder:text-muted/40"
                />
              </div>

              {/* Selector de Rango Temporal */}
              <div className="relative flex items-center">
                <Clock size={12} className="absolute left-2.5 text-muted pointer-events-none" />
                <select
                  value={timeframeFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setTimeframeFilter(e.target.value as AdminTimeframeFilter);
                    resetPagination();
                  }}
                  className="bg-surface-1 border border-border rounded-lg py-1.5 pl-8 pr-2 text-xs text-foreground outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="all">Histórico</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                </select>
              </div>

              {/* Selector de Estado */}
              <div className="relative flex items-center">
                <Filter size={12} className="absolute left-2.5 text-muted pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    setStatusFilter(e.target.value as AdminStatusFilter);
                    resetPagination();
                  }}
                  className="bg-surface-1 border border-border rounded-lg py-1.5 pl-8 pr-2 text-xs text-foreground outline-none transition-all cursor-pointer font-bold"
                >
                                <option value="ALL">Todos los Estados</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="RESOLVED">Resueltos</option>
                  <option value="DUPLICATE">Duplicados</option>
                  <option value="DELETED">Archivados{archivedCount > 0 ? ` (${archivedCount})` : ''}</option>
                </select>
              </div>

              {/* Selector de Categoría */}
              <div className="relative flex items-center">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    resetPagination();
                  }}
                  className="bg-surface-1 border border-border rounded-lg py-1.5 px-3 text-xs text-foreground outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="ALL">Todas las Categorías</option>
                  {Object.values(CATEGORIES).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.split(' / ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-8 px-3 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 text-[11px] text-muted hover:text-foreground font-bold transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Listado en Grilla de Tarjetas Moderables (Mobile First Responsivo) */}
          {loadingReports ? (
            <div className={`${ADMIN_LIST_HEIGHT_CLASS} flex flex-col gap-3 overflow-y-hidden pr-1`}>
              <AdminReportSkeletonRows count={pageSize} />
            </div>
          ) : totalCount === 0 ? (
            <div className={`${ADMIN_LIST_HEIGHT_CLASS} text-center select-none flex flex-col items-center justify-center gap-3 border border-dashed border-border/40 rounded-xl`}>
              <AlertTriangle size={32} className="text-muted/40 animate-pulse-slow" />
              <p className="text-sm font-bold text-muted">No se encontraron reportes con los filtros aplicados.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-9 px-4 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 text-xs text-foreground font-bold transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className={`${ADMIN_LIST_HEIGHT_CLASS} visible-scrollbar flex flex-col gap-3 overflow-y-auto pr-2`}>
              {loadingPage && reports.length === 0 ? (
                <AdminReportSkeletonRows count={pageSize} />
              ) : reports.map((report) => {
                const catConfig = CATEGORIES[report.category];
                const catColor = catConfig?.color || '#9CA3AF';
                const hasPhotos = report.images && report.images.length > 0;
                
                const isOpLoading = actionLoading[report.id];

                return (
                  <div
                                      key={report.id}
                    className={`border border-border/40 rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 pointer-events-auto ${
                      report.deletedAt
                        ? 'bg-surface-1/10 opacity-60 hover:opacity-80'
                        : 'bg-surface-1/30 hover:bg-surface-1/50 hover:border-border-strong'
                    }`}
                  >
                    {/* Información del Incidente */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icono de Categoría */}
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
                      
                      {/* Título, Detalles e Info */}
                      <div className="flex flex-col min-w-0">
                                                <div className="flex items-center flex-wrap gap-2">
                          <h3 className={`font-outfit font-extrabold text-sm truncate max-w-[240px] sm:max-w-md ${
                            report.deletedAt ? 'line-through text-muted' : 'text-foreground'
                          }`}>
                            {report.title}
                          </h3>

                          {/* Badges de Estado */}
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
                        
                        {/* Metadatos (Fecha, Ubicación, Apoyos, Autor) */}
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
                            <span>
                              {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={11} className="shrink-0 text-accent" />
                            <span className="text-foreground/90 font-bold">
                              {report.verifiedCount || 0} apoyos
                            </span>
                          </span>
                          {/* Autor del reporte */}
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

                      {/* Acciones de Moderación */}
                     <div className="flex items-center gap-2 self-end md:self-center shrink-0">

                      {/* Acciones para reportes archivados */}
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
                          {/* Botón de Resolver (Solo si no está resuelto) */}
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

                          {/* Botón de Marcar como Duplicado (Solo si está activo) */}
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

                          {/* Botón de Reactivar (Si está resuelto o duplicado) */}
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

                          {/* Botón de Archivar */}
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
              })}
              {loadingPage && reports.length > 0 && reports.length < pageSize && (
                <AdminReportSkeletonRows count={pageSize - reports.length} />
              )}
            </div>
          )}

          {!loadingReports && totalCount > 0 && (
            <div className="relative overflow-hidden rounded-lg border border-border/60 bg-surface-1/30 shadow-sm">
              <div className="h-1 w-full bg-surface-2">
                <div
                  className="h-full rounded-r-full bg-accent/35 transition-all"
                  style={{ width: `${Math.max(8, Math.min(100, (safeCurrentPage / pageCount) * 100))}%` }}
                />
              </div>

              <div className="flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-muted">
                  <span>
                    0 de {totalCount} fila(s) seleccionadas
                  </span>
                  <span className="hidden h-3 w-px bg-border sm:inline-block" />
                  <span className="font-mono text-[10px] text-muted/80">
                    {pageStartIndex + 1}-{pageEndIndex} de {totalCount}
                  </span>
                  {hasActiveFilters && (
                    <span className="font-mono text-[10px] text-muted/70">
                      filtradas de {summary.totalReports}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <label className="flex items-center gap-2 text-[11px] font-bold text-muted">
                    <span>Filas por pagina</span>
                    <select
                      value={pageSize}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        setPageSize(Number(e.target.value) as AdminPageSize);
                        resetPagination();
                      }}
                      className="h-8 rounded-lg border border-border bg-surface-2 px-2 text-xs font-bold text-foreground outline-none transition-colors hover:bg-surface-3 cursor-pointer"
                      aria-label="Cantidad de reportes por pagina"
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="min-w-[86px] text-right text-[11px] font-bold text-muted">
                      Pagina {safeCurrentPage} de {pageCount}
                    </span>
                    <div className="flex items-center gap-1">
                      <AdminTooltipButton label="Primera pagina" disabled={!canGoPrevious}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(1)}
                          disabled={!canGoPrevious}
                          className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Primera pagina"
                        >
                          <ChevronsLeft size={14} />
                        </button>
                      </AdminTooltipButton>
                      <AdminTooltipButton label="Pagina anterior" disabled={!canGoPrevious}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={!canGoPrevious}
                          className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Pagina anterior"
                        >
                          <ChevronLeft size={14} />
                        </button>
                      </AdminTooltipButton>
                      <AdminTooltipButton label="Pagina siguiente" disabled={!canGoNext}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                          disabled={!canGoNext}
                          className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Pagina siguiente"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </AdminTooltipButton>
                      <AdminTooltipButton label="Ultima pagina" disabled={!canGoNext}>
                        <button
                          type="button"
                          onClick={() => setCurrentPage(pageCount)}
                          disabled={!canGoNext}
                          className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                          aria-label="Ultima pagina"
                        >
                          <ChevronsRight size={14} />
                        </button>
                      </AdminTooltipButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>

      </main>
      
    </div>
  );
}
