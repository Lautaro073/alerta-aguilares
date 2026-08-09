import { adminMessaging } from '@/lib/firebase/admin';
import { supabaseAdmin } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/constants/categories';
import { Report } from '@/types/report';

type ReportNotificationEvent = 'created' | 'resolved';

function getNotificationContent(report: Report, event: ReportNotificationEvent) {
  const categoryLabel = CATEGORIES[report.category as keyof typeof CATEGORIES]?.label || report.category;

  if (event === 'resolved') {
    return {
      title: `Alerta solucionada: ${categoryLabel}`,
      body: `${report.title} fue marcada como resuelta.`,
    };
  }

  return {
    title: `Nueva alerta: ${categoryLabel}`,
    body: report.title,
  };
}

function getWebPushTopic(reportId: string, event: ReportNotificationEvent) {
  const compactId = reportId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 22);
  return `${event === 'resolved' ? 'r' : 'c'}-${compactId}`;
}

async function triggerReportNotification(report: Report, event: ReportNotificationEvent) {
  try {
    const { data, error } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .eq('city_id', report.cityId);

    if (error) {
      throw error;
    }

    const tokens = (data || [])
      .map((row) => row.token)
      .filter((token): token is string => typeof token === 'string' && token.length > 0);

    if (tokens.length === 0) {
      return;
    }

    const { title, body } = getNotificationContent(report, event);
    const url = `/?reportId=${report.id}`;
    const notificationId = `report:${report.id}:${event}`;
    const tag = `report-${report.id}-${event}`;

    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        reportId: report.id,
        notificationId,
        event,
        title,
        body,
        url,
        tag,
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '300',
          Topic: getWebPushTopic(report.id, event),
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
    console.error(`[FCM] Error enviando notificacion ${event}:`, error);
  }
}

export function triggerReportPushNotifications(report: Report) {
  return triggerReportNotification(report, 'created');
}

export function triggerResolvedReportPushNotifications(report: Report) {
  return triggerReportNotification(report, 'resolved');
}
