import { supabaseAdmin } from '@/lib/supabase/server';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';

type ReportEventType = 'created' | 'status_changed' | 'area_changed' | 'hidden' | 'restored' | 'duplicate_marked' | 'owner_feedback';

export async function createReportEvent({
  reportId,
  actorUid,
  eventType,
  metadata = {},
  cityId = DEFAULT_CITY_ID,
}: {
  reportId: string;
  actorUid?: string | null;
  eventType: ReportEventType;
  metadata?: Record<string, unknown>;
  cityId?: string;
}) {
  const { error } = await supabaseAdmin
    .from('report_events')
    .insert({
      city_id: cityId,
      report_id: reportId,
      actor_uid: actorUid || null,
      event_type: eventType,
      metadata,
    });

  if (error) throw error;
}
