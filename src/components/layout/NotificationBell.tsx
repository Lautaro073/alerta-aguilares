'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  ShieldOff,
  AlertTriangle,
} from 'lucide-react';

type PermissionState = 'default' | 'granted' | 'denied';
type BellState = 'unsupported' | 'loading' | 'idle' | 'subscribed' | 'blocked';

interface ToastData {
  icon: ReactNode;
  text: string;
  type: 'success' | 'error' | 'info';
}

/**
 * Botón flotante de campana de notificaciones push vía Firebase Cloud Messaging.
 * Gestiona los 4 estados del ciclo de vida del permiso de notificaciones del navegador.
 */
export default function NotificationBell() {
  const [bellState, setBellState] = useState<BellState>('loading');
  const [isAnimating, setIsAnimating] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastData | null>(null);

  // Verificar soporte y estado inicial del permiso de notificaciones
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setBellState('unsupported');
      return;
    }

    const permission = Notification.permission as PermissionState;
    if (permission === 'denied') {
      setBellState('blocked');
    } else if (permission === 'granted') {
      // Permiso ya concedido: registrar el token FCM silenciosamente en background
      // para garantizar que siempre esté guardado en Firestore (idempotente)
      setBellState('subscribed');
      registerTokenSilently();
    } else {
      setBellState('idle');
    }
  }, []);

  // Registra el token FCM en Firestore de forma silenciosa (sin UI feedback).
  // Seguro de llamar múltiples veces: getToken() es idempotente y el endpoint usa merge:true.
  const registerTokenSilently = async () => {
    try {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) return;

      const { getMessaging, getToken } = await import('firebase/messaging');
      const { app } = await import('@/lib/firebase/client');

      const messaging = getMessaging(app);
      const swRegistration = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration });
      if (!token) return;

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch {
      // Error silencioso — no interrumpe la UI
    }
  };

  // Mostrar un toast de retroalimentación temporal
  const showToast = useCallback((icon: ReactNode, text: string, type: ToastData['type']) => {
    setToastMessage({ icon, text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Flujo completo de suscripción a notificaciones push via FCM
  const handleSubscribe = useCallback(async () => {
    if (bellState === 'subscribed') {
      showToast(<BellRing size={13} />, 'Ya estás suscrito a las alertas.', 'info');
      return;
    }

    if (bellState === 'blocked') {
      showToast(
        <ShieldOff size={13} />,
        'Las notificaciones están bloqueadas. Actívalas desde la configuración de tu navegador.',
        'info'
      );
      return;
    }

    if (bellState === 'unsupported') {
      showToast(
        <AlertTriangle size={13} />,
        'Tu navegador no soporta notificaciones push.',
        'error'
      );
      return;
    }

    setBellState('loading');
    setIsAnimating(true);

    try {
      // 1. Solicitar permiso nativo al usuario
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setBellState('blocked');
        showToast(<BellOff size={13} />, 'Notificaciones bloqueadas. No recibirás alertas.', 'info');
        setIsAnimating(false);
        return;
      }

      // 2. Verificar que la VAPID key esté configurada
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        setBellState('subscribed');
        showToast(
          <Info size={13} />,
          'Notificaciones activadas.',
          'info'
        );
        setIsAnimating(false);
        return;
      }

      // 3. Importar Firebase Messaging dinámicamente (sólo en client)
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { app } = await import('@/lib/firebase/client');

      const messaging = getMessaging(app);

      // 4. Obtener el service worker activo y pasárselo a getToken()
      //    para que Firebase use nuestro sw.js en lugar de buscar firebase-messaging-sw.js
      const swRegistration = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration,
      });

      if (!token) {
        throw new Error('No se pudo obtener el token FCM.');
      }

      // 5. Registrar el token en el backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar el token en el servidor.');
      }

      setBellState('subscribed');
      showToast(
        <CheckCircle2 size={13} />,
        '¡Excelente! Recibirás alertas del mapa en tiempo real.',
        'success'
      );
    } catch (err: unknown) {
      console.error('[NotificationBell] Error al suscribirse:', err);
      setBellState('idle');
      showToast(
        <XCircle size={13} />,
        'No se pudo activar las notificaciones. Inténtalo de nuevo.',
        'error'
      );
    } finally {
      setIsAnimating(false);
    }
  }, [bellState, showToast]);

  // Icono y estilo según el estado actual
  const renderIcon = () => {
    if (bellState === 'loading') {
      return <Loader2 size={15} className="animate-spin" />;
    }
    if (bellState === 'subscribed') {
      return <BellRing size={15} className={isAnimating ? 'animate-bell-ring' : ''} />;
    }
    if (bellState === 'blocked' || bellState === 'unsupported') {
      return <BellOff size={15} />;
    }
    return <Bell size={15} />;
  };

  const getButtonStyles = () => {
    const base = 'relative flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 cursor-pointer active:scale-95 overflow-hidden group/bell';

    switch (bellState) {
      case 'subscribed':
        return `${base} bg-accent/15 border-accent/50 text-accent hover:bg-accent/25 shadow-sm shadow-accent/20`;
      case 'blocked':
      case 'unsupported':
        return `${base} bg-surface-2 border-border text-muted cursor-not-allowed opacity-60`;
      case 'loading':
        return `${base} bg-surface-2 border-border text-muted pointer-events-none`;
      default:
        return `${base} bg-surface-2 border-border text-muted hover:border-accent/40 hover:text-accent hover:bg-accent/10`;
    }
  };

  const getTitle = () => {
    switch (bellState) {
      case 'subscribed': return 'Suscrito a alertas de Aguilares';
      case 'blocked': return 'Notificaciones bloqueadas por el navegador';
      case 'unsupported': return 'Tu navegador no soporta notificaciones';
      case 'loading': return 'Activando notificaciones...';
      default: return 'Activar alertas push';
    }
  };

  return (
    <>
      <div className="relative shrink-0">
        <button
          id="notification-bell-btn"
          onClick={handleSubscribe}
          className={getButtonStyles()}
          title={getTitle()}
          aria-label={getTitle()}
          disabled={bellState === 'loading' || bellState === 'unsupported'}
        >
          {/* Halo de pulso suave cuando está suscrito */}
          {bellState === 'subscribed' && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-accent pointer-events-none" />
          )}

          {/* Halo de pulso lento cuando está en idle invitando a suscribirse */}
          {bellState === 'idle' && (
            <span className="absolute inset-0 rounded-full bg-accent/10 scale-0 group-hover/bell:scale-110 transition-transform duration-500 pointer-events-none" />
          )}

          {renderIcon()}
        </button>

        {/* Toast de retroalimentación */}
        {toastMessage && (
          <div
            className={`absolute top-full right-0 mt-2 z-[1100] min-w-[220px] max-w-[280px] px-3.5 py-2.5 rounded-xl text-xs font-outfit font-semibold shadow-glow border backdrop-blur-md animate-scale-in leading-snug flex items-start gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-green-950/90 border-green-500/30 text-green-300'
                : toastMessage.type === 'error'
                ? 'bg-red-950/90 border-red-500/30 text-red-300'
                : 'bg-surface-2/95 border-border text-foreground'
            }`}
          >
            <span className="shrink-0 mt-0.5">{toastMessage.icon}</span>
            <span>{toastMessage.text}</span>
          </div>
        )}
      </div>

      {/* Animación keyframe de campanilla inline */}
      <style jsx>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10%       { transform: rotate(14deg); }
          30%       { transform: rotate(-12deg); }
          50%       { transform: rotate(10deg); }
          70%       { transform: rotate(-8deg); }
          90%       { transform: rotate(5deg); }
        }
        :global(.animate-bell-ring) {
          animation: bell-ring 0.6s ease-in-out;
        }
      `}</style>
    </>
  );
}
