export const CATEGORY_IDS = [
  'ACCIDENTE',
  'BACHE',
  'SEMAFORO',
  'SENALIZACION',
  'VEHICULO_ABANDONADO',
  'ALUMBRADO',
  'SEGURIDAD_URBANA',
  'RESIDUOS',
  'AGUA_CLOACAS',
  'ANEGAMIENTO',
  'ARBOLADO_PUBLICO',
  'CABLES_POSTES',
  'ESPACIOS_PUBLICOS',
  'VEREDAS_ACCESIBILIDAD',
] as const;

export type CategoryId = typeof CATEGORY_IDS[number];

export interface Category {
  id: CategoryId;
  iconName: string;
  name: string;
  label: string;
  color: string;
}

export const CATEGORIES: Record<CategoryId, Category> = {
  ACCIDENTE: {
    id: 'ACCIDENTE',
    iconName: 'AlertTriangle',
    name: 'Accidente de transito',
    label: 'Accidente',
    color: '#DC2626',
  },
  BACHE: {
    id: 'BACHE',
    iconName: 'Cone',
    name: 'Bache / Pozo en calzada',
    label: 'Bache',
    color: '#EF4444',
  },
  SEMAFORO: {
    id: 'SEMAFORO',
    iconName: 'TrafficLight',
    name: 'Semaforo roto o fuera de servicio',
    label: 'Semaforo',
    color: '#F43F5E',
  },
  SENALIZACION: {
    id: 'SENALIZACION',
    iconName: 'Signpost',
    name: 'Señalizacion danada o faltante',
    label: 'Señalizacion',
    color: '#F97316',
  },
  VEHICULO_ABANDONADO: {
    id: 'VEHICULO_ABANDONADO',
    iconName: 'Car',
    name: 'Vehiculo abandonado',
    label: 'Vehiculo abandonado',
    color: '#7C3AED',
  },
  ALUMBRADO: {
    id: 'ALUMBRADO',
    iconName: 'Lightbulb',
    name: 'Falla de alumbrado publico',
    label: 'Alumbrado',
    color: '#CA8A04',
  },
  SEGURIDAD_URBANA: {
    id: 'SEGURIDAD_URBANA',
    iconName: 'ShieldAlert',
    name: 'Lugar percibido como inseguro o peligroso',
    label: 'Zona insegura',
    color: '#2563EB',
  },
  RESIDUOS: {
    id: 'RESIDUOS',
    iconName: 'Trash2',
    name: 'Residuos o microbasural',
    label: 'Residuos',
    color: '#16A34A',
  },
  AGUA_CLOACAS: {
    id: 'AGUA_CLOACAS',
    iconName: 'Droplets',
    name: 'Perdida de agua o problema cloacal',
    label: 'Agua y cloacas',
    color: '#0891B2',
  },
  ANEGAMIENTO: {
    id: 'ANEGAMIENTO',
    iconName: 'Waves',
    name: 'Desague obstruido o anegamiento',
    label: 'Desagües y anegamientos',
    color: '#0284C7',
  },
  ARBOLADO_PUBLICO: {
    id: 'ARBOLADO_PUBLICO',
    iconName: 'TreePine',
    name: 'Arbol o rama con riesgo en la via publica',
    label: 'Arbolado público',
    color: '#15803D',
  },
  CABLES_POSTES: {
    id: 'CABLES_POSTES',
    iconName: 'Cable',
    name: 'Cable o poste dañado',
    label: 'Cables y postes',
    color: '#9333EA',
  },
  ESPACIOS_PUBLICOS: {
    id: 'ESPACIOS_PUBLICOS',
    iconName: 'Landmark',
    name: 'Daño en plaza o mobiliario urbano',
    label: 'Espacios públicos',
    color: '#DB2777',
  },
  VEREDAS_ACCESIBILIDAD: {
    id: 'VEREDAS_ACCESIBILIDAD',
    iconName: 'Accessibility',
    name: 'Vereda dañada o problema de accesibilidad',
    label: 'Veredas y accesibilidad',
    color: '#EA580C',
  },
};
