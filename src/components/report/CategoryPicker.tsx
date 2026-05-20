'use client';

import { CATEGORIES, CategoryId } from '@/lib/constants/categories';
import CategoryIcon from '@/components/ui/CategoryIcon';

interface CategoryPickerProps {
  selectedCategory: CategoryId | null;
  onSelectCategory: (category: CategoryId) => void;
}

/**
 * Selector de categoría rediseñado.
 * Patrón icono-arriba / texto-abajo: consistente, táctil y sin overflow de texto.
 */
export default function CategoryPicker({
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  const categoriesList = Object.values(CATEGORIES);

  return (
    <div className="flex flex-col gap-3 shrink-0">
      <div className="flex flex-col">
        <h3 className="font-outfit font-extrabold text-sm text-foreground tracking-wide select-none">
          ¿Qué tipo de problema es?
        </h3>
        <p className="font-jakarta text-[11px] text-muted leading-tight mt-0.5 select-none">
          Seleccioná una categoría para continuar.
        </p>
      </div>

      {/* Grilla 3 columnas — icono arriba, texto abajo */}
      <div className="grid grid-cols-3 gap-2">
        {categoriesList.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`
                relative flex flex-col items-center justify-center gap-2
                h-[84px] rounded-xl border transition-all duration-200 select-none
                ${isSelected
                  ? 'border-transparent scale-[1.04] shadow-lg'
                  : 'bg-surface-1 border-border hover:border-border-strong hover:bg-surface-3 active:scale-95'
                }
              `}
              style={
                isSelected
                  ? {
                      backgroundColor: `${cat.color}18`,
                      borderColor: `${cat.color}60`,
                      boxShadow: `0 0 0 1px ${cat.color}40, 0 4px 16px ${cat.color}25`,
                    }
                  : undefined
              }
            >
              {/* Contenedor del icono */}
              <div
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                  ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}
                `}
                style={
                  isSelected
                    ? { backgroundColor: `${cat.color}20` }
                    : { backgroundColor: 'rgba(255,255,255,0.05)' }
                }
              >
                <CategoryIcon
                  name={cat.iconName}
                  size={22}
                  color={isSelected ? cat.color : undefined}
                  className={isSelected ? '' : 'text-muted'}
                />
              </div>

              {/* Etiqueta corta */}
              <span
                className="font-jakarta text-[11px] font-semibold leading-tight text-center px-1 line-clamp-2"
                style={{ color: isSelected ? cat.color : undefined }}
              >
                {cat.label}
              </span>

              {/* Indicador de selección — punto en esquina */}
              {isSelected && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
