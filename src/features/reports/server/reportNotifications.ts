import { adminDb, adminMessaging } from '@/lib/firebase/admin';
import { CATEGORIES } from '@/lib/constants/categories';
import { Report } from '@/types/report';

/**
 * Sends push notifications to subscribed devices after a new report is created.
 * This is intentionally fire-and-forget from the route handler.
 */
export async function triggerReportPushNotifications(report: Report) {
  try {
    const tokensSnapshot = await adminDb.collection('fcm_tokens').get();
    if (tokensSnapshot.empty) {
      return;
    }

    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data().token)
      .filter((token): token is string => typeof token === 'string' && token.length > 0);

    if (tokens.length === 0) {
      return;
    }

    const categoryLabel = CATEGORIES[report.category as keyof typeof CATEGORIES]?.label || report.category;
    const title = `Nueva Alerta: ${categoryLabel}`;
    const body = report.title;
    const url = `/?reportId=${report.id}`;

    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        title,
        body,
        url,
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192-maskable.png',
          tag: 'nuevo-reporte',
          data: {
            url,
          },
        },
      },
    });

    const tokensToDelete: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const code = resp.error.code;
        const token = tokens[idx];
        if (
          token &&
          (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-argument')
        ) {
          tokensToDelete.push(token);
        }
      }
    });

    if (tokensToDelete.length > 0) {
      const cleanupBatch = adminDb.batch();
      tokensToDelete.forEach((token) => {
        cleanupBatch.delete(adminDb.collection('fcm_tokens').doc(token));
      });
      await cleanupBatch.commit();
      console.log(`[FCM] Se eliminaron ${tokensToDelete.length} tokens invalidos.`);
    }

    console.log(`[FCM] Exito: ${response.successCount}, Fallos: ${response.failureCount}`);
  } catch (error) {
    console.error('[FCM] Error en triggerReportPushNotifications:', error);
  }
}
