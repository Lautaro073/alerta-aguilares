import { z } from 'zod';
import { CATEGORY_IDS } from '@/lib/constants/categories';
import { AGUILARES_BOUNDS } from '@/lib/constants/map';

/**
 * Schema de validación para la creación de un nuevo reporte.
 * Protege la integridad del contenido y restringe geográficamente los reportes a Aguilares.
 */
export const CreateReportSchema = z.object({
  lat: z
    .number({ message: 'La latitud es obligatoria.' })
    .min(AGUILARES_BOUNDS.bbox.south, 'La ubicación está fuera de los límites sur de Aguilares.')
    .max(AGUILARES_BOUNDS.bbox.north, 'La ubicación está fuera de los límites norte de Aguilares.'),
  lng: z
    .number({ message: 'La longitud es obligatoria.' })
    .min(AGUILARES_BOUNDS.bbox.west, 'La ubicación está fuera de los límites oeste de Aguilares.')
    .max(AGUILARES_BOUNDS.bbox.east, 'La ubicación está fuera de los límites este de Aguilares.'),
  category: z.enum(CATEGORY_IDS, {
    message: 'Categoría de reporte inválida.',
  }),
  title: z
    .string({ message: 'El título es obligatorio.' })
    .min(5, 'El título debe tener al menos 5 caracteres.')
    .max(80, 'El título no puede superar los 80 caracteres.')
    .trim(),
  description: z
    .string()
    .max(500, 'La descripción no puede superar los 500 caracteres.')
    .trim()
    .nullable()
    .optional()
    .default(null),
  images: z
    .array(z.string().url('URL de foto inválida.'))
    .optional()
    .default([]),
  fingerprintVisitorId: z
    .string({ message: 'El identificador del navegador es obligatorio.' })
    .min(10, 'El identificador del navegador es demasiado corto.')
    .max(128, 'El identificador del navegador es demasiado largo.'),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

/**
 * Schema de validación para filtrar los reportes en las peticiones GET.
 * Soporta query params individuales (?category=BACHE) o múltiples (?category=BACHE&category=BASURA).
 */
export const GetReportsQuerySchema = z.object({
  category: z
    .preprocess((val) => {
      if (typeof val === 'string') return [val];
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.enum(CATEGORY_IDS)))
    .optional(),
  view: z.enum(['markers', 'heatmap']).default('markers'),
  limit: z.coerce.number().int().positive().max(2000).optional(),
  timeframe: z.enum(['7d', '30d', 'all']).default('all'),
});

export type GetReportsQueryInput = z.infer<typeof GetReportsQuerySchema>;

