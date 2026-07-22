'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AuthUser } from '@/hooks/useAuth';
import type {
  AdminEmployee,
  AdminEmployeesResponse,
  AdminEmployeesSummary,
  EmployeeActionHandlers,
} from '../types/adminDashboard.types';

const EMPTY_EMPLOYEE_SUMMARY: AdminEmployeesSummary = {
  total: 0,
  activeOperators: 0,
  officials: 0,
  admins: 0,
};

export function useAdminEmployees({
  user,
  isAdmin,
  page,
  pageSize,
  searchQuery = '',
  roleFilter = 'ALL',
  statusFilter = 'ALL',
  areaFilter = 'ALL',
}: {
  user: AuthUser | null;
  isAdmin: boolean;
  page: number;
  pageSize: number;
  searchQuery?: string;
  roleFilter?: string;
  statusFilter?: string;
  areaFilter?: string;
}) {
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<AdminEmployeesSummary>(EMPTY_EMPLOYEE_SUMMARY);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    if (!user || !isAdmin) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        offset: String((page - 1) * pageSize),
        limit: String(pageSize),
      });
      if (searchQuery) params.set('search', searchQuery);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (areaFilter !== 'ALL') params.set('area', areaFilter);

      const response = await fetch(`/api/admin/employees?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error('No se pudieron cargar los empleados.');

      const result = await response.json() as AdminEmployeesResponse;
      setEmployees(result.data || []);
      setTotal(result.count || 0);
      setSummary(result.summary || EMPTY_EMPLOYEE_SUMMARY);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [areaFilter, isAdmin, page, pageSize, roleFilter, searchQuery, statusFilter, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEmployees();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchEmployees]);

  const requestEmployee = useCallback(async (employee: AdminEmployee, init: RequestInit) => {
    if (!user) return;

    const token = await user.getIdToken();
    const response = await fetch(`/api/admin/employees/${employee.uid}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
    const result = await response.json().catch(() => ({})) as { error?: string; success?: boolean };

    if (!response.ok || result.success === false) {
      throw new Error(result.error || 'No se pudo actualizar el empleado.');
    }

    await fetchEmployees();
  }, [fetchEmployees, user]);

  const employeeActions = {
    editEmployee: async (employee, values) => {
      try {
        await toast.promise(
          requestEmployee(employee, {
            method: 'PATCH',
            body: JSON.stringify(values),
          }),
          {
            loading: 'Guardando empleado...',
            success: 'Empleado actualizado.',
            error: (error) => error instanceof Error ? error.message : 'No se pudo editar el empleado.',
          }
        );
        return true;
      } catch {
        return false;
      }
    },
    resendInvite: async (employee) => {
      await toast.promise(
        requestEmployee(employee, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'resendInvite' }),
        }),
        {
          loading: 'Reenviando invitacion...',
          success: 'Invitacion reenviada.',
          error: (error) => error instanceof Error ? error.message : 'No se pudo reenviar la invitacion.',
        }
      );
    },
    setEmployeeStatus: async (employee, disabled) => {
      const label = disabled ? 'Desactivar' : 'Reactivar';
      toast(`${label} empleado?`, {
        action: {
          label,
          onClick: () => {
            const loadingLabel = disabled ? 'Desactivando' : 'Reactivando';
            void toast.promise(
              requestEmployee(employee, {
                method: 'PATCH',
                body: JSON.stringify({ action: disabled ? 'disable' : 'activate' }),
              }),
              {
                loading: `${loadingLabel} empleado...`,
                success: `Empleado ${disabled ? 'desactivado' : 'reactivado'}.`,
                error: (error) => error instanceof Error ? error.message : 'No se pudo cambiar el estado.',
              }
            );
          },
        },
      });
    },
  } satisfies EmployeeActionHandlers;

  return { employees, total, summary, loading, fetchEmployees, employeeActions };
}

