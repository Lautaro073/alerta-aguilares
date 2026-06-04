import { NextRequest } from 'next/server';
import { badRequest, serverError } from '@/lib/server/response';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SubscribeSchema = z.object({
  token: z.string().min(1),
  uid: z.string().optional().nullable(),
});

/**
 * POST /api/notifications/subscribe
 * 
 * Registra o actualiza un token de Firebase Cloud Messaging (FCM) para recibir alertas push.
 * Al usar el propio token como primary key, evitamos duplicar suscripciones de un mismo cliente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SubscribeSchema.safeParse(body);
    
    if (!parsed.success) {
      return badRequest('Datos de suscripción no válidos.', parsed.error.format());
    }

    const { token, uid } = parsed.data;

    const { error } = await supabaseAdmin.from('fcm_tokens').upsert({
      token,
      uid: uid || null,
    }, { onConflict: 'token' });

    if (error) {
      throw error;
    }

    return Response.json({ 
      success: true, 
      message: 'Suscripción a notificaciones registrada con éxito.' 
    }, { status: 201 });

  } catch (error: unknown) {
    return serverError('POST_SUBSCRIBE_NOTIFICATION', error);
  }
}
