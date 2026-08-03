import { NextRequest } from 'next/server';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CitizenRow = {
  uid: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  citizen_status: 'active' | 'blocked';
  terms_accepted_at: string | null;
  created_at: string | null;
  last_seen_at: string | null;
};

function serializeCitizen(row: CitizenRow, reportCount: number) {
  return {
    uid: row.uid,
    displayName: row.display_name,
    email: row.email,
    photoURL: row.photo_url,
    status: row.citizen_status,
    reportCount,
    termsAcceptedAt: row.terms_accepted_at,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

function getCurrentMonthStart() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return new Date(`${year}-${month}-01T00:00:00-03:00`).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset') || '0'));
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || '10')));
    const search = request.nextUrl.searchParams.get('search')?.trim().replace(/[,%()]/g, ' ');
    const status = request.nextUrl.searchParams.get('status');
    const created = request.nextUrl.searchParams.get('created');

    let citizensQuery = supabaseAdmin
      .from('users')
      .select(
        'uid, display_name, email, photo_url, citizen_status, terms_accepted_at, created_at, last_seen_at',
        { count: 'exact' },
      )
      .eq('role', 'user');

    if (search) citizensQuery = citizensQuery.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (status === 'active' || status === 'blocked') citizensQuery = citizensQuery.eq('citizen_status', status);
    if (created === 'this_month') citizensQuery = citizensQuery.gte('created_at', getCurrentMonthStart());

    const [citizensResult, totalResult, activeResult, blockedResult, newResult] = await Promise.all([
      citizensQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1),
      supabaseAdmin.from('users').select('uid', { count: 'exact', head: true }).eq('role', 'user'),
      supabaseAdmin.from('users').select('uid', { count: 'exact', head: true }).eq('role', 'user').eq('citizen_status', 'active'),
      supabaseAdmin.from('users').select('uid', { count: 'exact', head: true }).eq('role', 'user').eq('citizen_status', 'blocked'),
      supabaseAdmin.from('users').select('uid', { count: 'exact', head: true }).eq('role', 'user').gte('created_at', getCurrentMonthStart()),
    ]);

    const firstError = [citizensResult, totalResult, activeResult, blockedResult, newResult]
      .find((result) => result.error)?.error;
    if (firstError) throw firstError;

    const citizenRows = (citizensResult.data || []) as CitizenRow[];
    const citizenIds = citizenRows.map((citizen) => citizen.uid);
    const reportCounts = new Map<string, number>();

    if (citizenIds.length > 0) {
      const { data: reports, error: reportsError } = await supabaseAdmin
        .from('reports')
        .select('user_id')
        .in('user_id', citizenIds);
      if (reportsError) throw reportsError;
      for (const report of reports || []) {
        if (report.user_id) reportCounts.set(report.user_id, (reportCounts.get(report.user_id) || 0) + 1);
      }
    }

    return Response.json(
      {
        success: true,
        data: citizenRows.map((row) => serializeCitizen(row, reportCounts.get(row.uid) || 0)),
        count: citizensResult.count || 0,
        summary: {
          total: totalResult.count || 0,
          active: activeResult.count || 0,
          blocked: blockedResult.count || 0,
          newThisMonth: newResult.count || 0,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return serverError('GET_ADMIN_USERS', error);
  }
}
