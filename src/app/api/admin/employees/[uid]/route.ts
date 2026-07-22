import { NextRequest } from 'next/server';
import { z } from 'zod';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { badRequest, serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  EMPLOYEE_AREA_VALUES,
  EMPLOYEE_ROLE_VALUES,
  EMPLOYEE_SHIFT_VALUES,
} from '@/features/admin/shared/employeeOptions';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ uid: string }>;
};

const UpdateEmployeeSchema = z.object({
  displayName: z.string().trim().min(3).max(80),
  role: z.enum(EMPLOYEE_ROLE_VALUES),
  area: z.enum(EMPLOYEE_AREA_VALUES),
  shift: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.enum(EMPLOYEE_SHIFT_VALUES).nullable()
  ),
});

const EmployeeActionSchema = z.object({
  action: z.enum(['resendInvite', 'activate', 'disable']),
});
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const { uid } = await context.params;
    const body = await request.json().catch(() => ({}));
    const actionPayload = EmployeeActionSchema.safeParse(body);

    if (actionPayload.success) {
      return runEmployeeAction(request, uid, actionPayload.data.action);
    }

    const parsed = UpdateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Datos de empleado invalidos.', parsed.error.flatten().fieldErrors);
    }

    const employee = parsed.data;
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        display_name: employee.displayName,
        role: employee.role,
        area: employee.area,
        shift: employee.shift,
        updated_at: new Date().toISOString(),
      })
      .eq('uid', uid);

    if (error) throw error;

    if (UUID_PATTERN.test(uid)) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        user_metadata: {
          display_name: employee.displayName,
          employee_role: employee.role,
          employee_area: employee.area,
          employee_shift: employee.shift,
          city_id: DEFAULT_CITY_ID,
        },
      });
      if (authError) console.warn('No se pudo actualizar metadata auth del empleado:', authError.message);
    }

    return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return serverError('PATCH_ADMIN_EMPLOYEE', error);
  }
}

async function runEmployeeAction(request: NextRequest, uid: string, action: z.infer<typeof EmployeeActionSchema>['action']) {
  if (action === 'resendInvite') {
    if (!UUID_PATTERN.test(uid)) {
      return Response.json(
        { success: false, error: 'Este empleado no usa invitacion Supabase.' },
        { status: 400 }
      );
    }

    const { data: employee, error } = await supabaseAdmin
      .from('users')
      .select('display_name, email, role, area, shift')
      .eq('uid', uid)
      .maybeSingle();

    if (error) throw error;
    if (!employee?.email) {
      return Response.json({ success: false, error: 'El empleado no tiene correo.' }, { status: 400 });
    }

    const redirectTo = new URL('/auth/crear-password', request.nextUrl.origin).toString();
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(employee.email, {
      redirectTo,
      data: {
        display_name: employee.display_name,
        employee_role: employee.role,
        employee_area: employee.area,
        employee_shift: employee.shift,
        city_id: DEFAULT_CITY_ID,
      },
    });

    if (inviteError) {
      return Response.json(
        { success: false, error: inviteError.message || 'No se pudo reenviar la invitacion.' },
        { status: inviteError.status || 400 }
      );
    }
  }

  if (action === 'activate' || action === 'disable') {
    const employeeStatus = action === 'activate' ? 'active' : 'disabled';
    const banDuration = action === 'activate' ? 'none' : '876000h';

    const { error } = await supabaseAdmin
      .from('users')
      .update({ employee_status: employeeStatus, updated_at: new Date().toISOString() })
      .eq('uid', uid);
    if (error) throw error;

    if (UUID_PATTERN.test(uid)) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(uid, {
        ban_duration: banDuration,
      });
      if (authError) console.warn('No se pudo cambiar bloqueo auth del empleado:', authError.message);
    }
  }

  return Response.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
