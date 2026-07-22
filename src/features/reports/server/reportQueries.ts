import { supabaseAdmin } from '@/lib/supabase/server';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { GetReportsQueryInput } from '@/lib/validators/report.schema';
import {
  mapSupabaseReportForView,
  mapSupabaseReportToReport,
  ReportListItem,
  SupabaseReportRow,
} from './reportMapper';
import { Report } from '@/types/report';

const OPEN_REPORT_STATUSES = ['PENDING', 'VERIFYING', 'IN_PROGRESS'] as const;

const PUBLIC_REPORT_CACHE_HEADERS = {
  'Cache-Control': 'no-store',
};

export function getPublicReportCacheHeaders() {
  return PUBLIC_REPORT_CACHE_HEADERS;
}

export type AdminReportStatusFilter = 'ALL' | 'PENDING' | 'VERIFYING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED' | 'DUPLICATE' | 'DELETED';
export type AdminReportTimeframeFilter = 'all' | '7d' | '30d';
export type AdminReportSort = 'recent' | 'priority';

export interface AdminReportFilters {
  search?: string;
  status?: AdminReportStatusFilter;
  category?: string;
  timeframe?: AdminReportTimeframeFilter;
  from?: string;
  to?: string;
}

export interface AdminReportSummary {
  totalReports: number;
  activeReports: number;
  pendingReports: number;
  verifyingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  dismissedReports: number;
  duplicateReports: number;
  archivedReports: number;
  avgResolutionHours: number | null;
  categoryStats?: AdminCategoryStat[];
}

export interface AdminCategoryStat {
  category: string;
  total: number;
  resolved: number;
}

export interface AdminReportPageResult {
  data: Report[];
  count: number;
  summary: AdminReportSummary;
}

const ADMIN_CATEGORY_PRIORITY = new Map<string, number>([
  ['ACCIDENTE', 0],
  ['SEMAFORO', 0],
  ['ALUMBRADO', 0],
  ['BACHE', 1],
  ['SENALIZACION', 1],
  ['VEHICULO_ABANDONADO', 1],
]);

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

function applyAdminDateFilters<T extends { gte: (column: string, value: string) => T; lte: (column: string, value: string) => T }>(
  query: T,
  filters: AdminReportFilters
) {
  const thresholdDate = getAdminTimeframeThreshold(filters.timeframe);
  let nextQuery = query;

  if (thresholdDate) nextQuery = nextQuery.gte('created_at', thresholdDate);
  if (filters.from) nextQuery = nextQuery.gte('created_at', filters.from);
  if (filters.to) nextQuery = nextQuery.lte('created_at', filters.to);

  return nextQuery;
}

function sanitizeAdminSearch(search: string | undefined) {
  const normalizedSearch = search?.trim().slice(0, 80);
  if (!normalizedSearch) return null;

  return normalizedSearch.replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').trim() || null;
}

function getAdminSearchTerms(search: string | null) {
  if (!search) return [];

  return search
    .split(' ')
    .filter((term) => term.length >= 2 && term.toLowerCase() !== 'barrio')
    .slice(0, 6);
}

export async function listPublicReports(queryInput: GetReportsQueryInput): Promise<ReportListItem[]> {
  const { category, limit, timeframe, south, north, west, east, view } = queryInput;
  const maxAllowedLimit = view === 'heatmap' ? 1000 : 500;
  const finalLimit = limit ? Math.min(limit, maxAllowedLimit) : maxAllowedLimit;
  const thresholdDate = getTimeframeThreshold(timeframe);

  let query = supabaseAdmin
    .from('reports')
    .select('*')
    .eq('city_id', DEFAULT_CITY_ID)
    .or(`status.in.(${OPEN_REPORT_STATUSES.join(',')}),and(category.eq.SEMAFORO,status.eq.RESOLVED)`)
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
    .eq('city_id', DEFAULT_CITY_ID)
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
  limit: number,
  sort: AdminReportSort = 'recent'
): Promise<AdminReportPageResult> {
  const status = filters.status || 'ALL';
  const search = sanitizeAdminSearch(filters.search);

  let query = supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact' })
    .eq('city_id', DEFAULT_CITY_ID);

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

  query = applyAdminDateFilters(query, filters);

  const searchTerms = getAdminSearchTerms(search);
  if (searchTerms.length > 0) {
    query = query.or(searchTerms
      .flatMap((term) => [
        `title.ilike.%${term}%`,
        `description.ilike.%${term}%`,
        `location_label.ilike.%${term}%`,
        `id.ilike.%${term}%`,
      ])
      .join(','));
  }

  const [{ data, error, count }, summary, municipalCounts] = await Promise.all([
    query,
    getAdminReportSummary(filters),
    getAdminReportMunicipalCounts(),
  ]);

  if (error) {
    throw error;
  }

  const sortedData = ((data || []) as SupabaseReportRow[]).map((row) => ({
    ...row,
    verified_count: municipalCounts.get(row.id) || 1,
  })).sort(
    sort === 'priority' ? sortAdminReportRowsByPriority : sortAdminReportRowsByDate
  );

  return {
    data: sortedData.slice(offset, offset + limit).map(mapSupabaseReportToReport),
    count: count || 0,
    summary,
  };
}

