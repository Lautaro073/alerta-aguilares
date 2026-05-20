import useSWR from 'swr';
import { CategoryId } from '@/lib/constants/categories';
import { Report } from '@/types/report';

interface UseReportsOptions {
  categories?: CategoryId[];
  view?: 'markers' | 'heatmap';
}

interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
}

// Fetcher estándar seguro para llamadas internas del proyecto
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener los reportes.');
  }
  return response.json();
};

/**
 * Hook reactivo para obtener, filtrar y mantener sincronizados los reportes de incidentes.
 * 
 * Implementa:
 * - Polling inteligente en segundo plano cada 30 segundos (actualizaciones constantes).
 * - Revalidación automática en foco de pantalla (evita datos desactualizados tras inactividad).
 * - Deduplicación de llamadas paralelas en 5 segundos.
 * - keepPreviousData habilitado para evitar parpadeos visuales en el mapa durante las recargas.
 */
export function useReports({ categories = [], view = 'markers' }: UseReportsOptions = {}) {
  // Construir la URL serializando filtros activos y tipo de vista
  const getQueryKey = () => {
    const params = new URLSearchParams();
    params.append('view', view);
    
    if (categories && categories.length > 0) {
      categories.forEach((cat) => params.append('category', cat));
    }
    
    return `/api/reports?${params.toString()}`;
  };

  // Para tipar dinámicamente según la vista solicitada
  type DataType = typeof view extends 'heatmap' ? { lat: number; lng: number }[] : Report[];

  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<DataType>>(
    getQueryKey(),
    fetcher,
    {
      refreshInterval: 30000,          // Actualizar automáticamente cada 30 segundos
      revalidateOnFocus: true,         // Recargar al enfocar la pestaña del navegador
      dedupingInterval: 5000,          // Deduplicar llamadas repetidas en un intervalo de 5s
      keepPreviousData: true,          // Mantener marcadores visibles mientras carga en background
      fallbackData: { success: true, count: 0, data: [] as unknown as DataType },
    }
  );

  return {
    // Retorna los reportes o lista de coordenadas
    reports: data?.data || [],
    count: data?.count || 0,
    error,
    isLoading,
    isRefetching: isValidating && !isLoading,
    mutate,
  };
}
