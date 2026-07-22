'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { AdminConfigArea, AdminConfigCategory, AdminConfigResponse } from '../types/adminConfig.types';

export function useAdminConfig() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<AdminConfigArea[]>([]);
  const [categories, setCategories] = useState<AdminConfigCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/config', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({})) as AdminConfigResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || 'No se pudo cargar la configuracion.');
      setAreas(result.data?.areas || []);
      setCategories(result.data?.categories || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar la configuracion.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchConfig();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchConfig]);

  const patchConfig = async (body: Record<string, unknown>) => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(result.error || 'No se pudo guardar la configuracion.');
    await fetchConfig();
  };

  const createConfig = async (body: Record<string, unknown>) => {
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch('/api/admin/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(result.error || 'No se pudo crear el registro.');
    await fetchConfig();
  };

  return { areas, categories, loading, patchConfig, createConfig };
}

