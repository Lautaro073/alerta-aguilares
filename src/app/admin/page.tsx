'use client';

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Report } from '@/types/report';
import { CATEGORIES } from '@/lib/constants/categories';
import CategoryIcon from '@/components/ui/CategoryIcon';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  ArrowLeft,
  Users,
  Check,
  Copy,
  Trash2,
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

type AdminStatusFilter = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';
type AdminTimeframeFilter = 'all' | '7d' | '30d';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<AdminTimeframeFilter>('all');
  
  // Estados de carga para las acciones individuales de moderación
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchAdminReports = useCallback(async () => {
    if (!user || !isAdmin) return;

    try {
      const token = await user.getIdToken();
      setLoadingReports(true);
      const response = await fetch('/api/admin/reports', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || 'No se pudieron cargar los reportes.');
      }

      const result = await response.json() as { data?: Report[] };
      setReports(result.data || []);
    } catch (err) {
      console.error('Error al cargar reportes de administracion:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [user, isAdmin]);

  // Cargar reportes via API admin para mantener Firestore cerrado al cliente.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAdminReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchAdminReports]);

  // Manejar el cambio de estado del reporte
  const handleUpdateStatus = async (reportId: string, newStatus: 'RESOLVED' | 'DUPLICATE' | 'ACTIVE') => {
    if (!user) return;
    
    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar el estado del reporte.');
      }
      await fetchAdminReports();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Ocurrió un error al moderar el reporte.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  // Manejar la eliminación permanente del reporte
  const handleDeleteReport = async (reportId: string) => {
    if (!user) return;
    
    const confirmDelete = window.confirm(
      '⚠️ ¿Estás completamente seguro de eliminar este reporte de forma permanente? Esta acción borrará la evidencia y no se puede deshacer.'
    );
    if (!confirmDelete) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      const token = await user.getIdToken();

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar el reporte.');
      }
      await fetchAdminReports();
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      alert('Ocurrió un error al eliminar el reporte.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

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
  const totalActivos = reports.filter((r) => r.status === 'ACTIVE').length;
  const totalResueltos = reports.filter((r) => r.status === 'RESOLVED').length;
  const totalValidaciones = reports.reduce((acc, r) => acc + (r.verifiedCount || 0), 0);

  // Filtrar los reportes en el cliente
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.description && report.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || report.category === categoryFilter;

    // Filtro temporal local
    const now = new Date();
    const thresholdDate =
      timeframeFilter === '7d'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : timeframeFilter === '30d'
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : null;

    const matchesTimeframe =
      !thresholdDate || new Date(report.createdAt) >= thresholdDate;

    return matchesSearch && matchesStatus && matchesCategory && matchesTimeframe;
  });

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
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
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
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Validaciones Vecinales</span>
              <span className="font-outfit font-extrabold text-2xl text-foreground mt-0.5">
                {loadingReports ? '...' : totalValidaciones}
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
                  {filteredReports.length}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-1 border border-border focus:border-accent rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none text-foreground transition-all placeholder:text-muted/40"
                />
              </div>

              {/* Selector de Rango Temporal */}
              <div className="relative flex items-center">
                <Clock size={12} className="absolute left-2.5 text-muted pointer-events-none" />
                <select
                  value={timeframeFilter}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setTimeframeFilter(e.target.value as AdminTimeframeFilter)}
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
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as AdminStatusFilter)}
                  className="bg-surface-1 border border-border rounded-lg py-1.5 pl-8 pr-2 text-xs text-foreground outline-none transition-all cursor-pointer font-bold"
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="RESOLVED">Resueltos</option>
                  <option value="DUPLICATE">Duplicados</option>
                </select>
              </div>

              {/* Selector de Categoría */}
              <div className="relative flex items-center">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
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
            </div>
          </div>

          {/* Listado en Grilla de Tarjetas Moderables (Mobile First Responsivo) */}
          {loadingReports ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 select-none text-muted">
              <Loader2 size={24} className="animate-spin text-accent" />
              <span className="text-[11px] font-bold tracking-wider uppercase">Cargando incidencias...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-16 text-center select-none flex flex-col items-center gap-3 border border-dashed border-border/40 rounded-xl">
              <AlertTriangle size={32} className="text-muted/40 animate-pulse-slow" />
              <p className="text-sm font-bold text-muted">No se encontraron reportes con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1 no-scrollbar">
              {filteredReports.map((report) => {
                const catConfig = CATEGORIES[report.category];
                const catColor = catConfig?.color || '#9CA3AF';
                const hasPhotos = report.images && report.images.length > 0;
                
                const isOpLoading = actionLoading[report.id];

                return (
                  <div
                    key={report.id}
                    className="bg-surface-1/30 hover:bg-surface-1/50 border border-border/40 hover:border-border-strong rounded-xl p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 pointer-events-auto"
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
                          <h3 className="font-outfit font-extrabold text-sm text-foreground truncate max-w-[240px] sm:max-w-md">
                            {report.title}
                          </h3>
                          
                          {/* Badge de Estado */}
                          {report.status === 'ACTIVE' && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                              Activo
                            </span>
                          )}
                          {report.status === 'RESOLVED' && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              Resuelto
                            </span>
                          )}
                          {report.status === 'DUPLICATE' && (
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
                      
                      {/* Botón de Resolver (Solo si no está resuelto) */}
                      {report.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                          disabled={isOpLoading}
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                          title="Resolver Incidente"
                        >
                          {isOpLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                        </button>
                      )}

                      {/* Botón de Marcar como Duplicado (Solo si no está duplicado ni resuelto) */}
                      {report.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'DUPLICATE')}
                          disabled={isOpLoading}
                          className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-all cursor-pointer"
                          title="Marcar como Duplicado"
                        >
                          {isOpLoading ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}

                      {/* Botón de Reactivar (Si está resuelto o duplicado) */}
                      {report.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'ACTIVE')}
                          disabled={isOpLoading}
                          className="btn h-8 px-2 bg-surface-2 border border-border hover:bg-surface-3 text-foreground text-[10.5px] font-bold flex items-center justify-center transition-all cursor-pointer"
                          title="Reabrir Reporte"
                        >
                          {isOpLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <span>Reabrir</span>
                          )}
                        </button>
                      )}

                      {/* Botón de Eliminar Permanentemente */}
                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={isOpLoading}
                        className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all cursor-pointer"
                        title="Eliminar Permanentemente"
                      >
                        {isOpLoading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </section>

      </main>
      
    </div>
  );
}
