'use client';

import { useCallback, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AdminSheetForm, type AdminSheetFormAction, type AdminSheetFormField } from './AdminSheetForm';
import type { AdminConfigArea, AdminConfigCategory, AdminConfigMutation } from '../types/adminConfig.types';

const PRIORITY_OPTIONS = [
  { label: 'Alta', value: 'high' },
  { label: 'Media', value: 'medium' },
  { label: 'Baja', value: 'low' },
];

export function ConfigCategoryCreateSheet({
  areas,
  onCreate,
}: {
  areas: AdminConfigArea[];
  onCreate: AdminConfigMutation;
}) {
  const [submitting, setSubmitting] = useState(false);
  const fields = useMemo<readonly AdminSheetFormField[]>(() => [
    { name: 'label', label: 'Categoria', placeholder: 'Ej. Higiene urbana', required: true },
    { name: 'name', label: 'Titulo interno', placeholder: 'Ej. Incidente de higiene urbana' },
    { kind: 'icon', name: 'iconName', label: 'Icono', defaultValue: 'AlertTriangle', required: true },
    { kind: 'color', name: 'color', label: 'Color', defaultValue: '#075985', required: true },
    {
      kind: 'select',
      name: 'defaultAreaId',
      label: 'Area por defecto',
      placeholder: 'Seleccionar area',
      required: true,
      options: areas.map((area) => ({ label: area.label, value: area.id })),
    },
    {
      kind: 'select',
      name: 'priority',
      label: 'Prioridad inicial',
      placeholder: 'Seleccionar prioridad',
      required: true,
      defaultValue: 'medium',
      options: PRIORITY_OPTIONS,
    },
  ], [areas]);
  const actions = useMemo<readonly AdminSheetFormAction[]>(() => [
    { label: 'Cancelar', variant: 'outline', close: true, disabled: submitting },
    { label: submitting ? 'Creando...' : 'Crear categoria', type: 'submit', disabled: submitting },
  ], [submitting]);

  const handleSubmit = useCallback(async (values: Record<string, string>) => {
    setSubmitting(true);
    const promise = onCreate({ type: 'category', ...values });
    toast.promise(promise, {
      loading: 'Creando categoria...',
      success: 'Categoria creada.',
      error: (error) => error instanceof Error ? error.message : 'No se pudo crear la categoria.',
    });

    try {
      await promise;
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [onCreate]);

  return (
    <AdminSheetForm
      trigger={<button type="button"><Plus size={16} /> Nueva categoria</button>}
      title="Nueva categoria"
      description="Define como se clasifica la alerta y a que area se deriva por defecto."
      fields={fields}
      actions={actions}
      onSubmit={handleSubmit}
    />
  );
}

export function ConfigAreaCreateSheet({ onCreate }: { onCreate: AdminConfigMutation }) {
  const [submitting, setSubmitting] = useState(false);
  const fields = useMemo<readonly AdminSheetFormField[]>(() => [
    { name: 'label', label: 'Area municipal', placeholder: 'Ej. Higiene urbana', required: true },
    { name: 'responsible', label: 'Responsable', placeholder: 'Ej. Direccion de servicios publicos' },
  ], []);
  const actions = useMemo<readonly AdminSheetFormAction[]>(() => [
    { label: 'Cancelar', variant: 'outline', close: true, disabled: submitting },
    { label: submitting ? 'Creando...' : 'Crear area', type: 'submit', disabled: submitting },
  ], [submitting]);

  const handleSubmit = useCallback(async (values: Record<string, string>) => {
    setSubmitting(true);
    const promise = onCreate({ type: 'area', ...values });
    toast.promise(promise, {
      loading: 'Creando area...',
      success: 'Area creada.',
      error: (error) => error instanceof Error ? error.message : 'No se pudo crear el area.',
    });

    try {
      await promise;
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [onCreate]);

  return (
    <AdminSheetForm
      trigger={<button type="button" className="secondary"><Plus size={16} /> Nueva area</button>}
      title="Nueva area"
      description="Agrega un area municipal disponible para derivacion y configuracion interna."
      fields={fields}
      actions={actions}
      onSubmit={handleSubmit}
    />
  );
}

export function ConfigCategoryEditSheet({
  areas,
  category,
  onPatch,
}: {
  areas: AdminConfigArea[];
  category: AdminConfigCategory;
  onPatch: AdminConfigMutation;
}) {
  const [submitting, setSubmitting] = useState(false);
  const fields = useMemo<readonly AdminSheetFormField[]>(() => [
    { name: 'label', label: 'Categoria', defaultValue: category.label, required: true },
    { name: 'name', label: 'Titulo interno', defaultValue: category.name },
    { kind: 'icon', name: 'iconName', label: 'Icono', defaultValue: category.iconName, required: true },
    { kind: 'color', name: 'color', label: 'Color', defaultValue: category.color, required: true },
    {
      kind: 'select',
      name: 'defaultAreaId',
      label: 'Area por defecto',
      required: true,
      defaultValue: category.defaultAreaId || areas[0]?.id || '',
      options: areas.map((area) => ({ label: area.label, value: area.id })),
    },
    {
      kind: 'select',
      name: 'priority',
      label: 'Prioridad',
      required: true,
      defaultValue: category.priority,
      options: PRIORITY_OPTIONS,
    },
  ], [areas, category]);
  const actions = useMemo<readonly AdminSheetFormAction[]>(() => [
    { label: 'Cancelar', variant: 'outline', close: true, disabled: submitting },
    { label: submitting ? 'Guardando...' : 'Guardar cambios', type: 'submit', disabled: submitting },
  ], [submitting]);

  const handleSubmit = useCallback(async (values: Record<string, string>) => {
    setSubmitting(true);
    const promise = onPatch({ type: 'category', id: category.id, ...values });
    toast.promise(promise, {
      loading: 'Guardando categoria...',
      success: 'Categoria actualizada.',
      error: (error) => error instanceof Error ? error.message : 'No se pudo guardar la categoria.',
    });

    try {
      await promise;
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [category.id, onPatch]);

  return (
    <AdminSheetForm
      trigger={<button type="button"><Pencil size={16} /></button>}
      triggerTooltip="Editar categoria"
      title="Editar categoria"
      description="Actualiza la clasificacion, icono, color y derivacion por defecto."
      fields={fields}
      actions={actions}
      onSubmit={handleSubmit}
    />
  );
}

export function ConfigAreaEditSheet({
  area,
  onPatch,
}: {
  area: AdminConfigArea;
  onPatch: AdminConfigMutation;
}) {
  const [submitting, setSubmitting] = useState(false);
  const fields = useMemo<readonly AdminSheetFormField[]>(() => [
    { name: 'label', label: 'Area municipal', defaultValue: area.label, required: true },
    { name: 'responsible', label: 'Responsable', defaultValue: area.responsible || '' },
  ], [area]);
  const actions = useMemo<readonly AdminSheetFormAction[]>(() => [
    { label: 'Cancelar', variant: 'outline', close: true, disabled: submitting },
    { label: submitting ? 'Guardando...' : 'Guardar cambios', type: 'submit', disabled: submitting },
  ], [submitting]);

  const handleSubmit = useCallback(async (values: Record<string, string>) => {
    setSubmitting(true);
    const promise = onPatch({ type: 'area', id: area.id, ...values });
    toast.promise(promise, {
      loading: 'Guardando area...',
      success: 'Area actualizada.',
      error: (error) => error instanceof Error ? error.message : 'No se pudo guardar el area.',
    });

    try {
      await promise;
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [area.id, onPatch]);

  return (
    <AdminSheetForm
      trigger={<button type="button"><Pencil size={16} /></button>}
      triggerTooltip="Editar area"
      title="Editar area"
      description="Actualiza el nombre visible y el responsable administrativo."
      fields={fields}
      actions={actions}
      onSubmit={handleSubmit}
    />
  );
}
