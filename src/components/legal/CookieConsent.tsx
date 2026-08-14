'use client';

import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Bell, Check, Compass, Cookie } from 'lucide-react';
import {
  readConsent,
  saveConsent,
  subscribeToConsent,
  type OptionalFeature,
} from '@/lib/consent';
import {
  isTourBlocking,
  subscribeToTourState,
} from '@/lib/onboarding/systemTour';

const STARTUP_GRACE_MS = 700;
const POST_TOUR_DELAY_MS = 220;

const subscribeToClientSnapshot = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
const getConsentServerSnapshot = () => null;
const getTourServerSnapshot = () => false;

const OPTIONS: {
  id: OptionalFeature;
  icon: typeof Bell;
  title: string;
  detail: string;
}[] = [
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notificaciones',
    detail: 'Recibí avisos sobre alertas importantes.',
  },
  {
    id: 'preferences',
    icon: Compass,
    title: 'Recordar preferencias',
    detail: 'Conservá recorridos y ajustes entre visitas.',
  },
];

export default function CookieConsent() {
  const mounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  );
  const consent = useSyncExternalStore(
    subscribeToConsent,
    readConsent,
    getConsentServerSnapshot
  );
  const tourBlocking = useSyncExternalStore(
    subscribeToTourState,
    isTourBlocking,
    getTourServerSnapshot
  );

  const groupId = useId();
  const [startupReady, setStartupReady] = useState(false);
  const [postTourReady, setPostTourReady] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<OptionalFeature, boolean>>>({});

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setStartupReady(true), STARTUP_GRACE_MS);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setPostTourReady(!tourBlocking),
      tourBlocking ? 0 : POST_TOUR_DELAY_MS
    );

    return () => window.clearTimeout(timeoutId);
  }, [tourBlocking]);

  const choices: Record<OptionalFeature, boolean> = {
    notifications: touched.notifications ?? consent?.notifications ?? false,
    preferences: touched.preferences ?? consent?.preferences ?? false,
  };

  if (!mounted || !startupReady || !postTourReady || consent?.decidedAt) return null;

  const toggle = (id: OptionalFeature) => () => {
    setTouched((current) => ({ ...current, [id]: !choices[id] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${groupId}-title`}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[1500] flex justify-center p-3 sm:p-4 animate-fade-in motion-reduce:animate-none"
    >
      <div className="glass-strong pointer-events-auto w-full max-w-2xl overflow-hidden shadow-glow">
        <div className="h-px w-full bg-gradient-to-r from-[#4f7cff] via-[#a78bfa] to-[#06b6d4] opacity-70" />

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
              <Cookie size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id={`${groupId}-title`}
                className="font-outfit text-[15px] font-bold tracking-tight text-foreground"
              >
                Preferencias opcionales
              </h2>

              <p className="mt-1.5 font-jakarta text-xs leading-relaxed text-muted">
                Podés usar el mapa sin activarlas y cambiarlas después.{' '}
                <Link
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent underline underline-offset-2 hover:text-accent/80"
                >
                  Ver privacidad
                </Link>
                .
              </p>
            </div>
          </div>

          <fieldset className="min-w-0 border-0 p-0">
            <legend className="sr-only">Funciones opcionales</legend>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {OPTIONS.map(({ id, icon: Icon, title, detail }) => {
                const active = choices[id];

                return (
                  <label
                    key={id}
                    htmlFor={`${groupId}-${id}`}
                    className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-200 focus-within:ring-2 focus-within:ring-accent/70 focus-within:ring-offset-2 focus-within:ring-offset-[#101728] ${
                      active
                        ? 'border-accent/55 bg-accent/10'
                        : 'border-border bg-surface-1/40 hover:border-border-strong hover:bg-surface-1/70'
                    }`}
                  >
                    <input
                      id={`${groupId}-${id}`}
                      type="checkbox"
                      checked={active}
                      onChange={toggle(id)}
                      aria-labelledby={`${groupId}-${id}-title`}
                      aria-describedby={`${groupId}-${id}-detail`}
                      className="sr-only"
                    />

                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-200 ${
                        active
                          ? 'border-accent bg-accent text-white'
                          : 'border-border-strong bg-surface-2 text-transparent group-hover:border-accent/50'
                      }`}
                    >
                      <Check size={12} strokeWidth={3.5} />
                    </span>

                    <span className="flex min-w-0 flex-col gap-1">
                      <span
                        id={`${groupId}-${id}-title`}
                        className={`flex items-center gap-1.5 font-jakarta text-xs font-bold transition-colors duration-200 ${
                          active ? 'text-foreground' : 'text-foreground/80'
                        }`}
                      >
                        <Icon
                          size={12}
                          className={active ? 'text-accent' : 'text-muted'}
                          aria-hidden="true"
                        />
                        {title}
                      </span>
                      <span
                        id={`${groupId}-${id}-detail`}
                        className="font-jakarta text-[11px] leading-snug text-muted"
                      >
                        {detail}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => saveConsent(choices)}
              className="btn btn-primary h-10 w-full cursor-pointer rounded-lg px-5 text-xs font-bold sm:w-auto"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
