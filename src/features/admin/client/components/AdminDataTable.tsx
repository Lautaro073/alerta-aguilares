import type { CSSProperties, ReactNode } from 'react';
import { AdminDataTableFooter } from './AdminDataTableFooter';
import type { AdminPageSize } from '../types/admin.types';

export type AdminDataTableColumn = {
  key: string;
  label: string;
  className?: string;
};

type AdminDataTableProps = {
  title: string;
  description?: string;
  columns: readonly AdminDataTableColumn[];
  children: ReactNode;
  className?: string;
  height?: CSSProperties['height'];
  width?: CSSProperties['width'];
  loading?: boolean;
  skeletonRows?: number;
  toolbar?: ReactNode;
  filters?: ReactNode;
  pagination?: {
    page: number;
    pageSize: AdminPageSize;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: AdminPageSize) => void;
  };
};

export function AdminDataTable({
  title,
  description,
  columns,
  children,
  className = '',
  height,
  width,
  loading = false,
  skeletonRows = 6,
  toolbar,
  filters,
  pagination,
}: AdminDataTableProps) {
  return (
    <section className={`admin-panel admin-data-table ${className}`} style={{ height, width }}>
      <div className="admin-page-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {(filters || toolbar) && (
          <div className="admin-table-tools">
            {filters}
            {toolbar}
          </div>
        )}
      </div>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={getColumnClassName(column)}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>{loading ? <AdminDataTableSkeleton columns={columns} rows={skeletonRows} /> : children}</tbody>
        </table>
      </div>
      {pagination && <AdminDataTableFooter {...pagination} />}
    </section>
  );
}

function AdminDataTableSkeleton({
  columns,
  rows,
}: {
  columns: readonly AdminDataTableColumn[];
  rows: number;
}) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={rowIndex} className="admin-table-skeleton-row">
      {columns.map((column) => (
        <td key={column.key} className={getColumnClassName(column)}>
          <span className={`admin-skeleton-cell admin-skeleton-${column.key}`} />
        </td>
      ))}
    </tr>
  ));
}

function getColumnClassName(column: AdminDataTableColumn) {
  return [column.className, column.key === 'actions' ? 'admin-sticky-actions' : ''].filter(Boolean).join(' ');
}
