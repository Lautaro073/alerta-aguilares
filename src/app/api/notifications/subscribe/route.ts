import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { badRequest, serverError } from '@/lib/server/response';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SubscribeSchema = z.object({
  token: z.string().min(1),
  uid: z.string().optional().nullable(),
});

/**
 * POST /api/notifications/subscribe
 * 
 * Registra o actualiza un token de Firebase Cloud Messaging (FCM) para recibir alertas push.
 * Al usar el propio token como Document ID de Firestore, evitamos duplicar suscripciones de un mismo cliente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SubscribeSchema.safeParse(body);
    
    if (!parsed.success) {
      return badRequest('Datos de suscripción no válidos.', parsed.error.format());
    }

    const { token, uid } = parsed.data;

    // Registrar o actualizar el token en Firestore
    const tokenRef = adminDb.collection('fcm_tokens').doc(token);

    await tokenRef.set({
      token,
      uid: uid || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    return Response.json({ 
      success: true, 
      message: 'Suscripción a notificaciones registrada con éxito.' 
    }, { status: 201 });

  } catch (error: any) {
    return serverError('POST_SUBSCRIBE_NOTIFICATION', error);
  }
}
