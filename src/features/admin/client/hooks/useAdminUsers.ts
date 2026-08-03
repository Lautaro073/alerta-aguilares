'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AuthUser } from '@/hooks/useAuth';
import type {
  AdminCitizen,
  AdminCitizensResponse,
  AdminCitizensSummary,
  AdminCitizenStatus,
  CitizenActionHandlers,
} from '../types/adminUsers.types';

const EMPTY_SUMMARY: AdminCitizensSummary = {
  total: 0,
  active: 0,
  blocked: 0,
  newThisMonth: 0,
};

export function useAdminUsers({
  user,
  enabled,
  page,
  pageSize,
  searchQuery,
  statusFilter,
  newThisMonthOnly,
}: {
  user: AuthUser | null;
  enabled: boolean;
  page: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: 'ALL' | AdminCitizenStatus;
  newThisMonthOnly: boolean;
}) {
  const [citizens, setCitizens] = useState<AdminCitizen[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<AdminCitizensSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const fetchCitizens = useCallback(async () => {
    if (!user || !enabled) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        offset: String((page - 1) * pageSize),
        limit: String(pageSize),
      });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (newThisMonthOnly) params.set('created', 'this_month');

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({})) as AdminCitizensResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudieron cargar los ciudadanos.');

      setCitizens(result.data || []);
      setTotal(result.count || 0);
      setSummary(result.summary || EMPTY_SUMMARY);
    } catch (error) {
      console.error('Error al cargar ciudadanos:', error);
      setCitizens([]);
      setTotal(0);
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los ciudadanos.');
    } finally {
      setLoading(false);
    }
  }, [enabled, newThisMonthOnly, page, pageSize, searchQuery, statusFilter, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCitizens();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchCitizens]);

  const setCitizenStatus = useCallback((citizen: AdminCitizen, status: AdminCitizenStatus) => {
    const blocking = status === 'blocked';
    const actionLabel = blocking ? 'Bloquear' : 'Reactivar';

    toast(`${actionLabel} ciudadano?`, {
      description: citizen.displayName || citizen.email || 'Cuenta ciudadana',
      action: {
        label: actionLabel,
        onClick: () => {
          const request = async () => {
            if (!user) throw new Error('La sesion expiro.');
            const token = await user.getIdToken();
            const response = await fetch(`/api/admin/users/${citizen.uid}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status }),
            });
            const result = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(result.error || 'No se pudo cambiar el estado.');
            await fetchCitizens();
          };

          void toast.promise(request(), {
            loading: blocking ? 'Bloqueando ciudadano...' : 'Reactivando ciudadano...',
            success: blocking ? 'Ciudadano bloqueado.' : 'Ciudadano reactivado.',
            error: (error) => error instanceof Error ? error.message : 'No se pudo cambiar el estado.',
          });
        },
      },
    });
  }, [fetchCitizens, user]);

  const actions: CitizenActionHandlers = { setCitizenStatus };
  return { citizens, total, summary, loading, actions };
}
