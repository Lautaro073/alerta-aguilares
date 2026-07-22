export const CATEGORY_IDS = [
  'ACCIDENTE',
  'BACHE',
  'SEMAFORO',
  'SENALIZACION',
  'VEHICULO_ABANDONADO',
  'ALUMBRADO',
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
};
