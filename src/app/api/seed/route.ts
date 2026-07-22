import { CategoryId } from '@/lib/constants/categories';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { AGUILARES_BOUNDS } from '@/lib/constants/map';
import { hashValue } from '@/lib/server/hash';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mapSupabaseReportToReport, SupabaseReportRow } from '@/features/reports/server/reportMapper';

export const dynamic = 'force-dynamic';

const SEED_COUNT = 500;

const CATEGORIES: CategoryId[] = [
  'ACCIDENTE',
  'BACHE',
  'SENALIZACION',
  'VEHICULO_ABANDONADO',
  'ALUMBRADO',
];

const CATEGORY_COPY: Record<CategoryId, Array<{ title: string; description: string }>> = {
  ACCIDENTE: [
    { title: 'Choque en esquina transitada', description: 'Dos vehiculos quedaron detenidos y reducen la circulacion.' },
    { title: 'Siniestro vial con demora', description: 'El accidente genera retenciones y requiere ordenamiento del transito.' },
    { title: 'Moto involucrada en accidente', description: 'La calzada quedo parcialmente obstruida y hay vecinos asistiendo.' },
  ],
  BACHE: [
    { title: 'Bache profundo sobre calzada', description: 'El pozo obliga a frenar de golpe y esquivar hacia la mano contraria.' },
    { title: 'Hundimiento en esquina transitada', description: 'La calzada cedio y complica el paso de autos y motos.' },
    { title: 'Bache con agua acumulada', description: 'No se ve la profundidad y ya hubo maniobras bruscas.' },
  ],
  SEMAFORO: [
    { title: 'Semaforo fuera de servicio', description: 'El cruce queda sin ordenamiento y se generan frenadas peligrosas.' },
    { title: 'Semaforo intermitente en avenida', description: 'La senal cambia de forma irregular durante hora pico.' },
    { title: 'Optica semaforica apagada', description: 'Uno de los sentidos no tiene senal visible para circular.' },
  ],
  SENALIZACION: [
    { title: 'Senal de pare danada', description: 'El cartel esta doblado y no se ve desde la esquina.' },
    { title: 'Cartel de contramano caido', description: 'La señalizacion quedo en la vereda y genera maniobras incorrectas.' },
    { title: 'Demarcacion vial borrada', description: 'La senda y las lineas de giro no se distinguen en el cruce.' },
  ],
  VEHICULO_ABANDONADO: [
    { title: 'Vehiculo abandonado sobre calzada', description: 'El auto lleva varios dias estacionado y ocupa parte del carril.' },
    { title: 'Auto sin ruedas obstruye paso', description: 'El vehiculo impide maniobrar con normalidad en una calle angosta.' },
    { title: 'Camioneta abandonada en esquina', description: 'La unidad reduce la visibilidad para ingresar al cruce.' },
  ],
  ALUMBRADO: [
    { title: 'Luminaria apagada en cuadra completa', description: 'La falta de luz reduce la visibilidad para peatones y conductores.' },
    { title: 'Poste de luz sin funcionar', description: 'El sector queda oscuro durante la noche y aumenta el riesgo vial.' },
    { title: 'Alumbrado intermitente', description: 'La luminaria prende y apaga de forma constante en una zona transitada.' },
  ],
};

const SECTORS = [
  'Centro',
  'Barrio 11 de Marzo',
  'Barrio San Nicolas',
  'Ampliacion San Nicolas',
  'Canal de Desague',
  'De la Hosteria',
  'Villa Nueva',
  'Santa Barbara',
];
const STREETS = ['Mitre', 'Alberdi', 'Av. Sarmiento', 'General Paz', 'Diego de Villarroel', 'Gorriti', 'San Martin', 'Rivadavia'];
const AREA_BY_CATEGORY: Record<CategoryId, string> = {
  ACCIDENTE: 'traffic',
  BACHE: 'public_works',
  SEMAFORO: 'traffic',
  SENALIZACION: 'traffic',
  VEHICULO_ABANDONADO: 'environment',
  ALUMBRADO: 'lighting',
};

