import { NextRequest } from 'next/server';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { listAdminReports } from '@/features/reports/server/reportQueries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    const reports = await listAdminReports();

    return Response.json(
      {
        success: true,
        count: reports.length,
        data: reports,
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

