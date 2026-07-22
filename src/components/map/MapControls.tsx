'use client';

import { useState } from 'react';
import { Filter, Shield, Sparkles } from 'lucide-react';
import CategoryIcon from '@/components/ui/CategoryIcon';
import NotificationBell from '@/components/layout/NotificationBell';
import { CATEGORIES, CategoryId } from '@/lib/constants/categories';
import MapAccountMenu from './MapAccountMenu';

interface MapControlsProps {
  selectedCategories: CategoryId[];
  toggleCategory: (category: CategoryId) => void;
  clearCategories: () => void;
  isCategorySelected: (category: CategoryId) => boolean;
}

export default function MapControls({
  selectedCategories,
  toggleCategory,
  clearCategories,
  isCategorySelected,
}: MapControlsProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="absolute top-4 left-0 right-0 z-[1000] px-4 pointer-events-none">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-3 pointer-events-auto">
        <div data-tour="map-header" className="glass-strong px-3 md:px-4 py-3 shadow-md flex items-center justify-between gap-4 animate-slide-down relative z-20">
          <div className="flex items-center gap-2 md:gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow shadow-accent/10">
              <Shield size={18} className="animate-pulse-slow shrink-0" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-outfit font-extrabold text-sm md:text-lg tracking-tight leading-none text-foreground flex items-center gap-1 select-none">
                Alertas<span className="gradient-text">Aguilares</span>
              </h1>
              <span className="font-jakarta font-semibold text-[9px] md:text-[10px] text-muted tracking-wider uppercase leading-none mt-1 select-none">
                Participación ciudadana
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              data-tour="map-filters"
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className={`flex items-center justify-center gap-1.5 h-10 px-2.5 md:px-3.5 rounded-pill font-outfit text-xs font-bold border transition-all duration-300 select-none cursor-pointer ${
                showFilters
                  ? 'bg-surface-2/80 text-foreground border-border hover:bg-surface-3'
                  : 'bg-accent/15 border-accent/40 text-accent hover:bg-accent/25 shadow shadow-accent/5'
              }`}
              title={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            >
              <Filter size={13} className="shrink-0" />
              <span className="hidden md:inline">{showFilters ? 'Ocultar filtros' : 'Filtros'}</span>
            </button>
            <NotificationBell />
            <MapAccountMenu />
          </div>
        </div>

        {showFilters && (
          <div className="glass shadow-md px-3 py-2 flex items-center gap-2 animate-slide-down select-none relative h-12 transition-all duration-300 z-10">
            <button
              type="button"
              onClick={clearCategories}
              className={`btn py-1.5 px-3 h-8 shrink-0 text-xs font-bold flex items-center justify-center gap-1.5 rounded-pill select-none transition-all duration-200 border ${
                selectedCategories.length === 0
                  ? 'bg-foreground text-background border-foreground font-extrabold shadow-sm'
                  : 'bg-surface-2 text-muted border-border hover:bg-surface-3 hover:text-foreground'
              }`}
            >
              <Sparkles size={12} className="shrink-0 animate-pulse-slow" />
              Todos
            </button>
            <div className="w-px h-6 bg-border shrink-0" />
            <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 h-full items-center">
              {Object.values(CATEGORIES).map((category) => {
                const active = isCategorySelected(category.id);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`btn shrink-0 px-3 h-8 text-xs font-semibold rounded-pill flex items-center gap-1.5 border select-none transition-all duration-200 cursor-pointer ${
                      active
                        ? 'font-extrabold scale-[1.03] shadow-sm'
                        : 'bg-surface-2/60 text-muted border-border hover:bg-surface-3 hover:text-foreground'
                    }`}
                    style={active ? { backgroundColor: category.color, borderColor: category.color, color: '#080d1a' } : undefined}
                  >
                    <CategoryIcon
                      name={category.iconName}
                      size={13}
                      color={active ? '#080d1a' : category.color}
                      className="shrink-0"
                    />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
