'use client';

import type { ChangeEvent } from 'react';
import { CATEGORIES } from '@/lib/constants/categories';
import { Clock, Filter, Search } from 'lucide-react';
import type { AdminStatusFilter, AdminTimeframeFilter } from '../types/admin.types';

type AdminReportFiltersProps = {
  searchQuery: string;
  statusFilter: AdminStatusFilter;
  categoryFilter: string;
  timeframeFilter: AdminTimeframeFilter;
  archivedCount: number;
  hasActiveFilters: boolean;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: AdminStatusFilter) => void;
  setCategoryFilter: (category: string) => void;
  setTimeframeFilter: (timeframe: AdminTimeframeFilter) => void;
  resetPagination: () => void;
  clearFilters: () => void;
};

export function AdminReportFilters({
  searchQuery,
  statusFilter,
  categoryFilter,
  timeframeFilter,
  archivedCount,
  hasActiveFilters,
  setSearchQuery,
  setStatusFilter,
  setCategoryFilter,
  setTimeframeFilter,
  resetPagination,
  clearFilters,
}: AdminReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:self-end">
      <div className="relative flex items-center min-w-[200px] flex-1 sm:flex-initial">
        <Search size={14} className="absolute left-3 text-muted" />
        <input
          type="text"
          placeholder="Buscar reporte..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            resetPagination();
          }}
          className="w-full bg-surface-1 border border-border focus:border-accent rounded-lg py-1.5 pl-9 pr-3 text-xs outline-none text-foreground transition-all placeholder:text-muted/40"
        />
      </div>

      <div className="relative flex items-center">
        <Clock size={12} className="absolute left-2.5 text-muted pointer-events-none" />
        <select
          value={timeframeFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            setTimeframeFilter(event.target.value as AdminTimeframeFilter);
            resetPagination();
          }}
          className="bg-surface-1 border border-border rounded-lg py-1.5 pl-8 pr-2 text-xs text-foreground outline-none transition-all cursor-pointer font-bold"
        >
          <option value="all">Histórico</option>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
        </select>
      </div>

      <div className="relative flex items-center">
        <Filter size={12} className="absolute left-2.5 text-muted pointer-events-none" />
        <select
          value={statusFilter}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            setStatusFilter(event.target.value as AdminStatusFilter);
            resetPagination();
          }}
          className="bg-surface-1 border border-border rounded-lg py-1.5 pl-8 pr-2 text-xs text-foreground outline-none transition-all cursor-pointer font-bold"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="RESOLVED">Resueltos</option>
          <option value="DUPLICATE">Duplicados</option>
          <option value="DELETED">Archivados{archivedCount > 0 ? ` (${archivedCount})` : ''}</option>
        </select>
      </div>

      <div className="relative flex items-center">
        <select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            resetPagination();
          }}
          className="bg-surface-1 border border-border rounded-lg py-1.5 px-3 text-xs text-foreground outline-none transition-all cursor-pointer font-bold"
        >
          <option value="ALL">Todas las Categorías</option>
          {Object.values(CATEGORIES).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name.split(' / ')[0]}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="h-8 px-3 rounded-lg bg-surface-2 border border-border hover:bg-surface-3 text-[11px] text-muted hover:text-foreground font-bold transition-colors cursor-pointer"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
