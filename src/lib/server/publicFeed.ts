import { supabaseAdmin } from '@/lib/supabase/server';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';

interface TouchPublicReportsFeedOptions {
  cityId?: string;
  reportId: string;
}

/**
 * Updates a tiny public document used only as a realtime invalidation signal.
 * It does not contain report content, user IDs, fingerprints, IP data, or photos.
 */
export async function touchPublicReportsFeed({
  cityId = DEFAULT_CITY_ID,
  reportId,
}: TouchPublicReportsFeedOptions) {
  const { error } = await supabaseAdmin.rpc('bump_public_feed', {
    p_city_id: cityId,
    p_report_id: reportId,
  });

  if (error) {
    throw error;
  }
}

