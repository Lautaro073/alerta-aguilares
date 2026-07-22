'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { AuthUser } from '@/hooks/useAuth';
import { Report, ReportAssignedArea, ReportStatus } from '@/types/report';
import { EMPTY_ADMIN_SUMMARY } from '../constants/admin.constants';
import type { AdminReportFilters, AdminReportSummary } from '../types/admin.types';

type AdminReportSort = 'recent' | 'priority';

type CachedAdminReports = {
  timestamp: number;
  result: AdminReportsResponse;
};

interface AdminReportsResponse {
  data?: Report[];
  count?: number;
  summary?: AdminReportSummary;
}

interface UseAdminReportsOptions {
  user: AuthUser | null;
  isAdmin: boolean;
  pageSize: number;
  currentPage: number;
  filters: AdminReportFilters;
  sort?: AdminReportSort;
}

const ADMIN_REPORTS_CACHE_MS = 10_000;
const adminReportsCache = new Map<string, CachedAdminReports>();
const adminReportsRequests = new Map<string, Promise<AdminReportsResponse>>();

function getPageOffset(page: number, pageSize: number) {
  return Math.max(0, (page - 1) * pageSize);
}

function buildAdminReportsUrl(filters: AdminReportFilters, offset: number, limit: number, sort: AdminReportSort) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    status: filters.status,
    category: filters.category,
    timeframe: filters.timeframe,
    sort,
  });

  const search = filters.search.trim();
  if (search) {
    params.set('search', search);
  }

  return `/api/admin/reports?${params.toString()}`;
}

async function fetchAdminReportsUrl(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(result.error || 'No se pudieron cargar los reportes.');
  }

  return response.json() as Promise<AdminReportsResponse>;
}

function getStatusToastLabel(status: ReportStatus) {
  if (status === 'PENDING') return 'pendiente';
  if (status === 'VERIFYING') return 'en verificacion';
  if (status === 'IN_PROGRESS') return 'en proceso';
  if (status === 'RESOLVED') return 'resuelta';
  if (status === 'DISMISSED') return 'desestimada';
  return 'duplicada';
}

function getAreaToastLabel(area: ReportAssignedArea | null) {
  if (area === 'traffic') return 'Transito';
  if (area === 'public_works') return 'Obras Publicas';
  if (area === 'lighting') return 'Alumbrado';
  if (area === 'environment') return 'Ambiente';
  return 'Sin derivar';
}

