'use client';

import { useEffect, useRef, useState } from 'react';
import { CategoryId } from '@/lib/constants/categories';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Report } from '@/types/report';
import { TimeframeId } from './useMapFilter';
import { useReports } from './useReports';

interface UseRealtimeReportsOptions {
  categories?: CategoryId[];
  view?: 'markers' | 'heatmap';
  timeframe?: TimeframeId;
  bounds?: { south: number; north: number; west: number; east: number } | null;
}

type HeatmapPoint = { lat: number; lng: number };

export function useRealtimeReports({
  categories = [],
  view = 'markers',
  timeframe = 'all',
  bounds = null,
}: UseRealtimeReportsOptions = {}) {
  type DataType = typeof view extends 'heatmap' ? HeatmapPoint[] : Report[];

  const [isFeedConnected, setIsFeedConnected] = useState(false);
  const lastSeenVersionRef = useRef<number | null>(null);

  const { reports, count, error, isLoading, isRefetching, mutate } = useReports({
    categories,
    view,
    timeframe,
    bounds,
    refreshInterval: 60000,
  });

  let boundsKey = 'none';
  if (bounds) {
    const latPad = Math.abs(bounds.north - bounds.south) * 0.3;
    const lngPad = Math.abs(bounds.east - bounds.west) * 0.3;
    boundsKey = [
      (bounds.south - latPad).toFixed(2),
      (bounds.north + latPad).toFixed(2),
      (bounds.west - lngPad).toFixed(2),
      (bounds.east + lngPad).toFixed(2),
    ].join(',');
  }

  const filterKey = `${view}:${timeframe}:${boundsKey}:${[...categories].sort().join(',')}`;

  useEffect(() => {
    lastSeenVersionRef.current = null;
  }, [filterKey]);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`public-feed:${DEFAULT_CITY_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_feeds',
          filter: `city_id=eq.${DEFAULT_CITY_ID}`,
        },
        (payload) => {
          setIsFeedConnected(true);

          const version = (payload.new as { report_version?: number } | null)?.report_version;
          if (typeof version !== 'number') {
            return;
          }

          if (lastSeenVersionRef.current !== version) {
            lastSeenVersionRef.current = version;
            void mutate();
          }
        }
      )
      .subscribe((status) => {
        setIsFeedConnected(status === 'SUBSCRIBED');
      });

    return () => {
      void supabaseBrowser.removeChannel(channel);
      setIsFeedConnected(false);
    };
  }, [mutate]);

  return {
    reports: reports as DataType,
    count,
    isConnected: isFeedConnected && !error,
    isLoading,
    isRefetching,
    error,
  };
}
