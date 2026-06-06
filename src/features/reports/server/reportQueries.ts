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

export type AdminReportStatusFilter = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'DUPLICATE' | 'DELETED';
export type AdminReportTimeframeFilter = 'all' | '7d' | '30d';

export interface AdminReportFilters {
  search?: string;
  status?: AdminReportStatusFilter;
  category?: string;
  timeframe?: AdminReportTimeframeFilter;
}

export interface AdminReportSummary {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  archivedReports: number;
}

export interface AdminReportPageResult {
  data: Report[];
  count: number;
  summary: AdminReportSummary;
}

function getTimeframeThreshold(timeframe: GetReportsQueryInput['timeframe']) {
  if (!timeframe || timeframe === 'all') return null;

  const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 * 24 : 30 * 24;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function getAdminTimeframeThreshold(timeframe: AdminReportTimeframeFilter | undefined) {
  if (!timeframe || timeframe === 'all') return null;

  const hours = timeframe === '7d' ? 7 * 24 : 30 * 24;
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function sanitizeAdminSearch(search: string | undefined) {
  const normalizedSearch = search?.trim().slice(0, 80);
  if (!normalizedSearch) return null;

  return normalizedSearch.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim() || null;
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
    .is('deleted_at', null)
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
  // Admin can see ALL reports including soft-deleted ones
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

export async function listAdminReportsPage(
  filters: AdminReportFilters,
  offset: number,
  limit: number
): Promise<AdminReportPageResult> {
  const status = filters.status || 'ALL';
  const search = sanitizeAdminSearch(filters.search);
  const thresholdDate = getAdminTimeframeThreshold(filters.timeframe);

  let query = supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status === 'DELETED') {
    query = query.not('deleted_at', 'is', null);
  } else {
    query = query.is('deleted_at', null);
    if (status !== 'ALL') {
      query = query.eq('status', status);
    }
  }

  if (filters.category && filters.category !== 'ALL') {
    query = query.eq('category', filters.category);
  }

  if (thresholdDate) {
    query = query.gte('created_at', thresholdDate);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,id.ilike.%${search}%`);
  }

  const [{ data, error, count }, summary] = await Promise.all([
    query,
    getAdminReportSummary(),
  ]);

  if (error) {
    throw error;
  }

  return {
    data: ((data || []) as SupabaseReportRow[]).map(mapSupabaseReportToReport),
    count: count || 0,
    summary,
  };
}

async function countAdminReports(
  status: 'ACTIVE' | 'RESOLVED' | null,
  deleted: 'visible' | 'archived' | 'all'
): Promise<number> {
  let query = supabaseAdmin
    .from('reports')
    .select('id', { count: 'exact', head: true });

  if (deleted === 'visible') {
    query = query.is('deleted_at', null);
  } else if (deleted === 'archived') {
    query = query.not('deleted_at', 'is', null);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count || 0;
}

async function getAdminReportSummary(): Promise<AdminReportSummary> {
  const [totalReports, activeReports, resolvedReports, archivedReports] = await Promise.all([
    countAdminReports(null, 'all'),
    countAdminReports('ACTIVE', 'visible'),
    countAdminReports('RESOLVED', 'visible'),
    countAdminReports(null, 'archived'),
  ]);

  return {
    totalReports,
    activeReports,
    resolvedReports,
    archivedReports,
  };
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
