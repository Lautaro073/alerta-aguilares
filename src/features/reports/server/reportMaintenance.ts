import { adminDb } from '@/lib/firebase/admin';
import { encodeGeohash } from '@/lib/utils/geoUtils';

let geohashMigrationTriggered = false;

/**
 * Backfills geohash for legacy reports. Kept separate from route handlers so
 * HTTP routes stay focused on request/response orchestration.
 */
export async function runReportGeohashMigrationOnce() {
  if (geohashMigrationTriggered) return;
  geohashMigrationTriggered = true;

  try {
    const snapshot = await adminDb.collection('reports').get();
    const unmigrated = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return !data.geohash && data.lat !== undefined && data.lng !== undefined;
    });

    if (unmigrated.length === 0) {
      return;
    }

    console.log(`[Migration] Detectados ${unmigrated.length} reportes antiguos sin geohash. Iniciando migracion...`);

    const chunks = [];
    for (let i = 0; i < unmigrated.length; i += 500) {
      chunks.push(unmigrated.slice(i, i + 500));
    }

    for (const chunk of chunks) {
      const batch = adminDb.batch();
      chunk.forEach((doc) => {
        const data = doc.data();
        batch.update(doc.ref, { geohash: encodeGeohash(data.lat, data.lng) });
      });
      await batch.commit();
    }

    console.log(`[Migration] Migracion de geohashes finalizada exitosamente para ${unmigrated.length} reportes.`);
  } catch (error) {
    console.error('[Migration] Error durante la migracion retroactiva de geohashes:', error);
  }
}
