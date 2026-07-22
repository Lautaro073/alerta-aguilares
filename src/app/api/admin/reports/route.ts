import { NextRequest } from 'next/server';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { badRequest, serverError } from '@/lib/server/response';
import {
  AdminReportFilters,
  AdminReportSort,
  AdminReportStatusFilter,
  AdminReportTimeframeFilter,
  listAdminReportsPage,
} from '@/features/reports/server/reportQueries';

export const dynamic = 'force-dynamic';

const MAX_ADMIN_REPORT_LIMIT = 1000;
const DEFAULT_ADMIN_REPORT_LIMIT = 75;
const VALID_STATUS_FILTERS = new Set<AdminReportStatusFilter>([
  'ALL',
  'PENDING',
  'VERIFYING',
  'IN_PROGRESS',
  'RESOLVED',
  'DISMISSED',
  'DUPLICATE',
  'DELETED',
]);
const VALID_TIMEFRAME_FILTERS = new Set<AdminReportTimeframeFilter>(['all', '7d', '30d']);
const VALID_SORTS = new Set<AdminReportSort>(['recent', 'priority']);

function parsePositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(value: string | null, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseDateParam(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    const params = request.nextUrl.searchParams;
    const limit = Math.min(
      parsePositiveInteger(params.get('limit'), DEFAULT_ADMIN_REPORT_LIMIT),
      MAX_ADMIN_REPORT_LIMIT
    );
    const offset = parseNonNegativeInteger(params.get('offset'), 0);
    const status = (params.get('status') || 'ALL') as AdminReportStatusFilter;
    const timeframe = (params.get('timeframe') || 'all') as AdminReportTimeframeFilter;
    const sort = (params.get('sort') || 'recent') as AdminReportSort;

    if (!VALID_STATUS_FILTERS.has(status)) {
      return badRequest('Filtro de estado invalido.');
    }

    if (!VALID_TIMEFRAME_FILTERS.has(timeframe)) {
      return badRequest('Filtro temporal invalido.');
    }

    if (!VALID_SORTS.has(sort)) {
      return badRequest('Orden invalido.');
    }

    const search = params.get('search') || '';
    const filters: AdminReportFilters = {
      status,
      category: params.get('category') || 'ALL',
      timeframe,
    };
    const from = parseDateParam(params.get('from'));
    const to = parseDateParam(params.get('to'), true);
    if (from) filters.from = from;
    if (to) filters.to = to;
    if (search) {
      filters.search = search;
    }

    const result = await listAdminReportsPage(filters, offset, limit, sort);
    const nextOffset = offset + result.data.length;
    const rangeEnd = result.data.length > 0 ? offset + result.data.length - 1 : offset;

    return Response.json(
      {
        success: true,
        count: result.count,
        data: result.data,
        summary: result.summary,
        pagination: {
          limit,
          offset,
          returned: result.data.length,
          from: result.data.length > 0 ? offset : 0,
          to: result.data.length > 0 ? rangeEnd : 0,
          hasMore: nextOffset < result.count,
          nextOffset: nextOffset < result.count ? nextOffset : null,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    return serverError('GET_ADMIN_REPORTS', error);
  }
}

