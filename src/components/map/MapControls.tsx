'use client';

import { useState, useEffect, useRef } from 'react';
import { CATEGORIES, CategoryId } from '@/lib/constants/categories';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import { Shield, MapPin, Flame, Sparkles, ChevronLeft, ChevronRight, Filter, User, LogOut } from 'lucide-react';
import NotificationBell from '@/components/layout/NotificationBell';

interface MapControlsProps {
  selectedCategories: CategoryId[];
  selectedView: 'markers' | 'heatmap';
  toggleCategory: (category: CategoryId) => void;
  clearCategories: () => void;
  setView: (view: 'markers' | 'heatmap') => void;
  isCategorySelected: (category: CategoryId) => boolean;
}

/**
 * Componente flotante de controles para filtrar categorías y cambiar entre vistas.
 * Utiliza iconos de Lucide premium y proporciona una fila scrollable con flechas de navegación
 * de alta fidelidad para asegurar usabilidad táctil y con mouse en PC.
 */
export default function MapControls({
  selectedCategories,
  selectedView,
  toggleCategory,
  clearCategories,
  setView,
  isCategorySelected,
}: MapControlsProps) {
  const categoriesList = Object.values(CATEGORIES);
  const totalSelected = selectedCategories.length;

  const [showFilters, setShowFilters] = useState(true);
  const { user, profile, isAdmin, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Verifica y actualiza la visibilidad de los botones de navegación lateral
  const updateScrollArrows = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      // Mostrar flecha izquierda si se ha hecho scroll a la derecha
      setShowLeftArrow(scrollLeft > 2);
      // Mostrar flecha derecha si hay más contenido para hacer scroll (con un offset de tolerancia)
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return () => {};
    }

    updateScrollArrows();
    container.addEventListener('scroll', updateScrollArrows);
    window.addEventListener('resize', updateScrollArrows);

    // Programar una verificación tras renderizar los elementos
    const timer = setTimeout(updateScrollArrows, 300);

    return () => {
      container.removeEventListener('scroll', updateScrollArrows);
      window.removeEventListener('resize', updateScrollArrows);
      clearTimeout(timer);
    };
  }, []);

  // Realizar desplazamiento horizontal animado al hacer click en los chevrons
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="absolute top-4 left-0 right-0 z-[1000] px-4 pointer-events-none">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-3 pointer-events-auto">
        
        {/* Barra superior de Marca y Tipo de Vista */}
        <div className="glass-strong px-3 md:px-4 py-3 shadow-md flex items-center justify-between gap-4 animate-slide-down relative z-20">
          {/* Logo / Nombre de marca */}
          <div className="flex items-center gap-2 md:gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow shadow-accent/10">
              <Shield size={18} className="animate-pulse-slow shrink-0" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-outfit font-extrabold text-sm md:text-lg tracking-tight leading-none text-foreground flex items-center gap-1 select-none">
                Alertas<span className="gradient-text">Aguilares</span>
              </h1>
              <span className="font-jakarta font-semibold text-[9px] md:text-[10px] text-muted tracking-wider uppercase leading-none mt-1 select-none">
                Participación Ciudadana
              </span>
            </div>
          </div>
          {/* Controles de Acción (Filtros, Selector de vistas y Login) */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Botón premium para alternar visibilidad de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-1.5 h-10 px-2.5 md:px-3.5 rounded-pill font-outfit text-xs font-bold border transition-all duration-300 select-none cursor-pointer ${
                showFilters
                  ? 'bg-surface-2/80 text-foreground border-border hover:bg-surface-3'
                  : 'bg-accent/15 border-accent/40 text-accent hover:bg-accent/25 shadow shadow-accent/5'
              }`}
              title={showFilters ? "Ocultar filtros de categoría" : "Mostrar filtros de categoría"}
            >
              <Filter size={13} className="shrink-0" />
              <span className="hidden md:inline">{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
              <span className="md:hidden">Filtros</span>
            </button>

            {/* Selector de vistas (Markers vs Heatmap) */}
            <div className="hidden xs:flex bg-background/80 border border-border p-0.5 rounded-pill relative overflow-hidden self-center h-10 w-32 md:w-44 select-none">
              <button
                onClick={() => setView('markers')}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 font-outfit text-[10px] md:text-xs font-bold rounded-pill transition-all duration-300 relative z-10 ${
                  selectedView === 'markers'
                    ? 'text-white bg-accent shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
                style={{ minHeight: '36px' }}
                title="Ver marcadores detallados"
              >
                <MapPin size={12} className="shrink-0" />
                <span>Puntos</span>
              </button>
              <button
                onClick={() => setView('heatmap')}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-1.5 font-outfit text-[10px] md:text-xs font-bold rounded-pill transition-all duration-300 relative z-10 ${
                  selectedView === 'heatmap'
                    ? 'text-white bg-accent shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
                style={{ minHeight: '36px' }}
                title="Ver mapa de calor"
              >
                <Flame size={12} className="shrink-0" />
                <span>Calor</span>
              </button>
            </div>

            {/* Campana de notificaciones push */}
            <NotificationBell />

            {/* Botón de Login / Menú de Usuario */}
            {!user ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center justify-center gap-1.5 h-10 px-3 md:px-4 rounded-pill font-outfit text-xs font-bold bg-accent border border-accent hover:bg-accent/95 hover:shadow-glow hover:shadow-accent/30 text-white transition-all duration-300 cursor-pointer shadow shadow-accent/20 active:scale-95 shrink-0"
              >
                <User size={13} className="shrink-0" />
                <span>Ingresar</span>
              </button>
            ) : (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-10 h-10 rounded-full border border-border hover:border-border-strong bg-surface-2 hover:bg-surface-3 transition-all duration-200 cursor-pointer overflow-hidden relative active:scale-95"
                  title={profile?.displayName || user.displayName || 'Vecino'}
                >
                  {profile?.photoURL || user.photoURL ? (
                    <img
                      src={profile?.photoURL || user.photoURL || ''}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/15 text-accent font-outfit font-extrabold text-sm">
                      {(profile?.displayName || user.displayName || 'V').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                
                {/* Menú Desplegable */}
                {showUserMenu && (
                  <>
                    <div
                      onClick={() => setShowUserMenu(false)}
                      className="fixed inset-0 z-[1000] cursor-default"
                    />
                    <div className="absolute right-0 mt-2 w-48 glass-strong border border-white/10 rounded-xl shadow-glow py-1.5 z-[1010] animate-scale-in text-left pointer-events-auto font-jakarta">
                      <div className="px-3 py-2 border-b border-border select-none">
                        <p className="font-outfit font-bold text-xs text-foreground truncate">
                          {profile?.displayName || user.displayName || 'Vecino'}
                        </p>
                        <p className="font-jakarta text-[10px] text-muted truncate mt-0.5">
                          {profile?.email || user.email}
                        </p>
                      </div>
                      
                      {isAdmin && (
                        <a
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-yellow-400 hover:bg-surface-3 transition-colors select-none"
                        >
                          <Shield size={13} className="shrink-0 text-yellow-400" />
                          <span>Panel de Moderación</span>
                        </a>
                      )}
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-surface-3 transition-colors select-none cursor-pointer border-none bg-transparent"
                      >
                        <LogOut size={13} className="shrink-0 text-red-400" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Modal de Autenticación */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
          </div>
        </div>

        {/* Barra de Filtros en una sola fila scrollable */}
        {showFilters && (
          <div className="glass shadow-md px-3 py-2 flex items-center gap-2 animate-slide-down select-none relative group/filters h-12 transition-all duration-300 z-10">
            {/* Chip de "Todos" (Limpia filtros) */}
            <button
              onClick={clearCategories}
              className={`btn py-1.5 px-3 h-8 shrink-0 text-xs font-bold flex items-center justify-center gap-1.5 rounded-pill select-none transition-all duration-200 border ${
                totalSelected === 0
                  ? 'bg-foreground text-background border-foreground font-extrabold shadow-sm'
                  : 'bg-surface-2 text-muted border-border hover:bg-surface-3 hover:text-foreground'
              }`}
            >
              <Sparkles size={12} className="shrink-0 animate-pulse-slow" />
              <span>Todos</span>
            </button>

            {/* Separador vertical sutil */}
            <div className="w-[1px] h-6 bg-border shrink-0" />

            {/* Contenedor del scroll de filtros */}
            <div className="flex-1 relative overflow-hidden flex items-center h-full">
              
              {/* Flecha de desplazamiento izquierda (visible en PC al hacer hover si hay overflow) */}
              {showLeftArrow && (
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 z-25 w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:bg-surface-3 hover:text-accent shadow-md transition-all duration-200 active:scale-90 cursor-pointer pointer-events-auto"
                  title="Desplazar a la izquierda"
                >
                  <ChevronLeft size={14} />
                </button>
              )}

              {/* Fila horizontal scrollable de categorías */}
              <div
                ref={scrollContainerRef}
                className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 h-full items-center"
                style={{ scrollbarWidth: 'none' }}
              >
                {categoriesList.map((cat) => {
                  const active = isCategorySelected(cat.id);
                  const colorStyle = active
                    ? {
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                        color: '#080d1a',
                      }
                    : undefined;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`btn shrink-0 px-3 h-8 text-xs font-semibold rounded-pill flex items-center gap-1.5 border select-none transition-all duration-200 cursor-pointer pointer-events-auto ${
                        active
                          ? 'font-extrabold scale-[1.03] shadow-sm'
                          : 'bg-surface-2/60 text-muted border-border hover:bg-surface-3 hover:text-foreground'
                      }`}
                      style={colorStyle}
                    >
                      <CategoryIcon
                        name={cat.iconName}
                        size={13}
                        color={active ? '#080d1a' : cat.color}
                        className="shrink-0"
                      />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Flecha de desplazamiento derecha (visible en PC al hacer hover si hay overflow) */}
              {showRightArrow && (
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 z-25 w-7 h-7 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:bg-surface-3 hover:text-accent shadow-md transition-all duration-200 active:scale-90 cursor-pointer pointer-events-auto"
                  title="Desplazar a la derecha"
                >
                  <ChevronRight size={14} />
                </button>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
