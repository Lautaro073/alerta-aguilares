import { NextRequest } from 'next/server';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { verifyAdminRole } from '@/lib/server/adminAuth';
import { badRequest, serverError } from '@/lib/server/response';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const PRIORITIES = ['high', 'medium', 'low'] as const;

type Priority = (typeof PRIORITIES)[number];

function isConfigId(value: unknown) {
  return typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_]{1,63}$/.test(value) && value !== 'urban_guard';
}

function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && PRIORITIES.includes(value as Priority);
}

function isHexColor(value: unknown) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function normalizeConfigId(label: string, casing: 'upper' | 'lower') {
  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return casing === 'upper' ? normalized.toUpperCase() : normalized.toLowerCase();
}

async function areaExists(id: string) {
  const { data, error } = await supabaseAdmin
    .from('municipal_areas')
    .select('id')
    .eq('id', id)
    .eq('city_id', DEFAULT_CITY_ID)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function GET(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const [areasResult, categoriesResult] = await Promise.all([
      supabaseAdmin
        .from('municipal_areas')
        .select('id, label, responsible, is_active, updated_at')
        .eq('city_id', DEFAULT_CITY_ID)
        .neq('id', 'urban_guard')
        .order('sort_order', { ascending: true }),
      supabaseAdmin
        .from('incident_categories')
        .select('id, label, name, icon_name, color, default_area_id, priority, is_active, updated_at')
        .eq('city_id', DEFAULT_CITY_ID)
        .order('sort_order', { ascending: true }),
    ]);

    if (areasResult.error) throw areasResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    return Response.json({
      success: true,
      data: {
        areas: (areasResult.data || []).map((area) => ({
          id: area.id,
          label: area.label,
          responsible: area.responsible,
          isActive: area.is_active,
          updatedAt: area.updated_at,
        })),
        categories: (categoriesResult.data || []).map((category) => ({
          id: category.id,
          label: category.label,
          name: category.name,
          iconName: category.icon_name,
          color: category.color,
          defaultAreaId: category.default_area_id,
          priority: category.priority,
          isActive: category.is_active,
          updatedAt: category.updated_at,
        })),
      },
    });
  } catch (error) {
    return serverError('GET_ADMIN_CONFIG', error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null) as {
      type?: 'category' | 'area';
      id?: string;
      label?: string;
      name?: string;
      iconName?: string;
      color?: string;
      defaultAreaId?: string;
      priority?: string;
      isActive?: boolean;
      responsible?: string | null;
    } | null;

    if (!body?.type || !body.id) return badRequest('Solicitud invalida.');

    if (body.type === 'category') {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.defaultAreaId !== undefined) {
        const hasArea = isConfigId(body.defaultAreaId) && await areaExists(body.defaultAreaId);
        if (!hasArea) return badRequest('Area invalida.');
        patch.default_area_id = body.defaultAreaId;
      }
      if (body.priority !== undefined) {
        if (!isPriority(body.priority)) return badRequest('Prioridad invalida.');
        patch.priority = body.priority;
      }
      if (body.label !== undefined) {
        if (!body.label.trim()) return badRequest('Nombre invalido.');
        patch.label = body.label.trim();
      }
      if (body.name !== undefined) patch.name = body.name.trim() || body.label?.trim();
      if (body.iconName !== undefined) patch.icon_name = body.iconName.trim() || 'HelpCircle';
      if (body.color !== undefined) {
        if (!isHexColor(body.color)) return badRequest('Color invalido.');
        patch.color = body.color;
      }
      if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);

      const { error } = await supabaseAdmin
        .from('incident_categories')
        .update(patch)
        .eq('id', body.id)
        .eq('city_id', DEFAULT_CITY_ID);

      if (error) throw error;
    } else {
      if (!isConfigId(body.id)) return badRequest('Area invalida.');
      if (body.label !== undefined && !body.label.trim()) return badRequest('Nombre invalido.');

      const { error } = await supabaseAdmin
        .from('municipal_areas')
        .update({
          ...(body.label !== undefined ? { label: body.label.trim() } : {}),
          ...(body.responsible !== undefined ? { responsible: body.responsible } : {}),
          ...(body.isActive !== undefined ? { is_active: Boolean(body.isActive) } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.id)
        .eq('city_id', DEFAULT_CITY_ID);

      if (error) throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return serverError('PATCH_ADMIN_CONFIG', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { errorResponse } = await verifyAdminRole(request, ['admin']);
    if (errorResponse) return errorResponse;

    const body = await request.json().catch(() => null) as {
      type?: 'category' | 'area';
      label?: string;
      responsible?: string | null;
      name?: string;
      iconName?: string;
      color?: string;
      defaultAreaId?: string;
      priority?: string;
    } | null;

    const label = body?.label?.trim();
    if (!body?.type || !label) return badRequest('Completa los datos requeridos.');

    if (body.type === 'area') {
      const id = normalizeConfigId(label, 'lower');
      if (!isConfigId(id)) return badRequest('Nombre de area invalido.');

      const { error } = await supabaseAdmin
        .from('municipal_areas')
        .insert({
          id,
          city_id: DEFAULT_CITY_ID,
          label,
          responsible: body.responsible?.trim() || label,
          is_active: true,
          sort_order: 999,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === '23505') return badRequest('Ya existe un area con ese nombre.');
        throw error;
      }

      return Response.json({ success: true });
    }

    if (!isPriority(body.priority)) return badRequest('Prioridad invalida.');
    const hasDefaultArea = Boolean(body.defaultAreaId && isConfigId(body.defaultAreaId) && await areaExists(body.defaultAreaId));
    if (!hasDefaultArea) {
      return badRequest('Area invalida.');
    }

    const id = normalizeConfigId(label, 'upper');
    if (!isConfigId(id)) return badRequest('Nombre de categoria invalido.');

    const { error } = await supabaseAdmin
      .from('incident_categories')
      .insert({
        id,
        city_id: DEFAULT_CITY_ID,
        label,
        name: body.name?.trim() || label,
        icon_name: body.iconName?.trim() || 'HelpCircle',
        color: body.color?.trim() || '#075985',
        default_area_id: body.defaultAreaId,
        priority: body.priority,
        is_active: true,
        sort_order: 999,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      if (error.code === '23505') return badRequest('Ya existe una categoria con ese nombre.');
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return serverError('POST_ADMIN_CONFIG', error);
  }
}
