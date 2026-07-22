'use client';

import { useState } from 'react';
import { Badge, CheckCircle2, Mail, Pencil, ShieldAlert, UserCheck, UserX, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/lib/constants/categories';
import { AdminDataTable, type AdminDataTableColumn } from '../components/AdminDataTable';
import { AdminSheetForm, type AdminSheetFormField } from '../components/AdminSheetForm';
import { AdminTooltipButton } from '../components/AdminTooltipButton';
import { EmployeeCreateSheet } from '../components/EmployeeCreateSheet';
import { formatRecentDate, getInitials, getOptionLabel, Metric, PageTitle, Person, SideCard, Timeline } from '../components/AdminDashboardParts';
import { ADMIN_MOCK_TABLE_PAGE_SIZE } from '../constants/admin.constants';
import { getStoredPageSize, setStoredPageSize } from '../helpers/adminDashboardStorage';
import { useAdminEmployees } from '../hooks/useAdminEmployees';
import type { AdminPageSize, AdminReportListItem } from '../types/admin.types';
import type { AdminEmployee, EmployeeActionHandlers } from '../types/adminDashboard.types';
import { EMPLOYEE_AREA_OPTIONS, EMPLOYEE_ROLE_OPTIONS, EMPLOYEE_SHIFT_OPTIONS } from '../../shared/employeeOptions';

const PAGE_SIZE_STORAGE_KEYS = { employees: 'admin.employees.pageSize' } as const;

const EMPLOYEE_COLUMNS: AdminDataTableColumn[] = [
  { key: 'employee', label: 'Empleado' },
  { key: 'area', label: 'Area' },
  { key: 'id', label: 'ID Interno' },
  { key: 'employeeStatus', label: 'Estado', className: 'admin-employee-status-column' },
  { key: 'shift', label: 'Turno' },
  { key: 'role', label: 'Rol' },
  { key: 'last', label: 'Ult. Conexion', className: 'right' },
  { key: 'actions', label: 'Acciones', className: 'right' },
];


export function EmployeesView() {
  const { user, isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(() => getStoredPageSize(PAGE_SIZE_STORAGE_KEYS.employees, ADMIN_MOCK_TABLE_PAGE_SIZE));
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const { employees, total, summary, loading, fetchEmployees, employeeActions } = useAdminEmployees({
    user,
    isAdmin,
    page,
    pageSize,
    searchQuery,
    roleFilter,
    statusFilter,
    areaFilter,
  });

  return (
    <>
      <PageTitle title="Gestion de Empleados" description="Personal interno y roles del panel municipal." action={<EmployeeCreateSheet onCreated={fetchEmployees} />} />
      <section className="admin-metrics">
        <Metric tone="primary" icon={<Badge size={22} />} label="Empleados totales" value={loading ? '...' : summary.total} />
        <Metric tone="secondary" icon={<CheckCircle2 size={22} />} label="Operarios activos" value={loading ? '...' : summary.activeOperators} />
        <Metric tone="primary" icon={<ShieldAlert size={22} />} label="Funcionarios" value={loading ? '...' : summary.officials} />
        <Metric tone="muted" icon={<Users size={22} />} label="Administradores" value={loading ? '...' : summary.admins} />
      </section>
      <div className="admin-dashboard-grid">
        <AdminDataTable
          title="Personal municipal"
          columns={EMPLOYEE_COLUMNS}
          className="admin-alerts"
          height={760}
          width="100%"
          loading={loading}
          skeletonRows={pageSize}
          filters={
            <div className="admin-filters">
              <input placeholder="Buscar empleado..." value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }} />
              <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1); }}>
                <option value="ALL">Todos los roles</option>
                {EMPLOYEE_ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                <option value="ALL">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="pending">Pendientes</option>
                <option value="disabled">Desactivados</option>
              </select>
              <select value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }}>
                <option value="ALL">Todas las areas</option>
                {EMPLOYEE_AREA_OPTIONS.map((area) => <option key={area.value} value={area.value}>{area.label}</option>)}
              </select>
              {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || areaFilter !== 'ALL') && (
                <button type="button" onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); setStatusFilter('ALL'); setAreaFilter('ALL'); setPage(1); }}>Limpiar</button>
              )}
            </div>
          }
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: (nextPageSize) => {
              setStoredPageSize(PAGE_SIZE_STORAGE_KEYS.employees, nextPageSize);
              setPageSize(nextPageSize);
              setPage(1);
            },
          }}
        >
          {employeeRows(employees, employeeActions)}
        </AdminDataTable>
        <aside className="admin-side-stack admin-employees-side-stack">
          <SideCard title="Actividad reciente" className="admin-activity-card">
            <Timeline rows={getEmployeeActivity(employees)} className="admin-activity-list" />
          </SideCard>
          <SideCard title="Permisos por rol">
            <Timeline rows={['Administrador: usuarios, roles y configuracion', 'Operario de campo: carga alertas en calle', 'Funcionario municipal: seguimiento, derivacion e indicadores']} />
          </SideCard>
        </aside>
      </div>
    </>
  );
}


