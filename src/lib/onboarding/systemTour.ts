'use client';

import { driver, type DriveStep, type Driver } from 'driver.js';

type TourRole = 'operator' | 'official' | 'admin';
type TourSurface = 'map' | 'admin';
type FeatureTour = 'report-category' | 'report-location' | 'report-details' | 'admin-home' | 'admin-alerts' | 'admin-employees' | 'admin-stats' | 'admin-config';

const TOUR_VERSION = 2;
let activeTour: Driver | null = null;

const PUBLIC_MAP_STEPS: DriveStep[] = [
  { element: '[data-tour="map-header"]', popover: { title: 'Mapa de alertas', description: 'Desde esta barra accedes a los filtros, notificaciones y tu cuenta.' } },
  { element: '[data-tour="map-filters"]', popover: { title: 'Filtrar alertas', description: 'Mostra solo las categorias que necesitas revisar en el mapa.' } },
  { element: '.leaflet-container', popover: { title: 'Explora Aguilares', description: 'Acerca, aleja y selecciona los marcadores para consultar cada alerta.' } },
  { element: '[data-tour="map-account"]', popover: { title: 'Inicia sesion', description: 'El mapa es publico. Ingresa solamente cuando necesites registrar o confirmar una alerta.' } },
];

const AUTHENTICATED_MAP_STEPS: DriveStep[] = [
  { element: '[data-tour="map-create-alert"]', popover: { title: 'Crear una alerta', description: 'Registra un problema indicando ubicacion, categoria, prioridad y detalle.' } },
  { element: '[data-tour="map-account"]', popover: { title: 'Tu cuenta', description: 'Desde aqui puedes entrar al panel, repetir este recorrido o cerrar sesion.' } },
];

const ADMIN_STEPS: Record<TourRole, DriveStep[]> = {
  operator: [],
  official: [
    { element: '.admin-brand', popover: { title: 'Panel municipal', description: 'Este espacio concentra el seguimiento de las alertas de Aguilares.' } },
    { element: '[data-tour="admin-nav-alerts"]', popover: { title: 'Gestion de alertas', description: 'Revisa, deriva y actualiza el estado de las alertas.' } },
    { element: '[data-tour="admin-nav-stats"]', popover: { title: 'Indicadores', description: 'Consulta el mapa de calor, tiempos de resolucion y resultados.' } },
    { element: '.admin-profile', popover: { title: 'Tu cuenta', description: 'Vuelve al mapa, repite este recorrido o cierra sesion.' } },
  ],
  admin: [
    { element: '.admin-brand', popover: { title: 'Panel municipal', description: 'Administra alertas, empleados y configuracion desde un solo lugar.' } },
    { element: '[data-tour="admin-nav-alerts"]', popover: { title: 'Alertas', description: 'Supervisa estados, derivaciones, duplicados e historial.' } },
    { element: '[data-tour="admin-nav-employees"]', popover: { title: 'Empleados', description: 'Crea empleados y administra sus roles y accesos.' } },
    { element: '[data-tour="admin-nav-stats"]', popover: { title: 'Estadisticas', description: 'Analiza volumen, ubicacion y tiempos de resolucion.' } },
    { element: '[data-tour="admin-nav-config"]', popover: { title: 'Configuracion', description: 'Gestiona las categorias y areas municipales disponibles.' } },
    { element: '.admin-profile', popover: { title: 'Tu cuenta', description: 'Vuelve al mapa, repite este recorrido o cierra sesion.' } },
  ],
};

