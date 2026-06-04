import useSWR from 'swr';
import { CategoryId } from '@/lib/constants/categories';
import { Report } from '@/types/report';
import { TimeframeId } from './useMapFilter';

interface UseReportsOptions {
  categories?: CategoryId[];
  view?: 'markers' | 'heatmap';
  timeframe?: TimeframeId;
  bounds?: { south: number; north: number; west: number; east: number } | null;
  refreshInterval?: number;
}

interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener los reportes.');
  }
  return response.json();
};

export function useReports({
  categories = [],
  view = 'markers',
  timeframe = 'all',
  bounds = null,
  refreshInterval = 60000,
}: UseReportsOptions = {}) {
  const getQueryKey = () => {
    const params = new URLSearchParams();
    params.append('view', view);

    categories.forEach((cat) => params.append('category', cat));

    if (timeframe !== 'all') {
      params.append('timeframe', timeframe);
    }

    if (bounds) {
      params.append('south', bounds.south.toString());
      params.append('north', bounds.north.toString());
      params.append('west', bounds.west.toString());
      params.append('east', bounds.east.toString());
    }

    return `/api/reports?${params.toString()}`;
  };

  type DataType = typeof view extends 'heatmap' ? { lat: number; lng: number }[] : Report[];

  const { data, error, isLoading, isValidating, mutate } = useSWR<ApiResponse<DataType>>(
    getQueryKey(),
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      keepPreviousData: true,
      fallbackData: { success: true, count: 0, data: [] as unknown as DataType },
    }
  );

  return {
    reports: data?.data || [],
    count: data?.count || 0,
    error,
    isLoading,
    isRefetching: isValidating && !isLoading,
    mutate,
  };
}