const PRIORITY_BY_CATEGORY: Record<CategoryId, 'high' | 'medium' | 'low'> = {
  ACCIDENTE: 'high',
  BACHE: 'medium',
  SEMAFORO: 'high',
  SENALIZACION: 'medium',
  VEHICULO_ABANDONADO: 'medium',
  ALUMBRADO: 'high',
};

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function pick<T>(items: T[], random: () => number) {
  return items[Math.floor(random() * items.length)] ?? items[0]!;
}

function randomPointInAguilares(random: () => number) {
  const { center } = AGUILARES_BOUNDS;
  return {
    lat: center.lat + (random() + random() - 1) * 0.012,
    lng: center.lng + (random() + random() - 1) * 0.016,
  };
}

function buildSeedReports() {
  const random = seededRandom(3442026);
  const now = Date.now();

  return Array.from({ length: SEED_COUNT }, (_, index) => {
    const category = CATEGORIES[index % CATEGORIES.length] || 'BACHE';
    const copy = pick(CATEGORY_COPY[category], random);
    const point = randomPointInAguilares(random);
    const createdAt = new Date(now - Math.floor(random() * 45 * 24 * 60 * 60 * 1000));
    const statusRoll = random();
    const status = statusRoll < 0.44 ? 'PENDING' : statusRoll < 0.64 ? 'VERIFYING' : statusRoll < 0.76 ? 'IN_PROGRESS' : statusRoll < 0.88 ? 'DUPLICATE' : 'RESOLVED';
    const priority = random() < 0.7 ? PRIORITY_BY_CATEGORY[category] : pick(['high', 'medium', 'low'] as const, random);
    const resolvedAt = status === 'RESOLVED'
      ? new Date(createdAt.getTime() + Math.floor((6 + random() * 96) * 60 * 60 * 1000)).toISOString()
      : null;

    return {
      city_id: DEFAULT_CITY_ID,
      lat: point.lat,
      lng: point.lng,
      location_label: `${pick(SECTORS, random)}, ${pick(STREETS, random)} ${100 + Math.floor(random() * 1600)}`,
      category,
      title: copy.title,
      description: copy.description,
      images: [],
      status,
      priority,
      assigned_area: AREA_BY_CATEGORY[category],
      created_at: createdAt.toISOString(),
      updated_at: resolvedAt || createdAt.toISOString(),
      resolved_at: resolvedAt,
      verified_count: Math.floor(Math.pow(random(), 0.55) * 48),
      user_display_name: random() > 0.35 ? pick(['Ana Martinez', 'Luis Carrizo', 'Diego Diaz', 'Mariana Ruiz', 'Carlos Alderete'], random) : null,
    };
  });
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      { success: false, error: 'Acceso denegado: esta operacion solo esta disponible en desarrollo.' },
      { status: 403 }
    );
  }

  try {
    const { error: deleteError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('city_id', DEFAULT_CITY_ID);

    if (deleteError) throw deleteError;

    const { data: insertedReports, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert(buildSeedReports())
      .select('*');

    if (insertError) throw insertError;

    const ipHash = hashValue('127.0.0.1');
    const fingerprintHash = hashValue('seed-fingerprint-visitor-id');

    const { error: metaError } = await supabaseAdmin
      .from('report_private_meta')
      .insert(
        ((insertedReports || []) as SupabaseReportRow[]).map((report) => ({
          report_id: report.id,
          ip_hash: ipHash,
          fingerprint_hash: fingerprintHash,
          user_agent: 'system-seeder',
          origin: 'http://localhost:3001',
        }))
      );

    if (metaError) throw metaError;

    const seededData = ((insertedReports || []) as SupabaseReportRow[]).map(mapSupabaseReportToReport);

    return Response.json({
      success: true,
      message: 'Base de datos local sembrada exitosamente.',
      count: seededData.length,
      data: seededData,
    });
  } catch (error) {
    console.error('[SEED_ROUTE] Error en la siembra de datos:', error);
    return Response.json({
      success: false,
      error: 'Error interno del servidor al sembrar la base de datos.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
