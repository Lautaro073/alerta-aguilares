import { NextRequest } from 'next/server';
import { serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: 'No autorizado. Se requiere token Bearer.' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return Response.json(
        { success: false, error: 'Sesion invalida o expirada.' },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ employee_status: 'active' })
      .eq('uid', userData.user.id);

    if (updateError) {
      throw updateError;
    }

    return Response.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    return serverError('POST_AUTH_COMPLETE_INVITE', error);
  }
}