const FEATURE_STEPS: Record<FeatureTour, DriveStep[]> = {
  'report-category': [
    { element: '[data-tour="report-header"]', popover: { title: 'Crear una alerta', description: 'La carga se completa en tres pasos simples.' } },
    { element: '[data-tour="report-category"]', popover: { title: '1. Elegi la categoria', description: 'Selecciona el tipo de problema. Al hacerlo avanzaras a la ubicacion.' } },
  ],
  'report-location': [
    { element: '[data-tour="report-location"]', popover: { title: '2. Confirma la ubicacion', description: 'Mueve el punto si hace falta y verifica que marque el lugar correcto.' } },
    { element: '[data-tour="report-actions"]', popover: { title: 'Continuar', description: 'Confirma la ubicacion para completar los datos de la alerta.' } },
  ],
  'report-details': [
    { element: '[data-tour="report-details"]', popover: { title: '3. Describe el problema', description: 'Agrega un titulo claro, la prioridad y cualquier detalle util.' } },
    { element: '[data-tour="report-actions"]', popover: { title: 'Registrar alerta', description: 'Revisa los datos y envia la alerta al sistema.' } },
  ],
  'admin-home': [
    { element: '.admin-metrics', popover: { title: 'Resumen operativo', description: 'Muestra rapidamente la cantidad de alertas por estado.' } },
    { element: '.admin-data-table', popover: { title: 'Alertas importantes', description: 'Prioriza los casos que requieren atencion inmediata.' } },
    { element: '.admin-stats', popover: { title: 'Estado general', description: 'Consulta la resolucion por categoria y la actividad reciente.' } },
  ],
  'admin-alerts': [
    { element: '.admin-metrics', popover: { title: 'Estados de alertas', description: 'Selecciona una tarjeta para filtrar la tabla por ese estado.' } },
    { element: '.admin-data-table', popover: { title: 'Gestion de alertas', description: 'Busca, filtra, deriva y actualiza cada alerta desde la tabla.' } },
    { element: '.admin-incoming-card', popover: { title: 'Alertas entrantes', description: 'Revisa las alertas mas recientes sin perder el contexto de la tabla.' } },
  ],
  'admin-employees': [
    { element: '.admin-title-row', popover: { title: 'Gestion de empleados', description: 'Crea empleados y controla su acceso al sistema.' } },
    { element: '.admin-metrics', popover: { title: 'Resumen del personal', description: 'Consulta empleados activos y distribucion de roles.' } },
    { element: '.admin-data-table', popover: { title: 'Personal municipal', description: 'Busca, edita o desactiva empleados desde esta tabla.' } },
  ],
  'admin-stats': [
    { element: '.admin-date-filter-button', popover: { title: 'Periodo de analisis', description: 'Cambia el rango de fechas de todos los indicadores.' } },
    { element: '.admin-resolution-card', popover: { title: 'Tiempo de resolucion', description: 'Mide cuanto demora la resolucion en el periodo seleccionado.' } },
    { element: '.admin-stats-wide', popover: { title: 'Mapa de calor', description: 'Identifica las zonas con mayor concentracion de alertas.' } },
    { element: '.admin-stats-table', popover: { title: 'Resumen por categoria', description: 'Compara volumen, activas, resueltas y tasa de resolucion.' } },
  ],
  'admin-config': [
    { element: '.admin-config-actions', popover: { title: 'Crear configuracion', description: 'Agrega categorias o areas municipales nuevas.' } },
    { element: '.admin-config-categories', popover: { title: 'Categorias', description: 'Define area por defecto, prioridad y disponibilidad.' } },
    { element: '.admin-config-areas', popover: { title: 'Areas municipales', description: 'Gestiona responsables y disponibilidad de las areas.' } },
  ],
};

function isTourRole(role?: string | null): role is TourRole {
  return role === 'operator' || role === 'official' || role === 'admin';
}

function runTour(steps: DriveStep[], doneBtnText: string) {
  if (steps.length === 0) return;
  activeTour?.destroy();
  activeTour = driver({
    steps,
    popoverClass: 'aguilares-tour',
    showProgress: true,
    progressText: '{{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Anterior',
    doneBtnText,
    allowClose: true,
    allowKeyboardControl: true,
    smoothScroll: true,
    stagePadding: 8,
    stageRadius: 8,
    onDestroyed: () => { activeTour = null; },
  });
  activeTour.drive();
}

export function startSystemTour(surface: TourSurface, audience?: string | null) {
  if (surface === 'map') {
    runTour(audience === 'authenticated' ? AUTHENTICATED_MAP_STEPS : PUBLIC_MAP_STEPS, 'Finalizar');
    return;
  }
  if (!isTourRole(audience)) return;
  runTour(ADMIN_STEPS[audience], 'Finalizar');
}

export function startSystemTourOnce(surface: TourSurface, audience?: string | null) {
  if (surface === 'admin' && !isTourRole(audience)) return;
  const key = `aguilares.tour.${surface}.${audience || 'guest'}.v${TOUR_VERSION}`;
  if (window.localStorage.getItem(key)) return;
  window.localStorage.setItem(key, 'seen');
  window.setTimeout(() => startSystemTour(surface, audience), 500);
}

export function startFeatureTour(feature: FeatureTour) {
  runTour(FEATURE_STEPS[feature], 'Entendido');
}

export function startFeatureTourOnce(feature: FeatureTour, role?: string | null) {
  const key = `aguilares.tour.${feature}.${role || 'employee'}.v${TOUR_VERSION}`;
  if (window.localStorage.getItem(key)) return;
  window.localStorage.setItem(key, 'seen');
  window.setTimeout(() => startFeatureTour(feature), 350);
}
