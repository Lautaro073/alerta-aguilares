import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';

interface TouchPublicReportsFeedOptions {
  cityId?: string;
  reportId: string;
  createdAt: string;
}

/**
 * Updates a tiny public document used only as a realtime invalidation signal.
 * It does not contain report content, user IDs, fingerprints, IP data, or photos.
 */
export async function touchPublicReportsFeed({
  cityId = DEFAULT_CITY_ID,
  reportId,
  createdAt,
}: TouchPublicReportsFeedOptions) {
  await adminDb.collection('public_feeds').doc(cityId).set(
    {
      cityId,
      reportVersion: admin.firestore.FieldValue.increment(1),
      lastReportId: reportId,
      lastReportAt: createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