export function useAdminReports({
  user,
  isAdmin,
  pageSize,
  currentPage,
  filters,
  sort = 'recent',
}: UseAdminReportsOptions) {
  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState<AdminReportSummary>(EMPTY_ADMIN_SUMMARY);
  const [loadingReports, setLoadingReports] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const requestVersionRef = useRef(0);
  const { search, status, category, timeframe } = filters;

  const fetchAdminReports = useCallback(async () => {
    if (!user || !isAdmin) {
      setLoadingReports(false);
      return;
    }

    const version = requestVersionRef.current + 1;
    requestVersionRef.current = version;
    setLoadingReports(true);

    try {
      const token = await user.getIdToken();
      const url = buildAdminReportsUrl({ search, status, category, timeframe }, getPageOffset(currentPage, pageSize), pageSize, sort);
      const urlWithDates = new URL(url, window.location.origin);
      if (filters.from) urlWithDates.searchParams.set('from', filters.from);
      if (filters.to) urlWithDates.searchParams.set('to', filters.to);
      const finalUrl = `${urlWithDates.pathname}?${urlWithDates.searchParams.toString()}`;
      const cached = adminReportsCache.get(finalUrl);

      if (cached && Date.now() - cached.timestamp < ADMIN_REPORTS_CACHE_MS) {
        setReports(cached.result.data || []);
        setTotalCount(cached.result.count || 0);
        setSummary(cached.result.summary || EMPTY_ADMIN_SUMMARY);
        return;
      }

      const request = adminReportsRequests.get(finalUrl) || fetchAdminReportsUrl(finalUrl, token).finally(() => {
        adminReportsRequests.delete(finalUrl);
      });
      adminReportsRequests.set(finalUrl, request);

      const result = await request;
      if (requestVersionRef.current !== version) return;

      adminReportsCache.set(finalUrl, { timestamp: Date.now(), result });
      setReports(result.data || []);
      setTotalCount(result.count || 0);
      setSummary(result.summary || EMPTY_ADMIN_SUMMARY);
    } catch (err) {
      console.error('Error al cargar reportes de administracion:', err);
    } finally {
      if (requestVersionRef.current === version) {
        setLoadingReports(false);
      }
    }
  }, [category, currentPage, filters.from, filters.to, isAdmin, pageSize, search, sort, status, timeframe, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAdminReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchAdminReports]);

  const refreshAdminReports = useCallback(async () => {
    adminReportsCache.clear();
    await fetchAdminReports();
  }, [fetchAdminReports]);

  const updateReportStatus = async (reportId: string, status: ReportStatus, duplicateOfReportId?: string | null) => {
    if (!user) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      await toast.promise((async () => {
        const token = await user.getIdToken();
        const response = await fetch(`/api/reports/${reportId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, duplicateOfReportId }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || 'Error al actualizar el estado del reporte.');
        }

        await refreshAdminReports();
      })(), {
        loading: 'Actualizando alerta...',
        success: `Alerta marcada como ${getStatusToastLabel(status)}.`,
        error: (error) => error instanceof Error ? error.message : 'Ocurrio un error al moderar el reporte.',
      });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const updateReportArea = async (reportId: string, assignedArea: ReportAssignedArea | null) => {
    if (!user) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      await toast.promise((async () => {
        const token = await user.getIdToken();

        const response = await fetch(`/api/reports/${reportId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assignedArea }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || 'Error al derivar el reporte.');
        }

        adminReportsCache.clear();
        setReports((current) => current.map((report) => (
          report.id === reportId ? { ...report, assignedArea, updatedAt: new Date().toISOString() } : report
        )));
      })(), {
        loading: 'Actualizando derivacion...',
        success: `Alerta derivada a ${getAreaToastLabel(assignedArea)}.`,
        error: (error) => error instanceof Error ? error.message : 'Ocurrio un error al derivar el reporte.',
      });
    } catch (error) {
      console.error('Error al derivar reporte:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const archiveReport = async (reportId: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      'Ocultar este reporte? El vecino no podra verlo en el mapa, pero quedara registrado en el sistema y podra restaurarse en cualquier momento.'
    );
    if (!confirmed) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      await toast.promise((async () => {
        const token = await user.getIdToken();

        const response = await fetch(`/api/reports/${reportId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || 'Error al ocultar el reporte.');
        }

        await refreshAdminReports();
      })(), {
        loading: 'Ocultando alerta...',
        success: 'Alerta oculta.',
        error: (error) => error instanceof Error ? error.message : 'Ocurrio un error al ocultar el reporte.',
      });
    } catch (error) {
      console.error('Error al ocultar reporte:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const restoreReport = async (reportId: string) => {
    if (!user) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      await toast.promise((async () => {
        const token = await user.getIdToken();

        const response = await fetch(`/api/reports/${reportId}/restore`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(result.error || 'Error al restaurar el reporte.');
        }

        await refreshAdminReports();
      })(), {
        loading: 'Restaurando alerta...',
        success: 'Alerta restaurada.',
        error: (error) => error instanceof Error ? error.message : 'Ocurrio un error al restaurar reporte.',
      });
    } catch (error) {
      console.error('Error al restaurar reporte:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  return {
    reports,
    totalCount,
    summary,
    loadingReports,
    loadingPage: false,
    actionLoading,
    updateReportStatus,
    updateReportArea,
    archiveReport,
    restoreReport,
  };
}
