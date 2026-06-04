import { adminMessaging } from '@/lib/firebase/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/constants/categories';
import { Report } from '@/types/report';

/**
 * Sends push notifications to subscribed devices after a new report is created.
 * This is intentionally fire-and-forget from the route handler.
 */
export async function triggerReportPushNotifications(report: Report) {
  try {
    const { data, error } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token');

    if (error) {
      throw error;
    }

    const tokens = (data || [])
      .map((row) => row.token)
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
      const { error: deleteError } = await supabaseAdmin
        .from('fcm_tokens')
        .delete()
        .in('token', tokensToDelete);

      if (deleteError) {
        throw deleteError;
      }

      console.log(`[FCM] Se eliminaron ${tokensToDelete.length} tokens invalidos.`);
    }

    console.log(`[FCM] Exito: ${response.successCount}, Fallos: ${response.failureCount}`);
  } catch (error) {
    console.error('[FCM] Error en triggerReportPushNotifications:', error);
  }
}
