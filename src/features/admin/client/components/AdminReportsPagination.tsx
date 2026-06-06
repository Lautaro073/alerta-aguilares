'use client';

import type { ChangeEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../constants/admin.constants';
import type { AdminPageSize, AdminReportSummary } from '../types/admin.types';
import { AdminTooltipButton } from './AdminTooltipButton';

type AdminReportsPaginationProps = {
  totalCount: number;
  summary: AdminReportSummary;
  pageSize: AdminPageSize;
  pageCount: number;
  safeCurrentPage: number;
  pageStartIndex: number;
  pageEndIndex: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  hasActiveFilters: boolean;
  setPageSize: (pageSize: AdminPageSize) => void;
  setCurrentPage: (updater: number | ((page: number) => number)) => void;
  resetPagination: () => void;
};

export function AdminReportsPagination({
  totalCount,
  summary,
  pageSize,
  pageCount,
  safeCurrentPage,
  pageStartIndex,
  pageEndIndex,
  canGoPrevious,
  canGoNext,
  hasActiveFilters,
  setPageSize,
  setCurrentPage,
  resetPagination,
}: AdminReportsPaginationProps) {
  if (totalCount === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-surface-1/30 shadow-sm">
      <div className="h-1 w-full bg-surface-2">
        <div
          className="h-full rounded-r-full bg-accent/35 transition-all"
          style={{ width: `${Math.max(8, Math.min(100, (safeCurrentPage / pageCount) * 100))}%` }}
        />
      </div>

      <div className="flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-muted">
          <span>
            0 de {totalCount} fila(s) seleccionadas
          </span>
          <span className="hidden h-3 w-px bg-border sm:inline-block" />
          <span className="font-mono text-[10px] text-muted/80">
            {pageStartIndex + 1}-{pageEndIndex} de {totalCount}
          </span>
          {hasActiveFilters && (
            <span className="font-mono text-[10px] text-muted/70">
              filtradas de {summary.totalReports}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <label className="flex items-center gap-2 text-[11px] font-bold text-muted">
            <span>Filas por pagina</span>
            <select
              value={pageSize}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                setPageSize(Number(event.target.value) as AdminPageSize);
                resetPagination();
              }}
              className="h-8 rounded-lg border border-border bg-surface-2 px-2 text-xs font-bold text-foreground outline-none transition-colors hover:bg-surface-3 cursor-pointer"
              aria-label="Cantidad de reportes por pagina"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            <span className="min-w-[86px] text-right text-[11px] font-bold text-muted">
              Pagina {safeCurrentPage} de {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <AdminTooltipButton label="Primera pagina" disabled={!canGoPrevious}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={!canGoPrevious}
                  className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Primera pagina"
                >
                  <ChevronsLeft size={14} />
                </button>
              </AdminTooltipButton>
              <AdminTooltipButton label="Pagina anterior" disabled={!canGoPrevious}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={!canGoPrevious}
                  className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft size={14} />
                </button>
              </AdminTooltipButton>
              <AdminTooltipButton label="Pagina siguiente" disabled={!canGoNext}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                  disabled={!canGoNext}
                  className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Pagina siguiente"
                >
                  <ChevronRight size={14} />
                </button>
              </AdminTooltipButton>
              <AdminTooltipButton label="Ultima pagina" disabled={!canGoNext}>
                <button
                  type="button"
                  onClick={() => setCurrentPage(pageCount)}
                  disabled={!canGoNext}
                  className="w-8 h-8 rounded-lg border border-border bg-surface-2 text-muted hover:text-foreground hover:bg-surface-3 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Ultima pagina"
                >
                  <ChevronsRight size={14} />
                </button>
              </AdminTooltipButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
