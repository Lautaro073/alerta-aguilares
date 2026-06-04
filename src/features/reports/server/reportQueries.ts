import { supabaseAdmin } from '@/lib/supabase/server';
import { GetReportsQueryInput } from '@/lib/validators/report.schema';
import {
  mapSupabaseReportForView,
  mapSupabaseReportToReport,
  ReportListItem,
  SupabaseReportRow,
} from './reportMapper';
import { Report } from '@/types/report';

const PUBLIC_REPORT_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
  'CDN-Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
};

export function getPublicReportCacheHeaders() {
  return PUBLIC_REPORT_CACHE_HEADERS;
}

function getTimeframeThreshold(timeframe: GetReportsQueryInput['timeframe']) {
  if (!timeframe || timeframe === 'all') return null;

  const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export async function listPublicReports(queryInput: GetReportsQueryInput): Promise<ReportListItem[]> {
  const { category, limit, timeframe, south, north, west, east, view } = queryInput;
  const maxAllowedLimit = view === 'heatmap' ? 1000 : 500;
  const finalLimit = limit ? Math.min(limit, maxAllowedLimit) : maxAllowedLimit;
  const thresholdDate = getTimeframeThreshold(timeframe);

  let query = supabaseAdmin
    .from('reports')
    .select('*')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(finalLimit);

  if (category && category.length > 0) {
    query = query.in('category', category);
  }

  if (thresholdDate) {
    query = query.gte('created_at', thresholdDate);
  }

  if (south !== undefined && north !== undefined && west !== undefined && east !== undefined) {
    query = query
      .gte('lat', south)
      .lte('lat', north)
      .gte('lng', west)
      .lte('lng', east);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return ((data || []) as SupabaseReportRow[]).map((row) => mapSupabaseReportForView(row, view));
}

export async function listAdminReports(): Promise<Report[]> {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    throw error;
  }

  return ((data || []) as SupabaseReportRow[]).map(mapSupabaseReportToReport);
}

export async function getReportCityId(reportId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('city_id')
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.city_id || null;
}

export async function getReportById(reportId: string): Promise<Report | null> {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapSupabaseReportToReport(data as SupabaseReportRow) : null;
}
