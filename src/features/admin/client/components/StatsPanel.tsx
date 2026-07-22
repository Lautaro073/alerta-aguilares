import type { CSSProperties } from 'react';
import { TrendingUp } from 'lucide-react';
import { CATEGORIES, type CategoryId } from '@/lib/constants/categories';
import { ADMIN_SUMMARY_CATEGORY_LIMIT } from '../constants/admin.constants';
import type { AdminCategoryStat } from '../types/admin.types';

export function StatsPanel({ stats = [], loading = false }: { stats?: AdminCategoryStat[]; loading?: boolean }) {
  const visibleStats = stats.slice(0, ADMIN_SUMMARY_CATEGORY_LIMIT).map((stat) => ({
    id: stat.category,
    label: CATEGORIES[stat.category as CategoryId]?.label || stat.category,
    color: CATEGORIES[stat.category as CategoryId]?.color || '#075985',
    total: stat.total,
    resolved: stat.resolved,
  }));
  const total = visibleStats.reduce((sum, category) => sum + category.total, 0);
  const resolved = visibleStats.reduce((sum, category) => sum + category.resolved, 0);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;

  return (
    <section className="admin-panel admin-stats">
      <h2>Alertas por Categoria</h2>
      {loading ? <StatsPanelSkeleton /> : (
        <>
          <div className="admin-stat-list">
            {visibleStats.map((category) => (
              <div key={category.id}>
                <p><span>{category.label}</span><strong>{category.resolved}/{category.total}</strong></p>
                <div><span style={{ width: `${category.total > 0 ? (category.resolved / category.total) * 100 : 0}%`, backgroundColor: category.color }} /></div>
              </div>
            ))}
          </div>
          <div className="admin-resolution">
            <div>
              <strong>{resolutionRate}%</strong>
              <p>Tasa de resolucion mensual</p>
            </div>
            <ResolutionGauge value={resolutionRate} />
          </div>
        </>
      )}
    </section>
  );
}

function StatsPanelSkeleton() {
  return (
    <>
      <div className="admin-stat-list admin-stat-skeleton" aria-hidden="true">
        {Array.from({ length: ADMIN_SUMMARY_CATEGORY_LIMIT }, (_, index) => (
          <div key={index}>
            <p><span /><strong /></p>
            <div><span /></div>
          </div>
        ))}
      </div>
      <div className="admin-resolution admin-resolution-skeleton" aria-hidden="true">
        <div>
          <strong />
          <p />
        </div>
        <span />
      </div>
    </>
  );
}

function ResolutionGauge({ value }: { value: number }) {
  const progress = Math.max(0, Math.min(100, value));
  const sideProgress = progress / 2;

  return (
    <div className="admin-resolution-icon" style={{ '--gauge-side-progress': sideProgress } as CSSProperties}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle className="admin-resolution-track" cx="36" cy="36" r="28" pathLength="100" />
        <path className="admin-resolution-progress" d="M36 64 A28 28 0 0 1 36 8" pathLength="50" />
        <path className="admin-resolution-progress" d="M36 64 A28 28 0 0 0 36 8" pathLength="50" />
      </svg>
      <TrendingUp className="admin-resolution-trend" size={22} />
    </div>
  );
}
