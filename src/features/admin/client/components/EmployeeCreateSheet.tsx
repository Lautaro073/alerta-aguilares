'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  EMPLOYEE_AREA_OPTIONS,
  EMPLOYEE_ROLE_OPTIONS,
  EMPLOYEE_SHIFT_OPTIONS,
} from '../../shared/employeeOptions';
import { AdminSheetForm, type AdminSheetFormAction, type AdminSheetFormField } from './AdminSheetForm';

const EMPLOYEE_FORM_FIELDS: readonly AdminSheetFormField[] = [
  {
    name: 'displayName',
    label: 'Nombre completo',
    placeholder: 'Ej. Mariana Costa',
    autoComplete: 'name',
    required: true,
  },
  {
    name: 'email',
    label: 'Correo',
    type: 'email',
    placeholder: 'empleado@aguilares.gob.ar',
    autoComplete: 'email',
    required: true,
    description: 'A este correo se enviara el link para definir la contraseña.',
  },
  {
    kind: 'select',
    name: 'role',
    label: 'Rol del sistema',
    placeholder: 'Seleccionar rol',
    required: true,
    options: EMPLOYEE_ROLE_OPTIONS,
  },
  {
    kind: 'select',
    name: 'area',
    label: 'Area',
    placeholder: 'Seleccionar area',
    required: true,
    options: EMPLOYEE_AREA_OPTIONS,
  },
  {
    kind: 'select',
    name: 'shift',
    label: 'Turno',
    placeholder: 'Seleccionar turno',
    options: EMPLOYEE_SHIFT_OPTIONS,
  },
];

export function EmployeeCreateSheet({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const actions = useMemo<readonly AdminSheetFormAction[]>(() => [
    { label: 'Cancelar', variant: 'outline', close: true, disabled: submitting },
    { label: submitting ? 'Creando...' : 'Crear empleado', type: 'submit', disabled: submitting },
  ], [submitting]);

  const handleSubmit = useCallback(async (values: Record<string, string>) => {
    if (!user) {
      setError('Sesion invalida. Volve a iniciar sesion.');
      return false;
    }

    setError(null);
    setSubmitting(true);
    const promise = (async () => {
      const token = await user.getIdToken();
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'No se pudo crear el empleado.');
      }

      onCreated?.();
    })();

    toast.promise(promise, {
      loading: 'Creando empleado...',
      success: 'Empleado creado. Se envio el correo de activacion.',
      error: (error) => error instanceof Error ? error.message : 'No se pudo crear el empleado.',
    });

    try {
      await promise;
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo crear el empleado.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [onCreated, user]);

  return (
    <AdminSheetForm
      trigger={(
        <Button type="button" className='cursor-pointer'>
          <UserPlus data-icon="inline-start" />
          Crear empleado
        </Button>
      )}
      title="Crear empleado"
      description="El empleado quedara pendiente de activacion hasta que defina su contraseña desde el correo."
      fields={EMPLOYEE_FORM_FIELDS}
      actions={actions}
      notice={error ? <p className="admin-sheet-error">{error}</p> : null}
      onOpenChange={() => setError(null)}
      onSubmit={handleSubmit}
    />
  );
}
