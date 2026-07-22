'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, History, ListChecks, Route } from 'lucide-react';
import { AdminTooltipButton } from '../components/AdminTooltipButton';
import { CategoryLabel, Metric, PageTitle, PriorityBars } from '../components/AdminDashboardParts';
import { ConfigAreaCreateSheet, ConfigAreaEditSheet, ConfigCategoryCreateSheet, ConfigCategoryEditSheet } from '../components/ConfigSheets';
import { useAdminConfig } from '../hooks/useAdminConfig';
import type { AdminConfigCategory, AdminConfigStatusFilter } from '../types/adminConfig.types';

function formatRecentDate(value: string | null) {
  if (!value) return 'Sin datos';
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function getConfigPriority(priority: AdminConfigCategory['priority']) {
  if (priority === 'high') return { tone: 'error', count: 3 };
  if (priority === 'medium') return { tone: 'primary', count: 2 };
  return { tone: 'secondary', count: 1 };
}

function getConfigPriorityLabel(priority: AdminConfigCategory['priority']) {
  if (priority === 'high') return 'Alta';
  if (priority === 'medium') return 'Media';
  return 'Baja';
}

export function ConfigView() {
  const { areas, categories, loading, patchConfig, createConfig } = useAdminConfig();
  const [categoryQuery, setCategoryQuery] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<AdminConfigStatusFilter>('active');
  const [areaStatusFilter, setAreaStatusFilter] = useState<AdminConfigStatusFilter>('active');
  const activeAreas = areas.filter((area) => area.isActive);
  const activeCategories = categories.filter((category) => category.isActive);
  const visibleCategories = categories.filter((category) => {
    const matchesStatus = categoryStatusFilter === 'all' || category.isActive === (categoryStatusFilter === 'active');
    const matchesQuery = `${category.label} ${category.name}`.toLowerCase().includes(categoryQuery.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  });
  const visibleAreas = areas.filter((area) => {
    const matchesStatus = areaStatusFilter === 'all' || area.isActive === (areaStatusFilter === 'active');
    const matchesQuery = `${area.label} ${area.responsible}`.toLowerCase().includes(areaQuery.trim().toLowerCase());
    return matchesStatus && matchesQuery;
  });
  const lastUpdated = [...areas, ...categories]
    .map((item) => item.updatedAt ? new Date(item.updatedAt).getTime() : 0)
    .reduce((max, value) => Math.max(max, value), 0);
  const saveConfig = (body: Record<string, unknown>) => toast.promise(patchConfig(body), {
    loading: 'Guardando configuracion...',
    success: 'Configuracion guardada.',
    error: (error) => error instanceof Error ? error.message : 'No se pudo guardar.',
  });

  return (
    <>
      <PageTitle
        title="Configuracion del sistema"
        description="Categorias de incidentes y areas municipales."
        action={(
          <div className="admin-config-actions">
            <ConfigCategoryCreateSheet areas={areas} onCreate={createConfig} />
            <ConfigAreaCreateSheet onCreate={createConfig} />
          </div>
        )}
      />
      <section className="admin-metrics">
        <Metric tone="primary" icon={<ListChecks size={22} />} label="Categorias activas" value={loading ? '...' : activeCategories.length} />
        <Metric tone="secondary" icon={<Badge size={22} />} label="Areas activas" value={loading ? '...' : activeAreas.length} />
        <Metric tone="muted" icon={<Route size={22} />} label="Sin derivacion" value={loading ? '...' : categories.filter((category) => !category.defaultAreaId).length} />
        <Metric tone="tertiary" icon={<History size={22} />} label="Ultima actualizacion" value={lastUpdated ? formatRecentDate(new Date(lastUpdated).toISOString()) : 'Sin datos'} />
      </section>
      <div className="admin-config-grid">
        <section className="admin-panel admin-config-categories">
          <div className="admin-panel-header">
            <h2>Categorias de incidentes</h2>
            <div className="admin-filters compact">
              <input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Buscar categoria..." />
              <select value={categoryStatusFilter} onChange={(event) => setCategoryStatusFilter(event.target.value as AdminConfigStatusFilter)}>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
                <option value="all">Todas</option>
              </select>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Area por defecto</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th className="right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <ConfigSkeletonRows columns={5} rows={5} /> : visibleCategories.map((category) => {
                  const priority = getConfigPriority(category.priority);
                  return (
                    <tr key={category.id}>
                      <td><CategoryLabel label={category.label} color={category.color} iconName={category.iconName} /></td>
                      <td>
                        <select className="admin-inline-select" value={category.defaultAreaId || ''} onChange={(event) => saveConfig({ type: 'category', id: category.id, defaultAreaId: event.target.value })}>
                          {areas.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <AdminTooltipButton label={getConfigPriorityLabel(category.priority)}>
                          <span className="admin-priority-tooltip"><PriorityBars tone={priority.tone} count={priority.count} /></span>
                        </AdminTooltipButton>
                      </td>
                      <td>
                        <select className="admin-inline-select compact" value={category.isActive ? 'active' : 'inactive'} onChange={(event) => saveConfig({ type: 'category', id: category.id, isActive: event.target.value === 'active' })}>
                          <option value="active">Activa</option>
                          <option value="inactive">Inactiva</option>
                        </select>
                      </td>
                      <td className="right">
                        <div className="admin-actions">
                          <ConfigCategoryEditSheet areas={areas} category={category} onPatch={patchConfig} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="admin-panel admin-config-areas">
          <div className="admin-panel-header">
            <h2>Areas municipales</h2>
            <div className="admin-filters compact">
              <input value={areaQuery} onChange={(event) => setAreaQuery(event.target.value)} placeholder="Buscar area..." />
              <select value={areaStatusFilter} onChange={(event) => setAreaStatusFilter(event.target.value as AdminConfigStatusFilter)}>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
                <option value="all">Todas</option>
              </select>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th className="right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <ConfigSkeletonRows columns={4} rows={4} /> : visibleAreas.map((area) => (
                  <tr key={area.id}>
                    <td className="bold">{area.label}</td>
                    <td>{area.responsible || 'Sin responsable'}</td>
                    <td>
                      <select className="admin-inline-select compact" value={area.isActive ? 'active' : 'inactive'} onChange={(event) => saveConfig({ type: 'area', id: area.id, isActive: event.target.value === 'active' })}>
                        <option value="active">Activa</option>
                        <option value="inactive">Inactiva</option>
                      </select>
                    </td>
                    <td className="right">
                      <div className="admin-actions">
                        <ConfigAreaEditSheet area={area} onPatch={patchConfig} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>

      </div>
    </>
  );
}

function ConfigSkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={rowIndex} className="admin-table-skeleton-row">
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td key={columnIndex} className={columnIndex === columns - 1 ? 'right' : ''}>
          <span className="admin-skeleton-cell" />
        </td>
      ))}
    </tr>
  ));
}