async function getAdminReportMunicipalCounts() {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('id,category,location_label,duplicate_of_report_id,deleted_at')
    .eq('city_id', DEFAULT_CITY_ID)
    .is('deleted_at', null);

  if (error) throw error;

  const rows = data || [];
  const rowKeys = new Map<string, string>();
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const addressCounts = new Map<string, number>();
  const linkedExtraCounts = new Map<string, number>();

  for (const row of rows) {
    const key = getMunicipalReportKey(row.category, row.location_label);
    rowKeys.set(row.id, key);
    addressCounts.set(key, (addressCounts.get(key) || 0) + 1);
  }

  for (const row of rows) {
    if (!row.duplicate_of_report_id) continue;

    const parent = rowById.get(row.duplicate_of_report_id);
    if (!parent) continue;

    const parentKey = rowKeys.get(parent.id);
    const childKey = rowKeys.get(row.id);
    if (parentKey && childKey && parentKey !== childKey) {
      linkedExtraCounts.set(parent.id, (linkedExtraCounts.get(parent.id) || 0) + 1);
    }
  }

  return new Map(rows.map((row) => {
    const key = rowKeys.get(row.id);
    const baseCount = key ? addressCounts.get(key) || 1 : 1;
    return [row.id, baseCount + (linkedExtraCounts.get(row.id) || 0)];
  }));
}

function getMunicipalReportKey(category: string, locationLabel: string | null) {
  return `${category}:${(locationLabel || '').trim().toLowerCase()}`;
}

function sortAdminReportRowsByPriority(a: SupabaseReportRow, b: SupabaseReportRow) {
  return (
    getAdminStatusRank(a.status) - getAdminStatusRank(b.status) ||
    getAdminPriorityRank(a) - getAdminPriorityRank(b) ||
    (b.verified_count || 0) - (a.verified_count || 0) ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function getAdminPriorityRank(report: SupabaseReportRow) {
  if (report.priority === 'high') return 0;
  if (report.priority === 'medium') return 1;
  if (report.priority === 'low') return 2;
  return ADMIN_CATEGORY_PRIORITY.get(report.category) ?? 2;
}

function sortAdminReportRowsByDate(a: SupabaseReportRow, b: SupabaseReportRow) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function getAdminStatusRank(status: SupabaseReportRow['status']) {
  if (status === 'PENDING') return 0;
  if (status === 'VERIFYING') return 1;
  if (status === 'IN_PROGRESS') return 2;
  if (status === 'DUPLICATE') return 3;
  if (status === 'DISMISSED') return 4;
  return 5;
}

async function getAdminReportSummary(filters: AdminReportFilters = {}): Promise<AdminReportSummary> {
  let query = supabaseAdmin
    .from('reports')
    .select('category,status,deleted_at,created_at,resolved_at,updated_at')
    .eq('city_id', DEFAULT_CITY_ID);

  if (filters.category && filters.category !== 'ALL') {
    query = query.eq('category', filters.category);
  }

  query = applyAdminDateFilters(query, filters);

  const { data, error } = await query;

  if (error) throw error;

  const stats = new Map<string, AdminCategoryStat>();
  let activeReports = 0;
  let pendingReports = 0;
  let verifyingReports = 0;
  let inProgressReports = 0;
  let resolvedReports = 0;
  let dismissedReports = 0;
  let duplicateReports = 0;
  let archivedReports = 0;
  let resolutionMsTotal = 0;
  let resolutionCount = 0;

  for (const row of data || []) {
    if (row.deleted_at) {
      archivedReports += 1;
      continue;
    }

    if ((OPEN_REPORT_STATUSES as readonly string[]).includes(row.status)) activeReports += 1;
    if (row.status === 'PENDING') pendingReports += 1;
    if (row.status === 'VERIFYING') verifyingReports += 1;
    if (row.status === 'IN_PROGRESS') inProgressReports += 1;
    if (row.status === 'RESOLVED') {
      resolvedReports += 1;
      const resolvedAt = new Date(row.resolved_at || row.updated_at).getTime();
      const createdAt = new Date(row.created_at).getTime();
      if (Number.isFinite(resolvedAt) && Number.isFinite(createdAt) && resolvedAt >= createdAt) {
        resolutionMsTotal += resolvedAt - createdAt;
        resolutionCount += 1;
      }
    }
    if (row.status === 'DISMISSED') dismissedReports += 1;
    if (row.status === 'DUPLICATE') duplicateReports += 1;

    const current = stats.get(row.category) || { category: row.category, total: 0, resolved: 0 };
    current.total += 1;
    if (row.status === 'RESOLVED') current.resolved += 1;
    stats.set(row.category, current);
  }

  return {
    totalReports: data?.length || 0,
    activeReports,
    pendingReports,
    verifyingReports,
    inProgressReports,
    resolvedReports,
    dismissedReports,
    duplicateReports,
    archivedReports,
    avgResolutionHours: resolutionCount > 0 ? Math.round((resolutionMsTotal / resolutionCount / 36_000) / 100) : null,
    categoryStats: [...stats.values()].sort((a, b) => b.total - a.total),
  };
}

export async function getReportCityId(reportId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('city_id')
    .eq('id', reportId)
    .eq('city_id', DEFAULT_CITY_ID)
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
    .eq('city_id', DEFAULT_CITY_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapSupabaseReportToReport(data as SupabaseReportRow) : null;
}
