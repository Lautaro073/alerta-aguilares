'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CircleHelp, LogOut, Map } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants/categories';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { AuthUser } from '@/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { startSystemTour, startSystemTourOnce } from '@/lib/onboarding/systemTour';
import type { AdminReportListItem } from '../types/admin.types';
import type { AdminNotification, AdminProfile, AdminReportsResponse, ReportsViewProps } from '../types/adminDashboard.types';
import { getInitials } from './AdminDashboardParts';

const NEW_REPORT_NOTIFICATION_WINDOW_MS = 5 * 60 * 1000;
const NEW_REPORT_UPDATE_DRIFT_MS = 10_000;

export function AdminNotifications({ user }: { user: AuthUser | null }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabaseBrowser
      .channel(`admin-feed:${DEFAULT_CITY_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_feeds',
          filter: `city_id=eq.${DEFAULT_CITY_ID}`,
        },
        async (payload) => {
          const reportId = (payload.new as { last_report_id?: string | null } | null)?.last_report_id;
          const notificationId = reportId || crypto.randomUUID();
          const report = reportId ? await fetchAdminReportNotification(user, reportId) : null;
          if (report && !isNewReportNotification(report)) return;

          const categoryLabel = report ? CATEGORIES[report.category]?.label : null;

          setNotifications((current) => [
            {
              id: notificationId,
              title: report && categoryLabel ? `${categoryLabel}: ${report.title}` : 'Nueva alerta registrada',
              detail: report?.locationLabel || 'Revisar prioridad y asignacion en el panel',
              createdAt: new Date(),
            },
            ...current.filter((notification) => notification.id !== notificationId),
          ].slice(0, 6));
        }
      )
      .subscribe();

    return () => {
      void supabaseBrowser.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="admin-notifications">
      <button
        aria-label="Notificaciones"
        className={notifications.length > 0 ? 'has-notifications' : ''}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={18} />
        {notifications.length > 0 && <span>{notifications.length}</span>}
      </button>
      {open && (
        <div className="admin-notification-menu">
          <div className="admin-notification-head">
            <div>
              <h3>Notificaciones</h3>
              <p>{notifications.length > 0 ? `${notifications.length} sin leer` : 'Todo al dia'}</p>
            </div>
            {notifications.length > 0 && (
              <button type="button" onClick={() => setNotifications([])}>Limpiar</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="admin-notification-empty">
              <Bell size={18} />
              <span>Sin alertas nuevas</span>
            </div>
          ) : notifications.map((notification) => (
            <div key={notification.id} className="admin-notification-item">
              <span />
              <div>
                <strong>{notification.title}</strong>
                <small>{notification.detail}</small>
              </div>
              <time>{formatNotificationTime(notification.createdAt)}</time>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isNewReportNotification(report: AdminReportListItem) {
  const createdAt = new Date(report.createdAt).getTime();
  const updatedAt = new Date(report.updatedAt).getTime();

  if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) return false;

  return Date.now() - createdAt <= NEW_REPORT_NOTIFICATION_WINDOW_MS
    && Math.abs(updatedAt - createdAt) <= NEW_REPORT_UPDATE_DRIFT_MS;
}

function formatNotificationTime(date: Date) {
  const seconds = Math.max(1, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Ahora';
  return `Hace ${Math.round(seconds / 60)} min`;
}

async function fetchAdminReportNotification(user: AuthUser, reportId: string) {
  try {
    const token = await user.getIdToken();
    const params = new URLSearchParams({
      offset: '0',
      limit: '1',
      status: 'ALL',
      category: 'ALL',
      timeframe: 'all',
      sort: 'recent',
      search: reportId,
    });
    const response = await fetch(`/api/admin/reports?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const result = await response.json() as AdminReportsResponse;
    return result.data?.[0] || null;
  } catch (error) {
    console.error('Error al cargar notificacion admin:', error);
    return null;
  }
}

export function AdminProfileCard({ profile, user, role }: { profile: AdminProfile | null; user: AuthUser | null; role: ReportsViewProps['role'] }) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName = profile?.displayName || user?.displayName || user?.email || 'Administrador';
  const detail = profile?.email || user?.email || 'Centro de Monitoreo';
  const avatarUrl = profile?.photoURL || user?.photoURL;

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    startSystemTourOnce('admin', role);
  }, [role]);

  return (
    <div className="admin-profile-menu" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="admin-profile"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <div>
              <strong>{displayName}</strong>
              <small>{detail}</small>
            </div>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="admin-avatar" src={avatarUrl} alt="" />
            ) : (
              <div className="admin-avatar">{getInitials(displayName)}</div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Abrir menu de cuenta</TooltipContent>
      </Tooltip>

      {open && (
        <div className="admin-profile-dropdown">
          <Link
            href="/"
            className="admin-profile-dropdown-item"
            onClick={() => setOpen(false)}
          >
            <Map size={13} className="shrink-0" />
            <span>Ir al mapa</span>
          </Link>
          <button
            type="button"
            className="admin-profile-dropdown-item"
            onClick={() => {
              setOpen(false);
              startSystemTour('admin', role);
            }}
          >
            <CircleHelp size={13} className="shrink-0" />
            <span>Recorrido del sistema</span>
          </button>
          <button
            type="button"
            className="admin-profile-dropdown-item danger"
            onClick={() => { setOpen(false); void signOut(); }}
          >
            <LogOut size={13} className="shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
