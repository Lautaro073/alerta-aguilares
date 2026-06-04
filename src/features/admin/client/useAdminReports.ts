'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { Report } from '@/types/report';

type ReportStatus = 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';

interface UseAdminReportsOptions {
  user: User | null;
  isAdmin: boolean;
}

export function useAdminReports({ user, isAdmin }: UseAdminReportsOptions) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAdminReports();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchAdminReports]);

  const updateReportStatus = async (reportId: string, status: ReportStatus) => {
    if (!user) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      const token = await user.getIdToken();

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || 'Error al actualizar el estado del reporte.');
      }

      await fetchAdminReports();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Ocurrio un error al moderar el reporte.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      'Estas completamente seguro de eliminar este reporte de forma permanente? Esta accion borrara la evidencia y no se puede deshacer.'
    );
    if (!confirmDelete) return;

    try {
      setActionLoading((prev) => ({ ...prev, [reportId]: true }));
      const token = await user.getIdToken();

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || 'Error al eliminar el reporte.');
      }

      await fetchAdminReports();
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      alert('Ocurrio un error al eliminar el reporte.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  return {
    reports,
    loadingReports,
    actionLoading,
    updateReportStatus,
    deleteReport,
  };
}
