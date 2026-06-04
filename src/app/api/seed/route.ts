import { adminDb } from '@/lib/firebase/admin';
import { Report, ReportPrivateMeta } from '@/types/report';
import { hashValue } from '@/lib/server/hash';
import { CategoryId } from '@/lib/constants/categories';

export const dynamic = 'force-dynamic';

/**
 * GET /api/seed
 * 
 * Ruta de desarrollo para sembrar la base de datos local con incidentes de prueba realistas en Aguilares.
 * Solo se permite su ejecución en entorno de desarrollo.
 */
export async function GET() {
  // Proteger la ruta en entornos productivos
  if (process.env.NODE_ENV !== 'development') {
    return Response.json(
      { success: false, error: 'Acceso denegado: Esta operación solo está disponible en entorno de desarrollo.' },
      { status: 403 }
    );
  }

  try {
    const batch = adminDb.batch();
    const reportsCollection = adminDb.collection('reports');
    const privateMetaCollection = adminDb.collection('report_private_meta');

    // 1. Limpiar reportes de prueba previos (opcional para evitar duplicados en cada ejecución)
    const existingReports = await reportsCollection.where('cityId', '==', 'aguilares-tucuman').get();
    existingReports.docs.forEach((doc) => {
      batch.delete(doc.ref);
      batch.delete(privateMetaCollection.doc(doc.id));
    });

    // 2. Definir incidentes de prueba realistas en Aguilares
    const nowISO = new Date().toISOString();
    const mockReports = [
      {
        category: 'BACHE',
        title: 'Bache de gran profundidad en el cruce',
        description: 'Bache peligroso justo en la esquina de Mitre y Alberdi. Afecta el tránsito de autos y motocicletas, especialmente de noche por la falta de iluminación directa.',
        lat: -27.4328,
        lng: -65.6185,
      },
      {
        category: 'ALUMBRADO',
        title: 'Falta total de alumbrado en media cuadra',
        description: 'Toda la cuadra de Av. Sarmiento entre el 300 y el 350 se encuentra a oscuras desde hace más de una semana debido al cortocircuito de dos farolas aéreas.',
        lat: -27.4350,
        lng: -65.6120,
      },
      {
        category: 'BASURA',
        title: 'Acumulación de basura y escombros en vereda',
        description: 'Gran cantidad de residuos y restos de obra tapando la rampa para personas con discapacidad en la esquina de Pellegrini y 25 de Mayo.',
        lat: -27.4305,
        lng: -65.6155,
      },
      {
        category: 'AGUA_CLOACA',
        title: 'Pérdida persistente de agua servida',
        description: 'Rotura de caño de cloaca sobre la calzada en General Paz 600. Emite olores nauseabundos e inunda toda la cuneta de la cuadra.',
        lat: -27.4362,
        lng: -65.6210,
      },
      {
        category: 'ARBOL',
        title: 'Árbol antiguo con ramas sobre cables de alta tensión',
        description: 'Rama de gran tamaño a punto de quebrarse sobre el tendido eléctrico principal en Av. Mitre 800. Peligro de cortocircuito ante tormentas o viento fuerte.',
        lat: -27.4290,
        lng: -65.6235,
      },
      {
        category: 'PLAGAS_DENGUE',
        title: 'Foco de mosquitos (Dengue) en baldío acumulador',
        description: 'Terreno baldío abierto en Barrio San Martín con acumulación de neumáticos viejos, botellas y chatarra que juntan agua estancada. Vecinos reportan alta presencia de mosquitos.',
        lat: -27.4340,
        lng: -65.6160,
      },
      {
        category: 'PLAZA_JUEGOS',
        title: 'Juegos infantiles vandalizados y rotos en plaza',
        description: 'Las hamacas de la plaza infantil tienen cadenas cortadas y los bordes del tobogán de chapa están oxidados y filosos, representando un grave riesgo para los niños.',
        lat: -27.4315,
        lng: -65.6198,
      },
      {
        category: 'CONTAMINACION',
        title: 'Lluvia intensa de hollín del Ingenio Aguilares',
        description: 'Emisión de ceniza y carbonilla proveniente del Ingenio Aguilares cubriendo techos y patios de la zona céntrica. Afecta el aire y la salud de los vecinos.',
        lat: -27.4285,
        lng: -65.6110,
      },
      {
        category: 'ACCESIBILIDAD',
        title: 'Rampa de esquina rota por raíces de árbol',
        description: 'La rampa de la esquina suroeste está totalmente agrietada y levantada por raíces de un árbol grande, impidiendo el paso de cochecitos y sillas de ruedas.',
        lat: -27.4332,
        lng: -65.6145,
      },
      {
        category: 'BROMATOLOGIA',
        title: 'Falta de higiene severa en carro de comida rápida',
        description: 'Se observó presencia de roedores y falta de cadena de frío en un carro de comidas rápidas ubicado sobre Av. Mitre por la noche. Alto riesgo de intoxicación alimenticia.',
        lat: -27.4320,
        lng: -65.6172,
      },
      {
        category: 'CABLES_POSTES',
        title: 'Poste de madera quebrado con peligro de caída',
        description: 'Poste de tendido telefónico de madera quebrado en la base e inclinado a 45 grados sobre la calle Alberdi 500, sostenido únicamente por los cables principales.',
        lat: -27.4345,
        lng: -65.6190,
      },
      {
        category: 'TRANSPORTE',
        title: 'Refugio de parada de colectivos roto y sin luz',
        description: 'La garita de colectivos sobre Av. Savio tiene el techo roto y la iluminación quemada, lo que la vuelve inutilizable en días de lluvia y muy insegura de noche.',
        lat: -27.4300,
        lng: -65.6130,
      },
    ];

    const dummyIpHash = hashValue('127.0.0.1');
    const dummyFpHash = hashValue('seed-fingerprint-visitor-id');

    // 3. Agregar documentos al batch
    const seededData: Report[] = [];
    
    mockReports.forEach((mock) => {
      const docRef = reportsCollection.doc();
      const id = docRef.id;

      const report: Report = {
        id,
        cityId: 'aguilares-tucuman',
        lat: mock.lat,
        lng: mock.lng,
        category: mock.category as CategoryId,
        title: mock.title,
        description: mock.description,
        images: [],
        status: 'ACTIVE',
        createdAt: nowISO,
        updatedAt: nowISO,
        resolvedAt: null,
      };

      const privateMeta: ReportPrivateMeta = {
        reportId: id,
        ipHash: dummyIpHash,
        fingerprintHash: dummyFpHash,
        userAgent: 'system-seeder',
        origin: 'http://localhost:3000',
        createdAt: nowISO,
      };

      batch.set(docRef, report);
      batch.set(privateMetaCollection.doc(id), privateMeta);
      seededData.push(report);
    });

    // 4. Ejecutar transacción batch
    await batch.commit();

    return Response.json({
      success: true,
      message: 'Base de datos local sembrada exitosamente con 5 incidentes reales.',
      count: seededData.length,
      data: seededData,
    }, { status: 200 });

  } catch (error) {
    console.error('🔴 [SEED_ROUTE] Error en la siembra de datos:', error);
    return Response.json({
      success: false,
      error: 'Error interno del servidor al sembrar la base de datos.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
