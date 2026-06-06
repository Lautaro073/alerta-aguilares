import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="glass-strong border-b border-border py-4 px-4 sm:px-6 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Shield size={18} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-base sm:text-lg tracking-tight text-foreground">
              Alertas<span className="gradient-text">Aguilares</span>
            </h1>
            <span className="text-[10px] uppercase font-bold bg-yellow-500/10 border border-yellow-500/25 px-2 py-0.5 rounded text-yellow-400 tracking-wider">
              Consola
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="btn btn-ghost py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Volver al Mapa</span>
        </Link>
      </div>
    </header>
  );
}
