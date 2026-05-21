import { useState, useEffect } from 'react';
import { CategoryId } from '@/lib/constants/categories';

const CATEGORIES_KEY = 'ciudadalerta_filter_categories';
const VIEW_KEY = 'ciudadalerta_filter_view';
const TIMEFRAME_KEY = 'ciudadalerta_filter_timeframe';

export type TimeframeId = '24h' | '7d' | '30d' | 'all';

/**
 * Hook personalizado para orquestar y persistir el estado de los filtros del mapa.
 * 
 * Guarda las preferencias en sessionStorage de modo que persistan ante recargas accidentales (F5)
 * pero se limpien automáticamente al cerrar la pestaña o terminar la sesión del usuario.
 */
export function useMapFilter() {
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const [selectedView, setSelectedView] = useState<'markers' | 'heatmap'>('markers');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeId>('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar estado desde sessionStorage del lado del cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedCategories = sessionStorage.getItem(CATEGORIES_KEY);
        const cachedView = sessionStorage.getItem(VIEW_KEY);
        const cachedTimeframe = sessionStorage.getItem(TIMEFRAME_KEY);

        if (cachedCategories) {
          setSelectedCategories(JSON.parse(cachedCategories) as CategoryId[]);
        }
        if (cachedView === 'markers' || cachedView === 'heatmap') {
          setSelectedView(cachedView);
        }
        if (cachedTimeframe === '24h' || cachedTimeframe === '7d' || cachedTimeframe === '30d' || cachedTimeframe === 'all') {
          setSelectedTimeframe(cachedTimeframe);
        }
      } catch (error) {
        console.error('⚠️ [MAP_FILTER] Error al recuperar filtros guardados:', error);
      } finally {
        setIsInitialized(true);
      }
    }
  }, []);

  // Actualizar categorías y persistir
  const updateCategories = (categories: CategoryId[]) => {
    setSelectedCategories(categories);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      } catch (error) {
        console.error('⚠️ [MAP_FILTER] Error al guardar categorías:', error);
      }
    }
  };

  // Actualizar modo de vista (markers/heatmap) y persistir
  const updateView = (view: 'markers' | 'heatmap') => {
    setSelectedView(view);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(VIEW_KEY, view);
      } catch (error) {
        console.error('⚠️ [MAP_FILTER] Error al guardar vista:', error);
      }
    }
  };

  // Actualizar timeframe y persistir
  const updateTimeframe = (timeframe: TimeframeId) => {
    setSelectedTimeframe(timeframe);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(TIMEFRAME_KEY, timeframe);
      } catch (error) {
        console.error('⚠️ [MAP_FILTER] Error al guardar timeframe:', error);
      }
    }
  };

  // Alternar (activar/desactivar) una categoría en el filtro
  const toggleCategory = (category: CategoryId) => {
    if (selectedCategories.includes(category)) {
      updateCategories(selectedCategories.filter((c) => c !== category));
    } else {
      updateCategories([...selectedCategories, category]);
    }
  };

  // Limpiar selección (muestra todos los reportes, sin filtros aplicados)
  const clearCategories = () => {
    updateCategories([]);
  };

  // Determinar si una categoría está explícitamente seleccionada en los filtros
  const isCategorySelected = (category: CategoryId): boolean => {
    return selectedCategories.includes(category);
  };

  // Determinar si una categoría está activa en la visualización
  // (Si no hay ninguna seleccionada, se asume que todas están activas para renderizado)
  const isCategoryActive = (category: CategoryId): boolean => {
    return selectedCategories.length === 0 || selectedCategories.includes(category);
  };

  return {
    selectedCategories,
    selectedView,
    selectedTimeframe,
    isInitialized,
    toggleCategory,
    clearCategories,
    isCategorySelected,
    isCategoryActive,
    setView: updateView,
    setTimeframe: updateTimeframe,
  };
}
