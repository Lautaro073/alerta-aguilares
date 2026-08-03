'use client';

import { useDeferredValue, useState } from 'react';
import { ShieldCheck, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminDataTable, type AdminDataTableColumn } from '../components/AdminDataTable';
import { formatRecentDate, getInitials, Metric, PageTitle, Person } from '../components/AdminDashboardParts';
import { AdminTooltipButton } from '../components/AdminTooltipButton';
import { ADMIN_MOCK_TABLE_PAGE_SIZE } from '../constants/admin.constants';
import { getStoredPageSize, setStoredPageSize } from '../helpers/adminDashboardStorage';
import { useAdminUsers } from '../hooks/useAdminUsers';
import type { AdminPageSize } from '../types/admin.types';
import type { AdminCitizen, AdminCitizenStatus, CitizenActionHandlers } from '../types/adminUsers.types';

const PAGE_SIZE_STORAGE_KEY = 'admin.users.pageSize' as const;
const CITIZEN_COLUMNS: AdminDataTableColumn[] = [
  { key: 'citizen', label: 'Ciudadano' },
  { key: 'status', label: 'Estado', className: 'admin-citizen-status-column' },
  { key: 'reports', label: 'Alertas', className: 'center' },
  { key: 'registered', label: 'Registro' },
  { key: 'lastSeen', label: 'Ultimo acceso' },
  { key: 'consent', label: 'Terminos' },
  { key: 'actions', label: 'Acciones', className: 'right' },
];

export function UsersView() {
  const { user, profile } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(() =>
    getStoredPageSize(PAGE_SIZE_STORAGE_KEY, ADMIN_MOCK_TABLE_PAGE_SIZE),
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminCitizenStatus>('active');
  const [newThisMonthOnly, setNewThisMonthOnly] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery.trim());
  const { citizens, total, summary, loading, actions } = useAdminUsers({
    user,
    enabled: profile?.role === 'admin',
    page,
    pageSize,
    searchQuery: deferredSearch,
    statusFilter,
    newThisMonthOnly,
  });

  return (
    <>
      <PageTitle
        title="Gestion de usuarios"
        description="Cuentas vecinales registradas y actividad dentro del sistema."
        action={null}
      />
      <section className="admin-metrics">
        <Metric tone="primary" icon={<Users size={22} />} label="Ciudadanos" value={loading ? '...' : summary.total} active={statusFilter === 'ALL' && !newThisMonthOnly} onClick={() => { setStatusFilter('ALL'); setNewThisMonthOnly(false); setPage(1); }} />
        <Metric tone="secondary" icon={<UserCheck size={22} />} label="Activos" value={loading ? '...' : summary.active} active={statusFilter === 'active' && !newThisMonthOnly} onClick={() => { setStatusFilter('active'); setNewThisMonthOnly(false); setPage(1); }} />
        <Metric tone="tertiary" icon={<UserPlus size={22} />} label="Nuevos este mes" value={loading ? '...' : summary.newThisMonth} active={newThisMonthOnly} onClick={() => { setStatusFilter('ALL'); setNewThisMonthOnly(true); setPage(1); }} />
        <Metric tone="muted" icon={<UserX size={22} />} label="Bloqueados" value={loading ? '...' : summary.blocked} active={statusFilter === 'blocked' && !newThisMonthOnly} onClick={() => { setStatusFilter('blocked'); setNewThisMonthOnly(false); setPage(1); }} />
      </section>
      <AdminDataTable
        title="Usuarios registrados"
        columns={CITIZEN_COLUMNS}
        className="admin-full admin-citizens-table"
        height={720}
        width="100%"
        loading={loading}
        skeletonRows={pageSize}
        filters={(
          <div className="admin-filters">
            <input
              placeholder="Buscar ciudadano..."
              value={searchQuery}
              onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
            />
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value as 'ALL' | AdminCitizenStatus); setNewThisMonthOnly(false); setPage(1); }}
            >
              <option value="ALL">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="blocked">Bloqueados</option>
            </select>
            {(searchQuery || statusFilter !== 'active' || newThisMonthOnly) ? (
              <button type="button" onClick={() => { setSearchQuery(''); setStatusFilter('active'); setNewThisMonthOnly(false); setPage(1); }}>
                Limpiar
              </button>
            ) : null}
          </div>
        )}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: (nextPageSize) => {
            setStoredPageSize(PAGE_SIZE_STORAGE_KEY, nextPageSize);
            setPageSize(nextPageSize);
            setPage(1);
          },
        }}
      >
        {renderCitizenRows(citizens, actions)}
      </AdminDataTable>
    </>
  );
}

function renderCitizenRows(citizens: readonly AdminCitizen[], actions: CitizenActionHandlers) {
  if (citizens.length === 0) {
    return <tr><td colSpan={CITIZEN_COLUMNS.length} className="admin-empty-cell">Sin ciudadanos para mostrar</td></tr>;
  }

  return citizens.map((citizen) => {
    const name = citizen.displayName || citizen.email || 'Ciudadano';
    const blocked = citizen.status === 'blocked';

    return (
      <tr key={citizen.uid}>
        <td><Person initials={getInitials(name)} name={name} detail={citizen.email || 'Sin correo'} /></td>
        <td className="admin-citizen-status-column"><span className={`admin-dot ${blocked ? 'busy' : 'ok'}`} />{blocked ? 'Bloqueado' : 'Activo'}</td>
        <td className="center"><strong>{citizen.reportCount}</strong></td>
        <td>{formatDate(citizen.createdAt)}</td>
        <td>{formatRecentDate(citizen.lastSeenAt)}</td>
        <td><span className={`admin-status ${citizen.termsAcceptedAt ? 'resolved' : 'duplicate'}`}>{citizen.termsAcceptedAt ? 'Aceptados' : 'Pendientes'}</span></td>
        <td className="right">
          <AdminTooltipButton label={blocked ? 'Reactivar ciudadano' : 'Bloquear ciudadano'}>
            <button
              type="button"
              aria-label={blocked ? 'Reactivar ciudadano' : 'Bloquear ciudadano'}
              onClick={() => actions.setCitizenStatus(citizen, blocked ? 'active' : 'blocked')}
            >
              {blocked ? <ShieldCheck size={17} /> : <UserX size={17} />}
            </button>
          </AdminTooltipButton>
        </td>
      </tr>
    );
  });
}

function formatDate(value: string | null) {
  if (!value) return 'Sin datos';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
