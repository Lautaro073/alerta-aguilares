import Link from 'next/link';
import { ArrowLeft, Search, Shield, Wifi } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-[#075985] lg:hidden">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="font-outfit text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">
              Consola administrativa
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">Gestion operativa de alertas ciudadanas</p>
          </div>
        </div>

        <div className="hidden min-w-[280px] max-w-md flex-1 items-center md:flex">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#075985]"
              placeholder="Buscar en el panel"
              type="search"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 sm:flex">
            <Wifi size={13} />
            Sistema activo
          </span>
          <Link
            href="/"
            className="flex h-9 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Mapa</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
