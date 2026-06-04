import { CategoryId } from '@/lib/constants/categories';
import { DEFAULT_CITY_ID } from '@/lib/constants/city';
import { hashValue } from '@/lib/server/hash';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mapSupabaseReportToReport, SupabaseReportRow } from '@/features/reports/server/reportMapper';

export const dynamic = 'force-dynamic';

interface MockReport {
  category: CategoryId;
  title: string;
  description: string;
  lat: number;
  lng: number;
}

const mockReports: MockReport[] = [
  {
    category: 'BACHE',
    title: 'Bache de gran profundidad en el cruce',
    description: 'Bache peligroso justo en la esquina de Mitre y Alberdi. Afecta el transito de autos y motocicletas, especialmente de noche por la falta de iluminacion directa.',
    lat: -27.4328,
    lng: -65.6185,
  },
  {
    category: 'ALUMBRADO',
    title: 'Falta total de alumbrado en media cuadra',
    description: 'Toda la cuadra de Av. Sarmiento entre el 300 y el 350 se encuentra a oscuras desde hace mas de una semana.',
    lat: -27.4350,
    lng: -65.6120,
  },
  {
    category: 'BASURA',
    title: 'Acumulacion de basura y escombros en vereda',
    description: 'Gran cantidad de residuos y restos de obra tapando la rampa para personas con discapacidad.',
    lat: -27.4305,
    lng: -65.6155,
  },
  {
    category: 'AGUA_CLOACA',
    title: 'Perdida persistente de agua servida',
    description: 'Rotura de cano de cloaca sobre la calzada en General Paz 600.',
    lat: -27.4362,
    lng: -65.6210,
  },
  {
    category: 'ARBOL',
    title: 'Arbol antiguo con ramas sobre cables',
    description: 'Rama de gran tamano a punto de quebrarse sobre el tendido electrico principal.',
    lat: -27.4290,
    lng: -65.6235,
  },
  {
    category: 'PLAGAS_DENGUE',
    title: 'Foco de mosquitos en baldio acumulador',
    description: 'Terreno baldio abierto con acumulacion de neumaticos, botellas y chatarra.',
    lat: -27.4340,
    lng: -65.6160,
  },
  {
    category: 'PLAZA_JUEGOS',
    title: 'Juegos infantiles vandalizados y rotos',
    description: 'Hamacas con cadenas cortadas y tobogan oxidado en plaza infantil.',
    lat: -27.4315,
    lng: -65.6198,
  },
  {
    category: 'CONTAMINACION',
    title: 'Lluvia intensa de hollin del Ingenio Aguilares',
    description: 'Emision de ceniza y carbonilla cubriendo techos y patios de la zona centrica.',
    lat: -27.4285,
    lng: -65.6110,
  },
  {
    category: 'ACCESIBILIDAD',
    title: 'Rampa de esquina rota por raices',
    description: 'La rampa de la esquina esta agrietada y levantada por raices.',
    lat: -27.4332,
    lng: -65.6145,
  },
  {
    category: 'TRANSPORTE',
    title: 'Refugio de parada de colectivos roto y sin luz',
    description: 'La garita tiene el techo roto y la iluminacion quemada.',
    lat: -27.4300,
    lng: -65.6130,
  },
];

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

    if (deleteError) {
      throw deleteError;
    }

    const { data: insertedReports, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert(
        mockReports.map((report) => ({
          city_id: DEFAULT_CITY_ID,
          lat: report.lat,
          lng: report.lng,
          category: report.category,
          title: report.title,
          description: report.description,
          images: [],
        }))
      )
      .select('*');

    if (insertError) {
      throw insertError;
    }

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
          origin: 'http://localhost:3000',
        }))
      );

    if (metaError) {
      throw metaError;
    }

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
