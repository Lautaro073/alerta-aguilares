import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../constants/admin.constants';
import type { AdminPageSize } from '../types/admin.types';

type AdminDataTableFooterProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: AdminPageSize) => void;
};

export function AdminDataTableFooter({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: AdminDataTableFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(total, currentPage * pageSize);

  return (
    <div className="admin-table-footer">
      <span>
        Mostrando <strong>{start}-{end}</strong> de <strong>{total}</strong>
      </span>
      <div className="admin-table-controls">
        {onPageSizeChange && (
          <label>
            Filas
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value) as AdminPageSize)}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        )}
        <div className="admin-pagination-buttons">
          <button type="button" aria-label="Primera pagina" onClick={() => onPageChange(1)} disabled={currentPage <= 1}>
            <ChevronsLeft size={16} />
          </button>
          <button type="button" aria-label="Pagina anterior" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft size={16} />
          </button>
          <span>Pagina {currentPage} de {totalPages}</span>
          <button type="button" aria-label="Pagina siguiente" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
            <ChevronRight size={16} />
          </button>
          <button type="button" aria-label="Ultima pagina" onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages}>
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
