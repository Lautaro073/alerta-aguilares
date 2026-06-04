'use client';

import { useState } from 'react';
import { User } from 'firebase/auth';
import { CategoryId } from '@/lib/constants/categories';
import { getAppCheckToken } from '@/lib/firebase/appCheckClient';
import { getVisitorId } from '@/lib/utils/fingerprint';

interface CreateReportDraft {
  lat: number;
  lng: number;
  category: CategoryId;
  title: string;
  description: string;
  images: string[];
}

export function useCreateReport(user: User | null) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const createReport = async (draft: CreateReportDraft) => {
    setApiError(null);
    setIsSubmitting(true);

    try {
      const visitorId = await getVisitorId();
      let authToken: string | null = null;

      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch {
          console.warn('[useCreateReport] No se pudo obtener el token del usuario.');
        }
      }

      const appCheckToken = await getAppCheckToken();
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          lat: draft.lat,
          lng: draft.lng,
          category: draft.category,
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          images: draft.images,
          fingerprintVisitorId: visitorId,
        }),
      });

      const result = await response.json().catch(() => ({})) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ocurrio un error inesperado al enviar el reporte.');
      }
    } catch (err: unknown) {
      console.error('[useCreateReport] Error de envio:', err);
      const errorMessage = err instanceof Error
        ? err.message
        : 'No se pudo conectar con el servidor. Reintenta en unos momentos.';
      setApiError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createReport,
    isSubmitting,
    apiError,
    clearApiError: () => setApiError(null),
  };
}
