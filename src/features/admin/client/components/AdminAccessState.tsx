import Link from 'next/link';
import { ArrowLeft, Shield, ShieldAlert } from 'lucide-react';

export function AdminAuthLoading() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center font-jakarta gap-4 select-none">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border border-slate-800 border-t-accent animate-spin" />
        <Shield size={24} className="absolute text-accent animate-pulse-slow" />
      </div>
      <p className="text-xs font-bold text-muted tracking-wider uppercase animate-pulse">
        Validando credenciales...
      </p>
    </div>
  );
}

export function AdminUnauthorized() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center p-6 font-jakarta select-none relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass border border-red-500/25 p-8 rounded-xl shadow-glow shadow-red-500/5 text-center flex flex-col items-center gap-6 animate-scale-in">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert size={28} className="animate-bounce" style={{ animationDuration: '3s' }} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-outfit font-extrabold text-xl md:text-2xl tracking-tight text-red-200">
            Acceso Restringido
          </h2>
          <p className="text-xs text-muted leading-relaxed max-w-[320px]">
            Esta sección está reservada exclusivamente para moderadores y administradores autorizados de <strong>Alertas Aguilares</strong>.
          </p>
        </div>

        <Link
          href="/"
          className="btn btn-primary w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mt-2 h-10 select-none cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
}
