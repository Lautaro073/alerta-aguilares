import { NextRequest } from 'next/server';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const RELATED_DISTANCE_METERS = 40;
const RELATED_DAYS = 30;

type EventRow = {
  id: string;
  event_type: string;
  actor_uid: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ReportCandidate = {
  id: string;
  title: string;
  category: string;
  location_label: string | null;
  status: string;
  lat: number;
  lng: number;
  created_at: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const { errorResponse } = await verifyAdminRole(request, ['admin', 'operator', 'official']);
    if (errorResponse) return errorResponse;

    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('id, city_id, title, category, lat, lng, created_at')
      .eq('id', reportId)
      .eq('city_id', DEFAULT_CITY_ID)
      .maybeSingle<ReportCandidate>();

    if (reportError) throw reportError;

    if (!report) {
      return Response.json({ success: false, error: 'La alerta no existe.' }, { status: 404 });
    }

    const { data: events, error: eventsError } = await supabaseAdmin
      .from('report_events')
      .select('id, event_type, actor_uid, metadata, created_at')
      .eq('report_id', reportId)
      .eq('city_id', DEFAULT_CITY_ID)
      .order('created_at', { ascending: false })
      .returns<EventRow[]>();

    if (eventsError) throw eventsError;

    const actorUids = [...new Set((events || []).map((event) => event.actor_uid).filter(Boolean))] as string[];
    const actorNames = new Map<string, string>();

    if (actorUids.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('uid, display_name, email')
        .in('uid', actorUids);

      if (usersError) throw usersError;

      for (const user of users || []) {
        actorNames.set(user.uid, user.display_name || user.email || user.uid);
      }
    }

    const since = new Date(Date.now() - RELATED_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: candidates, error: relatedError } = await supabaseAdmin
      .from('reports')
      .select('id, title, category, location_label, status, lat, lng, created_at')
      .eq('city_id', DEFAULT_CITY_ID)
      .eq('category', report.category)
      .neq('id', reportId)
      .gte('created_at', since)
      .is('deleted_at', null)
      .limit(80)
      .returns<ReportCandidate[]>();

    if (relatedError) throw relatedError;

    const related = (candidates || [])
      .map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        category: candidate.category,
        locationLabel: candidate.location_label,
        status: candidate.status,
        createdAt: candidate.created_at,
        distanceMeters: Math.round(getDistanceMeters(report, candidate)),
      }))
      .filter((candidate) => candidate.distanceMeters <= RELATED_DISTANCE_METERS)
      .sort((left, right) => left.distanceMeters - right.distanceMeters)
      .slice(0, 5);

    return Response.json({
      success: true,
      data: {
        events: (events || []).map((event) => ({
          id: event.id,
          type: event.event_type,
          actorUid: event.actor_uid,
          actorName: event.actor_uid ? actorNames.get(event.actor_uid) || event.actor_uid : null,
          metadata: event.metadata,
          createdAt: event.created_at,
        })),
        related,
      },
    });
  } catch (error) {
    return serverError('GET_REPORT_EVENTS', error);
  }
}

function getDistanceMeters(
  left: Pick<ReportCandidate, 'lat' | 'lng'>,
  right: Pick<ReportCandidate, 'lat' | 'lng'>
) {
  const earthRadius = 6371000;
  const lat1 = toRadians(left.lat);
  const lat2 = toRadians(right.lat);
  const deltaLat = toRadians(right.lat - left.lat);
  const deltaLng = toRadians(right.lng - left.lng);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}
