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

const CreateEmployeeSchema = z.object({
  displayName: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
  role: z.enum(EMPLOYEE_ROLE_VALUES),
  area: z.enum(EMPLOYEE_AREA_VALUES),
  shift: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.enum(EMPLOYEE_SHIFT_VALUES).nullable()
  ),
});

const EMPLOYEE_ROLES = ['admin', 'operator', 'official'];

type EmployeeRow = {
  uid: string;
  display_name: string | null;
  email: string | null;
  role: string;
  area: string | null;
  shift: string | null;
  employee_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function serializeEmployee(row: EmployeeRow) {
  return {
    uid: row.uid,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    area: row.area,
    shift: row.shift,
    employeeStatus: row.employee_status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const offset = Math.max(0, Number(request.nextUrl.searchParams.get('offset') || '0'));
    const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || '10')));
    const search = request.nextUrl.searchParams.get('search')?.trim();
    const role = request.nextUrl.searchParams.get('role');
    const status = request.nextUrl.searchParams.get('status');
    const area = request.nextUrl.searchParams.get('area');

    let query = supabaseAdmin
      .from('users')
      .select('uid, display_name, email, role, area, shift, employee_status, created_at, updated_at', { count: 'exact' })
      .in('role', EMPLOYEE_ROLES);

    if (search) query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    if (role && EMPLOYEE_ROLES.includes(role)) query = query.eq('role', role);
    if (status === 'active') query = query.or('employee_status.eq.active,employee_status.is.null');
    else if (status && ['pending', 'disabled'].includes(status)) query = query.eq('employee_status', status);
    else query = query.or('employee_status.is.null,employee_status.neq.disabled');
    if (area && EMPLOYEE_AREA_VALUES.includes(area as typeof EMPLOYEE_AREA_VALUES[number])) query = query.eq('area', area);

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw error;

    const { data: summaryRows, error: summaryError } = await supabaseAdmin
      .from('users')
      .select('role, employee_status, shift')
      .in('role', EMPLOYEE_ROLES);

    if (summaryError) throw summaryError;

    const summary = (summaryRows || []).reduce(
      (acc, row) => {
        acc.total += 1;
        if (row.role === 'operator' && row.employee_status === 'active') acc.activeOperators += 1;
        if (row.role === 'official' && row.employee_status !== 'disabled') acc.officials += 1;
        if (row.role === 'admin') acc.admins += 1;
        return acc;
      },
      { total: 0, activeOperators: 0, officials: 0, admins: 0 }
    );

    return Response.json(
      {
        success: true,
        data: (data || []).map((row) => serializeEmployee(row as EmployeeRow)),
        count: count || 0,
        summary,
      },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    return serverError('GET_ADMIN_EMPLOYEES', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => ({}));
    const parsed = CreateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Datos de empleado invalidos.', parsed.error.flatten().fieldErrors);
    }

    const employee = parsed.data;
    const redirectTo = new URL('/auth/crear-password', request.nextUrl.origin).toString();
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      employee.email,
      {
        redirectTo,
        data: {
          display_name: employee.displayName,
          employee_role: employee.role,
          employee_area: employee.area,
          employee_shift: employee.shift,
          city_id: DEFAULT_CITY_ID,
        },
      }
    );

    if (inviteError) {
      return Response.json(
        { success: false, error: inviteError.message || 'No se pudo enviar la invitacion.' },
        { status: inviteError.status || 400 }
      );
    }

    if (!inviteData.user?.id) {
      throw new Error('Supabase no devolvio el usuario invitado.');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          uid: inviteData.user.id,
          display_name: employee.displayName,
          email: employee.email,
          role: employee.role,
          area: employee.area,
          shift: employee.shift,
          employee_status: 'pending',
          employee_created_by: uid,
        },
        { onConflict: 'uid' }
      )
      .select('uid, display_name, email, role, area, shift, employee_status, created_at, updated_at')
      .single();

    if (profileError) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id);
      if (deleteError) {
        console.error('No se pudo limpiar el usuario invitado sin perfil:', deleteError);
      }
      throw profileError;
    }

    return Response.json(
      {
        success: true,
        message: 'Invitacion enviada.',
        data: profile,
      },
      {
        status: 201,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    return serverError('POST_ADMIN_EMPLOYEES', error);
  }
}
