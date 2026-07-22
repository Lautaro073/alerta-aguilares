import { z } from 'zod';
import { CATEGORY_IDS } from '@/lib/constants/categories';

/**
 * Schema de validacion para la creacion de un nuevo reporte.
 * Protege la integridad del contenido recibido por la API.
 */
export const CreateReportSchema = z.object({
  lat: z
    .number({ message: 'La latitud es obligatoria.' })
    .min(-90, 'La latitud no es valida.')
    .max(90, 'La latitud no es valida.'),
  lng: z
    .number({ message: 'La longitud es obligatoria.' })
    .min(-180, 'La longitud no es valida.')
    .max(180, 'La longitud no es valida.'),
  category: z.enum(CATEGORY_IDS, {
    message: 'Categoria de reporte invalida.',
  }),
  title: z
    .string({ message: 'El titulo es obligatorio.' })
    .min(5, 'El titulo debe tener al menos 5 caracteres.')
    .max(80, 'El titulo no puede superar los 80 caracteres.')
    .trim(),
  description: z
    .string()
    .max(500, 'La descripcion no puede superar los 500 caracteres.')
    .trim()
    .nullable()
    .optional()
    .default(null),
  images: z
    .array(z.string().url('URL de foto invalida.'))
    .optional()
    .default([]),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  fingerprintVisitorId: z
    .string({ message: 'El identificador del navegador es obligatorio.' })
    .min(10, 'El identificador del navegador es demasiado corto.')
    .max(128, 'El identificador del navegador es demasiado largo.'),
  userId: z.string().optional(),
  userDisplayName: z.string().optional(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

/**
 * Schema de validacion para filtrar los reportes en las peticiones GET.
 * Soporta query params individuales (?category=BACHE) o multiples (?category=BACHE&category=ALUMBRADO).
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
  timeframe: z.enum(['24h', '7d', '30d', 'all']).default('all'),
  south: z.coerce.number().optional(),
  north: z.coerce.number().optional(),
  west: z.coerce.number().optional(),
  east: z.coerce.number().optional(),
});

export type GetReportsQueryInput = z.infer<typeof GetReportsQuerySchema>;