export function employeeRows(rows: readonly AdminEmployee[], actions?: EmployeeActionHandlers) {
  return rows.length > 0 ? rows.map((employee) => {
    const name = employee.displayName || employee.email || 'Empleado';
    const area = getOptionLabel(EMPLOYEE_AREA_OPTIONS, employee.area) || 'Sin area';
    const shift = getOptionLabel(EMPLOYEE_SHIFT_OPTIONS, employee.shift) || 'Sin turno';
    const role = getOptionLabel(EMPLOYEE_ROLE_OPTIONS, employee.role) || employee.role;
    const status = getEmployeeStatus(employee.employeeStatus);

    return (
      <tr key={employee.uid}>
        <td><Person initials={getInitials(name)} name={name} detail={employee.email || area} /></td>
        <td>{area}</td>
        <td className="mono">#{employee.uid.slice(0, 8)}</td>
        <td className="admin-employee-status-column"><span className={`admin-dot ${employee.employeeStatus === 'active' ? 'ok' : 'busy'}`} />{status}</td>
        <td>{shift}</td>
        <td><span className="admin-status primary">{role}</span></td>
        <td className="right mono">{formatRecentDate(employee.updatedAt || employee.createdAt)}</td>
        <td className="right">{actions ? <EmployeeActions employee={employee} actions={actions} /> : <div className="admin-actions" />}</td>
      </tr>
    );
  }) : <tr><td colSpan={EMPLOYEE_COLUMNS.length} className="admin-empty-cell">Sin empleados para mostrar</td></tr>;
}

export function getHomeActivityRows(reports: AdminReportListItem[], employees: AdminEmployee[]) {
  return [
    ...reports.slice(0, 5).map((report) => ({
      date: report.updatedAt || report.createdAt,
      label: `Alerta ${CATEGORIES[report.category]?.label || report.category}: ${report.title || 'Sin titulo'} - ${formatRecentDate(report.updatedAt || report.createdAt)}`,
    })),
    ...employees.slice(0, 5).map((employee) => ({
      date: employee.updatedAt || employee.createdAt || '',
      label: `Empleado ${employee.displayName || employee.email || 'sin nombre'} figura como ${getOptionLabel(EMPLOYEE_ROLE_OPTIONS, employee.role) || employee.role} - ${formatRecentDate(employee.updatedAt || employee.createdAt)}`,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map((activity) => activity.label);
}

function EmployeeActions({ employee, actions }: { employee: AdminEmployee; actions: EmployeeActionHandlers }) {
  const disabled = employee.employeeStatus === 'disabled';
  const pending = employee.employeeStatus === 'pending';

  return (
    <div className="admin-actions">
      <EmployeeEditSheet employee={employee} onSubmit={(values) => actions.editEmployee(employee, values)} />
      {pending && (
        <AdminTooltipButton label="Reenviar invitacion">
          <button type="button" aria-label="Reenviar invitacion" onClick={() => actions.resendInvite(employee)}>
            <Mail size={16} />
          </button>
        </AdminTooltipButton>
      )}
      <AdminTooltipButton label={disabled ? 'Reactivar empleado' : 'Desactivar empleado'}>
        <button type="button" aria-label={disabled ? 'Reactivar empleado' : 'Desactivar empleado'} onClick={() => actions.setEmployeeStatus(employee, !disabled)}>
          {disabled ? <UserCheck size={16} /> : <UserX size={16} />}
        </button>
      </AdminTooltipButton>
    </div>
  );
}

function EmployeeEditSheet({
  employee,
  onSubmit,
}: {
  employee: AdminEmployee;
  onSubmit: (values: Record<string, string>) => Promise<boolean>;
}) {
  const fields = [
    {
      name: 'displayName',
      label: 'Nombre completo',
      defaultValue: employee.displayName || '',
      required: true,
    },
    {
      kind: 'select',
      name: 'role',
      label: 'Rol del sistema',
      defaultValue: employee.role,
      required: true,
      options: EMPLOYEE_ROLE_OPTIONS,
    },
    {
      kind: 'select',
      name: 'area',
      label: 'Area',
      defaultValue: employee.area || 'monitoring',
      required: true,
      options: EMPLOYEE_AREA_OPTIONS,
    },
    {
      kind: 'select',
      name: 'shift',
      label: 'Turno',
      options: EMPLOYEE_SHIFT_OPTIONS,
      ...(employee.shift ? { defaultValue: employee.shift } : {}),
    },
  ] satisfies AdminSheetFormField[];

  return (
    <AdminSheetForm
      trigger={(
        <button type="button" aria-label="Editar empleado">
          <Pencil size={16} />
        </button>
      )}
      triggerTooltip="Editar empleado"
      title="Editar empleado"
      {...(employee.email ? { description: employee.email } : {})}
      fields={fields}
      actions={[
        { label: 'Cancelar', variant: 'outline', close: true },
        { label: 'Guardar cambios', type: 'submit' },
      ]}
      onSubmit={onSubmit}
    />
  );
}

function getEmployeeStatus(status: AdminEmployee['employeeStatus']) {
  if (status === 'pending') return 'Pendiente';
  if (status === 'disabled') return 'Desactivado';
  return 'Activo';
}

function getEmployeeActivity(employees: AdminEmployee[]) {
  const recentLimit = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentEmployees = employees.filter((employee) => {
    const value = employee.updatedAt || employee.createdAt;
    return value ? new Date(value).getTime() >= recentLimit : false;
  });

  if (recentEmployees.length === 0) return ['No hay actividad reciente'];

  return recentEmployees
    .sort((left, right) => getEmployeeTime(right) - getEmployeeTime(left))
    .map((employee) => {
    const name = employee.displayName || employee.email || 'Empleado';
    const role = getOptionLabel(EMPLOYEE_ROLE_OPTIONS, employee.role) || employee.role;
    const activityDate = employee.updatedAt || employee.createdAt;
    const createdAt = employee.createdAt ? new Date(employee.createdAt).getTime() : 0;
    const updatedAt = employee.updatedAt ? new Date(employee.updatedAt).getTime() : 0;
    const activity = updatedAt > createdAt + 60_000
      ? 'inicio sesion'
      : `fue creado como ${role}`;

    return `${name} ${activity} - ${formatRecentDate(activityDate)}`;
  });
}

function getEmployeeTime(employee: AdminEmployee) {
  const value = employee.updatedAt || employee.createdAt;
  return value ? new Date(value).getTime() : 0;
}

