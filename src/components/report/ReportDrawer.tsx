'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import CategoryPicker from './CategoryPicker';
import ReportFormFields from './ReportFormFields';
import { CATEGORIES, CategoryId } from '@/lib/constants/categories';
import { AGUILARES_BOUNDS } from '@/lib/constants/map';
import { getVisitorId } from '@/lib/utils/fingerprint';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { X, Check, AlertOctagon, MapPin, Bell, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getAppCheckToken } from '@/lib/firebase/appCheckClient';

// Importación dinámica de ReportMiniMap para prevenir fallos en SSR de Leaflet
const ReportMiniMap = dynamic(() => import('./ReportMiniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[180px] flex flex-col items-center justify-center bg-surface-1 rounded-lg border border-border/80 text-muted gap-2">
      <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-accent animate-spin"></div>
      <p className="font-jakarta text-[11px] animate-pulse">Cargando mapa de precisión...</p>
    </div>
  ),
});

interface ReportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mapCenter: { lat: number; lng: number } | null;
  onReportCreated?: () => void;
}

export default function ReportDrawer({
  isOpen,
  onClose,
  mapCenter,
  onReportCreated,
}: ReportDrawerProps) {
  // Estados del formulario y flujo de pasos
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [lat, setLat] = useState<number>(mapCenter?.lat ?? AGUILARES_BOUNDS.center.lat);
  const [lng, setLng] = useState<number>(mapCenter?.lng ?? AGUILARES_BOUNDS.center.lng);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);

  // Estados de carga, éxito y error
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ title?: string | undefined; description?: string | undefined }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  // Manejar cambio de ubicación desde el mini-mapa
  const handleLocationChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  // Validar paso actual antes de avanzar
  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedCategory) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  // Enviar el reporte a la API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3 || isSubmitting) return;

    // Validación básica del lado del cliente antes de enviar
    const titleError = title.trim().length < 5 
      ? 'El título debe tener al menos 5 caracteres.' 
      : title.trim().length > 80 
        ? 'El título no puede superar los 80 caracteres.' 
        : undefined;

    const descError = description.trim().length > 500
      ? 'La descripción no puede superar los 500 caracteres.'
      : undefined;

    if (titleError || descError) {
      setErrors({ title: titleError, description: descError });
      return;
    }

    setErrors({});
    setApiError(null);
    setIsSubmitting(true);

    try {
      // 1. Obtener huella digital del visitante
      const visitorId = await getVisitorId();

      // 2. Realizar petición POST
      const appCheckToken = await getAppCheckToken();
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {}),
        },
        body: JSON.stringify({
          lat,
          lng,
          category: selectedCategory,
          title: title.trim(),
          description: description.trim() || null,
          images,
          fingerprintVisitorId: visitorId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ocurrió un error inesperado al enviar el reporte.');
      }

      // Éxito
      setIsSuccess(true);
      if (onReportCreated) {
        onReportCreated();
      }
    } catch (err: unknown) {
      console.error('🔴 [REPORT_DRAWER] Error de envío:', err);
      const errorMessage = err instanceof Error ? err.message : 'No se pudo conectar con el servidor. Reintentá en unos momentos.';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategoryConfig = selectedCategory ? CATEGORIES[selectedCategory] : null;

  return (
    <>
      {/* Fondo opaco difuminado para móviles y computadoras */}
      <div
        onClick={!isSubmitting && !isSuccess ? onClose : undefined}
        className="fixed inset-0 z-[1100] bg-background/60 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
      />

      {/* Contenedor del Drawer / Sheet (Adaptativo) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1200] max-h-[90vh] bg-surface-2 rounded-t-2xl border-t border-border shadow-lg flex flex-col p-5 animate-slide-up pointer-events-auto
                   md:bottom-4 md:right-4 md:left-auto md:w-[400px] md:rounded-xl md:border md:max-h-[640px] md:shadow-glow"
      >
        {/* Handle visual de arrastre exclusivo para móviles */}
        <div className="w-12 h-1 bg-border-strong rounded-full mx-auto mb-4 shrink-0 md:hidden" />

        {/* Encabezado Principal */}
        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex flex-col">
            <h2 className="font-outfit font-extrabold text-lg text-foreground tracking-tight leading-none select-none">
              Crear Alerta Ciudadana
            </h2>
            <span className="font-jakarta text-[10px] text-muted font-bold tracking-wider uppercase mt-1 select-none">
              Paso {step} de 3 — {step === 1 ? 'Categoría' : step === 2 ? 'Ubicación' : 'Detalles'}
            </span>
          </div>

          {/* Botón de Cerrar (Deshabilitado si está enviando) */}
          {!isSubmitting && !isSuccess && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-1 border border-border text-muted hover:text-foreground hover:bg-surface-3 transition-colors shrink-0"
              title="Cerrar"
              aria-label="Cerrar panel de reporte"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Barra de Progreso Lineal Premium */}
        <div className="w-full h-1 bg-surface-1 rounded-full overflow-hidden mb-4 shrink-0 select-none">
          <div
            className="h-full bg-gradient-to-r from-accent via-indigo-400 to-[#06b6d4] transition-all duration-300 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* CONTENIDO INTERNO DEL PASO */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar flex flex-col justify-between gap-5 pb-2">
          
          {/* RENDERIZADO DE PANTALLA DE ÉXITO */}
          {isSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center select-none animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-4 animate-bounce" style={{ animationDuration: '2s' }}>
                <Check size={32} className="text-emerald-400" />
              </div>
              <h3 className="font-outfit font-extrabold text-lg text-foreground tracking-tight mb-2">
                ¡Alerta Reportada!
              </h3>
              <p className="font-jakarta text-xs text-muted leading-relaxed max-w-[280px] mb-6">
                El reporte fue publicado con éxito en el mapa interactivo. Los vecinos ahora pueden verlo en tiempo real.
              </p>
              
              {currentCategoryConfig && (
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold mb-6"
                  style={{
                    backgroundColor: `${currentCategoryConfig.color}10`,
                    borderColor: `${currentCategoryConfig.color}25`,
                    color: currentCategoryConfig.color,
                  }}
                >
                  <CategoryIcon name={currentCategoryConfig.iconName} size={14} color={currentCategoryConfig.color} className="shrink-0" />
                  <span>{currentCategoryConfig.name}</span>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary w-full h-11 font-outfit"
              >
                Listo, volver al mapa
              </button>
            </div>
          ) : (
            <>
              {/* VISTAS DE CADA PASO */}
              <div className="flex flex-col gap-4">
                
                {/* Paso 1: Selección de Categoría */}
                {step === 1 && (
                  <CategoryPicker
                    selectedCategory={selectedCategory}
                    onSelectCategory={(catId) => {
                      setSelectedCategory(catId);
                      // Auto-avanzar al paso 2 tras una leve transición táctil
                      setTimeout(() => {
                        setStep(2);
                      }, 200);
                    }}
                  />
                )}

                {/* Paso 2: MiniMapa Ubicación */}
                {step === 2 && (
                  <div className="animate-fade-in">
                    <ReportMiniMap
                      lat={lat}
                      lng={lng}
                      onChangeLocation={handleLocationChange}
                    />
                  </div>
                )}

                {/* Paso 3: Campos de Texto (Formulario Completo) */}
                {step === 3 && (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in">
                    {/* Resumen visual de los pasos previos */}
                    <div className="bg-surface-1/40 border border-border/30 rounded-lg p-3 flex flex-col gap-2 shrink-0 select-none">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted font-jakarta">Incidente:</span>
                        {currentCategoryConfig && (
                          <span 
                            className="font-bold flex items-center gap-1.5"
                            style={{ color: currentCategoryConfig.color }}
                          >
                            <CategoryIcon name={currentCategoryConfig.iconName} size={13} color={currentCategoryConfig.color} className="shrink-0" />
                            <span>{currentCategoryConfig.name.split(' / ')[0]}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-border/20 pt-1.5">
                        <span className="text-muted font-jakarta">Coordenadas:</span>
                        <span className="font-mono text-foreground/80 text-[10.5px] flex items-center gap-1">
                          <MapPin size={10} className="shrink-0 text-muted" />
                          <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                        </span>
                      </div>
                    </div>

                    <ReportFormFields
                      title={title}
                      description={description}
                      images={images}
                      onChangeTitle={setTitle}
                      onChangeDescription={setDescription}
                      onChangeImages={setImages}
                      errors={errors}
                    />
                  </form>
                )}

                {/* Mensaje de error general de la API */}
                {apiError && (
                  <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg flex flex-col gap-1 select-none animate-slide-down shrink-0">
                    <span className="font-jakarta text-[11px] font-bold text-rose-400 flex items-center gap-1">
                      <AlertOctagon size={13} className="shrink-0" />
                      <span>Ocurrió un inconveniente:</span>
                    </span>
                    <p className="font-jakarta text-[10.5px] text-rose-300/90 leading-normal">
                      {apiError}
                    </p>
                  </div>
                )}

                {/* Nota de privacidad y seguridad */}
                {(step === 2 || step === 3) && (
                  <div className="flex items-center justify-center gap-1.5 text-center select-none py-1 border-t border-border/10 mt-1 shrink-0">
                    <span className="font-jakarta text-[9.5px] text-muted flex items-center gap-1.5 justify-center">
                      <Lock size={11} className="text-accent shrink-0" />
                      <span>Tu reporte es 100% anónimo. Leé nuestra{' '}</span>
                      <Link
                        href="/privacidad"
                        target="_blank"
                        className="text-accent hover:underline font-bold"
                      >
                        Política de Privacidad
                      </Link>
                    </span>
                  </div>
                )}
              </div>

              {/* BARRA DE CONTROLES INFERIORES */}
              <div className="flex items-center gap-3 border-t border-border/60 pt-3 mt-auto shrink-0 select-none">
                
                {/* Botón Volver */}
                {step > 1 && !isSubmitting && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn btn-ghost flex-1 h-11 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Volver</span>
                  </button>
                )}

                {/* Botón Siguiente / Enviar */}
                {step === 1 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!selectedCategory}
                    className={`btn flex-1 h-11 text-xs font-bold font-outfit transition-all flex items-center justify-center gap-1 ${
                      selectedCategory 
                        ? 'btn-primary' 
                        : 'bg-surface-3 text-muted/40 cursor-not-allowed border border-border'
                    }`}
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={14} />
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn btn-primary flex-1 h-11 text-xs font-bold font-outfit flex items-center justify-center gap-1"
                  >
                    <span>Confirmar Ubicación</span>
                    <ChevronRight size={14} />
                  </button>
                )}

                {step === 3 && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || title.trim().length < 5}
                    className={`btn flex-1 h-11 text-xs font-bold font-outfit transition-all flex items-center justify-center gap-2 ${
                      title.trim().length >= 5 && !isSubmitting
                        ? 'btn-primary'
                        : 'bg-surface-3 text-muted/40 cursor-not-allowed border border-border'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                        <span>Registrando...</span>
                      </>
                    ) : (
                      <>
                        <Bell size={14} className="shrink-0 animate-pulse-slow" />
                        <span>Registrar Alerta</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
