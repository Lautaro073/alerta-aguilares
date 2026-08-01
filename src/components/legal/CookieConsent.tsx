'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import {
  readConsent,
  saveConsent,
  subscribeToConsent,
  type ConsentChoice,
} from '@/lib/consent';

/**
 * Banner de consentimiento de cookies y almacenamiento local.
 *
 * El banner NO bloquea el uso del sitio: rechazar las funciones opcionales deja
 * la app plenamente utilizable, que es la conducta que recomienda la AAIP.
 * Tampoco ofrece rechazar lo estrictamente necesario (sesión y control de
 * abuso), porque sería una opción falsa.
 */
export default function CookieConsent() {
  // El servidor devuelve null y el cliente el valor real: con useSyncExternalStore
  // el primer render coincide con el HTML del servidor y no hay mismatch.
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);

  if (consent) return null;

  const decide = (choice: ConsentChoice) => () => {
    saveConsent(choice);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[1500] flex justify-center p-3 sm:p-4 pointer-events-none animate-fade-in"
    >
      <div className="glass-strong pointer-events-auto w-full max-w-3xl p-4 sm:p-5 flex flex-col gap-4 shadow-glow">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex p-2.5 rounded-xl bg-accent/10 border border-accent/25 text-accent shrink-0">
            <Cookie size={20} />
          </div>

          <div className="flex flex-col gap-1.5">
            <h2
              id="cookie-consent-title"
              className="font-outfit font-bold text-sm text-foreground tracking-wide"
            >
              Cookies y almacenamiento en tu navegador
            </h2>
            <p className="font-jakarta text-xs text-muted leading-relaxed">
              Usamos almacenamiento estrictamente necesario para mantener tu sesión
              iniciada y para limitar el abuso de la plataforma; eso no se puede
              desactivar sin romper el servicio. Aparte de eso podés permitir
              funciones opcionales, como las notificaciones push y recordar
              preferencias de la interfaz.{' '}
              <strong className="text-foreground/90 font-semibold">
                No usamos cookies de publicidad ni de analítica de terceros.
              </strong>{' '}
              Más detalle en la{' '}
              <Link
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-semibold hover:text-accent/80 underline underline-offset-2"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={decide('essential')}
            className="btn btn-ghost text-xs py-2 px-4 rounded-lg cursor-pointer"
          >
            Solo lo necesario
          </button>
          <button
            type="button"
            onClick={decide('all')}
            className="btn btn-primary text-xs py-2 px-4 rounded-lg font-bold cursor-pointer"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}
