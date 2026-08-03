import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { badRequest, serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{ uid: string }>;
};

const UpdateCitizenSchema = z.object({
  status: z.enum(['active', 'blocked']),
});
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const { uid } = await context.params;
    const parsed = UpdateCitizenSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return badRequest('Estado de ciudadano invalido.');

    const { data: citizen, error: citizenError } = await supabaseAdmin
      .from('users')
      .select('uid, role, citizen_status')
      .eq('uid', uid)
      .maybeSingle();

    if (citizenError) throw citizenError;
    if (!citizen || citizen.role !== 'user') {
      return Response.json({ success: false, error: 'Ciudadano no encontrado.' }, { status: 404 });
    }

    const nextStatus = parsed.data.status;
    const previousStatus = citizen.citizen_status === 'blocked' ? 'blocked' : 'active';
    if (UUID_PATTERN.test(uid)) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        ban_duration: nextStatus === 'blocked' ? '876000h' : 'none',
      });
      if (authError) throw authError;
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ citizen_status: nextStatus, updated_at: new Date().toISOString() })
      .eq('uid', uid)
      .eq('role', 'user');

    if (updateError && UUID_PATTERN.test(uid)) {
      const { error: rollbackError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        ban_duration: previousStatus === 'blocked' ? '876000h' : 'none',
      });
      if (rollbackError) console.error('No se pudo revertir el bloqueo de Auth:', rollbackError.message);
      throw updateError;
    }
    if (updateError) throw updateError;

    return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return serverError('PATCH_ADMIN_USER', error);
  }
}
