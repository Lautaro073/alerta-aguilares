'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Bell, Check, Compass, Cookie } from 'lucide-react';
import {
  readConsent,
  saveConsent,
  subscribeToConsent,
  type OptionalFeature,
} from '@/lib/consent';

// Detección de montaje, mismo patrón que AuthModal: en el servidor devuelve
// false y en el cliente true, recién después de hidratar.
const subscribeToClientSnapshot = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const getConsentServerSnapshot = () => null;

const OPCIONES: {
  id: OptionalFeature;
  icono: typeof Bell;
  titulo: string;
  detalle: string;
}[] = [
  {
    id: 'notifications',
    icono: Bell,
    titulo: 'Notificaciones push',
    detalle: 'Guardar un identificador de tu dispositivo para avisarte de alertas nuevas.',
  },
  {
    id: 'preferences',
    icono: Compass,
    titulo: 'Preferencias de interfaz',
    detalle: 'Recordar entre visitas que ya viste el recorrido guiado.',
  },
];

/**
 * Banner de consentimiento de cookies y almacenamiento local.
 *
 * Cada función opcional se acepta por separado y las dos arrancan desmarcadas,
 * así rechazar cuesta exactamente lo mismo que aceptar. El banner NO bloquea el
 * uso del sitio: rechazar todo deja la app plenamente utilizable, que es la
 * conducta que recomienda la AAIP. Tampoco ofrece rechazar lo estrictamente
 * necesario (sesión y control de abuso), porque sería una opción falsa.
 */
export default function CookieConsent() {
  // Sin esta guarda el banner se prerenderiza en el HTML estático: el servidor
  // no puede leer localStorage, así que asume "no aceptó" y lo pinta. Resultado:
  // a quien ya había aceptado le aparecía igual en cada recarga, hasta que React
  // hidrataba y lo sacaba. No se perdía el consentimiento, parpadeaba el banner.
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

  const groupId = useId();

  // Solo se guarda lo que la persona tocó a mano; el resto sale del estado real.
  // Puede haber una función ya habilitada desde su propio control (la campana)
  // sin que el banner se haya respondido todavía: en ese caso la casilla tiene
  // que aparecer marcada, o guardar la selección se la revocaría sin aviso.
  const [tocadas, setTocadas] = useState<Partial<Record<OptionalFeature, boolean>>>({});

  const choices: Record<OptionalFeature, boolean> = {
    notifications: tocadas.notifications ?? consent?.notifications ?? false,
    preferences: tocadas.preferences ?? consent?.preferences ?? false,
  };

  if (!mounted || consent?.decidedAt) return null;

  const toggle = (id: OptionalFeature) => () => {
    setTocadas((previous) => ({ ...previous, [id]: !choices[id] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${groupId}-titulo`}
      className="fixed inset-x-0 bottom-0 z-[1500] flex justify-center p-3 sm:p-4 pointer-events-none animate-fade-in motion-reduce:animate-none"
    >
      <div className="glass-strong pointer-events-auto w-full max-w-3xl shadow-glow overflow-hidden">
        {/* Filo superior con el degradado de marca: ancla visual del panel. */}
        <div className="h-px w-full bg-gradient-to-r from-[#4f7cff] via-[#a78bfa] to-[#06b6d4] opacity-70" />

        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
              <Cookie size={19} />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <h2
                id={`${groupId}-titulo`}
                className="font-outfit text-[15px] font-bold tracking-tight text-foreground"
              >
                Cookies y almacenamiento en tu navegador
              </h2>
              <p className="font-jakarta text-xs leading-relaxed text-muted">
                Usamos almacenamiento estrictamente necesario para mantener tu sesión
                iniciada y limitar el abuso; eso no se puede desactivar sin romper el
                servicio.{' '}
                <strong className="font-semibold text-foreground/90">
                  No usamos cookies de publicidad ni analítica de terceros.
                </strong>{' '}
                Elegí qué funciones opcionales querés habilitar — podés aceptar una y
                rechazar la otra. Más detalle en la{' '}
                <Link
                  href="/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent underline underline-offset-2 hover:text-accent/80"
                >
                  Política de Privacidad
                </Link>
                .
              </p>
            </div>
          </div>

          <fieldset className="min-w-0 border-0 p-0">
            <legend className="sr-only">Funciones opcionales</legend>

            <div className="grid gap-2.5 sm:grid-cols-2">
              {OPCIONES.map(({ id, icono: Icono, titulo, detalle }) => {
                const activa = choices[id];

                return (
                  <label
                    key={id}
                    htmlFor={`${groupId}-${id}`}
                    className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors duration-200 focus-within:ring-2 focus-within:ring-accent/70 focus-within:ring-offset-2 focus-within:ring-offset-[#101728] ${
                      activa
                        ? 'border-accent/55 bg-accent/10'
                        : 'border-border bg-surface-1/40 hover:border-border-strong hover:bg-surface-1/70'
                    }`}
                  >
                    <input
                      id={`${groupId}-${id}`}
                      type="checkbox"
                      checked={activa}
                      onChange={toggle(id)}
                      aria-labelledby={`${groupId}-${id}-titulo`}
                      aria-describedby={`${groupId}-${id}-detalle`}
                      className="sr-only"
                    />

                    {/* Indicador de estado. La marca no depende solo del color:
                        también cambia el ícono y el borde de la tarjeta. */}
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-200 ${
                        activa
                          ? 'border-accent bg-accent text-white'
                          : 'border-border-strong bg-surface-2 text-transparent group-hover:border-accent/50'
                      }`}
                    >
                      <Check size={12} strokeWidth={3.5} />
                    </span>

                    <span className="flex min-w-0 flex-col gap-1">
                      <span
                        id={`${groupId}-${id}-titulo`}
                        className={`flex items-center gap-1.5 font-jakarta text-xs font-bold transition-colors duration-200 ${
                          activa ? 'text-foreground' : 'text-foreground/80'
                        }`}
                      >
                        <Icono
                          size={13}
                          className={activa ? 'text-accent' : 'text-muted'}
                          aria-hidden="true"
                        />
                        {titulo}
                      </span>
                      <span
                        id={`${groupId}-${id}-detalle`}
                        className="font-jakarta text-[11px] leading-relaxed text-muted"
                      >
                        {detalle}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => saveConsent({ notifications: true, preferences: true })}
              className="btn btn-ghost h-10 cursor-pointer rounded-lg px-5 text-xs font-semibold"
            >
              Aceptar todo
            </button>
            <button
              type="button"
              onClick={() => saveConsent(choices)}
              className="btn btn-primary h-10 cursor-pointer rounded-lg px-5 text-xs font-bold"
            >
              Guardar selección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
