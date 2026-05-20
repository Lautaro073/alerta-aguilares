'use client';

import { useState, useEffect, useRef } from 'react';
import { CategoryId } from '@/lib/constants/categories';
import { Report } from '@/types/report';

interface UseRealtimeReportsOptions {
  categories?: CategoryId[];
  view?: 'markers' | 'heatmap';
}

type HeatmapPoint = { lat: number; lng: number };

interface StreamPayload {
  count: number;
  data: Report[] | HeatmapPoint[];
}

/**
 * Hook de tiempo real basado en Server-Sent Events.
 *
 * Abre una conexión SSE con /api/reports/stream y escucha cambios de Firestore
 * en vivo. El servidor usa onSnapshot del Admin SDK y empuja cada actualización
 * al instante. El browser reconecta automáticamente si cae la conexión.
 *
 * Reemplaza el polling de SWR por una arquitectura push genuina.
 */
export function useRealtimeReports({
  categories = [],
  view = 'markers',
}: UseRealtimeReportsOptions = {}) {
  type DataType = typeof view extends 'heatmap' ? HeatmapPoint[] : Report[];

  const [reports, setReports] = useState<DataType>([] as unknown as DataType);
  const [count, setCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // La key de dependencia: serializar categorías y vista para detectar cambios
  const filterKey = `${view}:${[...categories].sort().join(',')}`;

  useEffect(() => {
    // Cerrar conexión anterior sin limpiar `reports` (mantener datos visibles)
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setIsConnected(false);
    setError(null);

    // Construir URL del stream con los mismos filtros que el GET
    const params = new URLSearchParams({ view });
    categories.forEach((c) => params.append('category', c));
    const url = `/api/reports/stream?${params.toString()}`;

    const es = new EventSource(url);
    esRef.current = es;

    // Recibir snapshot completo de Firestore
    es.addEventListener('reports', (e: MessageEvent) => {
      try {
        const payload: StreamPayload = JSON.parse(e.data);
        setReports(payload.data as DataType);
        setCount(payload.count);
        setIsConnected(true);
        setIsInitialLoad(false);
        setError(null);
      } catch {
        // JSON malformado — ignorar
      }
    });

    // Error empujado desde el servidor (ej: Firestore no disponible)
    es.addEventListener('error', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setError(payload.message);
      } catch {
        // Error de red — EventSource reintenta automáticamente
      }
      setIsConnected(false);
    });

    // Error de red/transporte — EventSource reintenta sola, no hacemos nada
    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  return {
    reports,
    count,
    isConnected,
    isLoading: isInitialLoad,
    error,
  };
}
