'use client';

import { useState, useEffect, useRef } from 'react';
import { CategoryId } from '@/lib/constants/categories';
import { Report } from '@/types/report';
import { TimeframeId } from './useMapFilter';

interface UseRealtimeReportsOptions {
  categories?: CategoryId[];
  view?: 'markers' | 'heatmap';
  timeframe?: TimeframeId;
  bounds?: { south: number; north: number; west: number; east: number } | null;
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
  timeframe = 'all',
  bounds = null,
}: UseRealtimeReportsOptions = {}) {
  type DataType = typeof view extends 'heatmap' ? HeatmapPoint[] : Report[];

  const [reports, setReports] = useState<DataType>([] as unknown as DataType);
  const [count, setCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // Calculamos límites acolchados y redondeados a 2 decimales (~1.1 km)
  // para estabilizar la clave de conexión y prevenir reconexiones innecesarias.
  let boundsKey = 'none';
  let paddedBounds: { south: number; north: number; west: number; east: number } | null = null;

  if (bounds) {
    const latPad = Math.abs(bounds.north - bounds.south) * 0.3;
    const lngPad = Math.abs(bounds.east - bounds.west) * 0.3;
    paddedBounds = {
      south: bounds.south - latPad,
      north: bounds.north + latPad,
      west: bounds.west - lngPad,
      east: bounds.east + lngPad,
    };
    boundsKey = `${paddedBounds.south.toFixed(2)},${paddedBounds.north.toFixed(2)},${paddedBounds.west.toFixed(2)},${paddedBounds.east.toFixed(2)}`;
  }

  const filterKey = `${view}:${timeframe}:${boundsKey}:${[...categories].sort().join(',')}`;

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
    if (timeframe && timeframe !== 'all') {
      params.append('timeframe', timeframe);
    }
    if (paddedBounds) {
      params.append('south', paddedBounds.south.toString());
      params.append('north', paddedBounds.north.toString());
      params.append('west', paddedBounds.west.toString());
      params.append('east', paddedBounds.east.toString());
    }
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
