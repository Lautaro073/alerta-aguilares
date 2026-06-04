import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { Report } from '@/types/report';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request);
    if (errorResponse) return errorResponse;

    const snapshot = await adminDb
      .collection('reports')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    const reports: Report[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        cityId: data.cityId || DEFAULT_CITY_ID,
        lat: data.lat,
        lng: data.lng,
        geohash: data.geohash,
        category: data.category,
        title: data.title,
        description: data.description || null,
        images: data.images || [],
        status: data.status || 'ACTIVE',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        resolvedAt: data.resolvedAt || null,
        verifiedCount: data.verifiedCount || 0,
        userId: data.userId || undefined,
        userDisplayName: data.userDisplayName || undefined,
      } as Report;
    });

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

