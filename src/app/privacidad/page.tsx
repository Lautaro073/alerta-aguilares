'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, EyeOff, Lock, Scale, MapPin } from 'lucide-react';

/**
 * Página de Política de Privacidad y Uso de Datos de CiudadAlerta.
 * Cumple con los requisitos del Checklist de Lanzamiento del MVP Core.
 * Presenta un diseño premium, totalmente responsive y de altísima fidelidad visual.
 */
export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#080d1a] text-foreground font-jakarta flex flex-col items-center px-4 py-8 md:py-16 selection:bg-accent/30 selection:text-white">
      
      {/* Contenedor principal con limitador de ancho */}
      <div className="w-full max-w-3xl flex flex-col gap-8 md:gap-12 animate-fade-in">
        
        {/* Encabezado con Botón de Regreso y Branding */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 select-none">
          <div className="flex flex-col">
            <h1 className="font-outfit font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
              <ShieldCheck className="text-accent shrink-0" size={26} />
              <span>Alertas Aguilares</span>
            </h1>
            <span className="font-jakarta text-[10px] text-muted font-bold tracking-wider uppercase mt-1">
              Participación Ciudadana
            </span>
          </div>

          <Link
            id="back-to-map-btn"
            href="/"
            className="btn btn-ghost inline-flex items-center gap-2 self-start sm:self-auto text-xs py-2 px-4 rounded-lg transition-all"
          >
            <ArrowLeft size={14} />
            <span>Volver al mapa</span>
          </Link>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col gap-4 text-center sm:text-left select-none">
          <h2 className="font-outfit font-extrabold text-3xl sm:text-4xl tracking-tight text-white">
            Tu privacidad es <span className="gradient-text">nuestra prioridad</span>
          </h2>
          <p className="font-jakarta text-sm text-muted leading-relaxed max-w-2xl">
            Queremos que te sientas completamente seguro al reportar incidentes en tu barrio. 
            Acá te explicamos de manera simple qué datos guardamos, para qué se usan y cómo 
            protegemos tu identidad al 100%.
          </p>
        </section>

        {/* Secciones de Política de Privacidad */}
        <div className="flex flex-col gap-6">

          {/* Tarjeta 1: Totalmente Anónimo */}
          <article className="glass-strong p-6 md:p-8 flex flex-col sm:flex-row gap-5 items-start transition-all hover:border-border-strong hover:-translate-y-0.5 duration-300">
            <div className="p-3 rounded-xl bg-accent/10 border border-accent/25 text-accent shrink-0">
              <EyeOff size={22} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-outfit font-bold text-base text-white tracking-wide">
                1. 100% Anónimo y sin registros molestos
              </h3>
              <p className="font-jakarta text-xs text-muted leading-relaxed">
                No te pedimos nombre, correo electrónico, número de teléfono ni contraseñas. 
                Cualquier vecino puede acceder a la plataforma y reportar un problema de forma 
                directa e inmediata sin tener que crear una cuenta de usuario.
              </p>
            </div>
          </article>

          {/* Tarjeta 2: Qué datos son públicos */}
          <article className="glass-strong p-6 md:p-8 flex flex-col sm:flex-row gap-5 items-start transition-all hover:border-border-strong hover:-translate-y-0.5 duration-300">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shrink-0">
              <MapPin size={22} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-outfit font-bold text-base text-white tracking-wide">
                2. Qué datos se publican en el mapa interactivo
              </h3>
              <p className="font-jakarta text-xs text-muted leading-relaxed">
                Cuando publicás una alerta vecinal, la información que se vuelve pública y visible para toda la comunidad es únicamente:
              </p>
              <ul className="list-disc list-inside font-jakarta text-xs text-muted leading-relaxed pl-2 flex flex-col gap-1 mt-1">
                <li>La ubicación geográfica exacta en el mapa (latitud y longitud).</li>
                <li>La categoría del incidente (Bache, Inseguridad, Alumbrado, etc.).</li>
                <li>El título breve y los detalles descriptivos opcionales que hayas escrito.</li>
                <li>Las fotos de evidencia que hayas subido de forma voluntaria.</li>
                <li>La fecha y hora exacta en la que se registró el reporte.</li>
              </ul>
            </div>
          </article>

          {/* Tarjeta 3: Seguridad y Rate Limiting Criptográfico */}
          <article className="glass-strong p-6 md:p-8 flex flex-col sm:flex-row gap-5 items-start transition-all hover:border-border-strong hover:-translate-y-0.5 duration-300">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 shrink-0">
              <Lock size={22} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-outfit font-bold text-base text-white tracking-wide">
                3. Cómo resguardamos tu identidad en el servidor
              </h3>
              <p className="font-jakarta text-xs text-muted leading-relaxed">
                Para evitar el spam, las alertas falsas o ataques maliciosos que puedan saturar el servicio, implementamos un sistema dual de control de reportes. Para ello, el servidor registra de forma temporal:
              </p>
              <ul className="list-disc list-inside font-jakarta text-xs text-muted leading-relaxed pl-2 flex flex-col gap-1 mt-1">
                <li>Una huella digital anónima de tu navegador (generada localmente).</li>
                <li>La dirección de red (IP) desde la que se realiza la publicación.</li>
              </ul>
              <p className="font-jakarta text-xs text-muted leading-relaxed mt-2">
                <strong>Importante:</strong> Estos identificadores se procesan en el servidor y se someten **inmediatamente** a un algoritmo criptográfico de un solo sentido (hashing irreversible con sal secreta SHA-256) antes de ser almacenados en la base de datos de control. Nadie, ni siquiera los administradores del sistema, puede descifrar o reconstruir tu dirección IP ni rastrear tu dispositivo físico.
              </p>
            </div>
          </article>

          {/* Tarjeta 4: Límites de Uso Justo */}
          <article className="glass-strong p-6 md:p-8 flex flex-col sm:flex-row gap-5 items-start transition-all hover:border-border-strong hover:-translate-y-0.5 duration-300">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shrink-0">
              <Scale size={22} />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-outfit font-bold text-base text-white tracking-wide">
                4. Límites de publicación y control de spam
              </h3>
              <p className="font-jakarta text-xs text-muted leading-relaxed">
                Para garantizar la salud de la plataforma y evitar abusos, los límites diarios de publicación por dispositivo y red son:
              </p>
              <ul className="list-disc list-inside font-jakarta text-xs text-muted leading-relaxed pl-2 flex flex-col gap-1 mt-1">
                <li>Máximo de **5 reportes diarios** por navegador web.</li>
                <li>Máximo de **10 reportes diarios** por conexión de red pública (IP).</li>
              </ul>
              <p className="font-jakarta text-xs text-muted leading-relaxed mt-1">
                Al transcurrir una ventana rodante de 24 horas, los contadores se limpian de forma automática y transparente.
              </p>
            </div>
          </article>

        </div>

        {/* Footer Informativo */}
        <footer className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left select-none">
          <p className="font-jakarta text-[11px] text-muted">
            Alertas Aguilares es una iniciativa ciudadana colaborativa de código abierto enfocada en mejorar la calidad de vida y seguridad de la ciudad de Aguilares.
          </p>
          <span className="font-mono text-[9.5px] text-accent/80 shrink-0">
            Versión MVP 1.1
          </span>
        </footer>

      </div>
    </main>
  );
}
