import { CategoryId } from '@/lib/constants/categories';

/**
 * Representa un reporte de incidencia urbano en CiudadAlerta.
 * Esta interfaz define el formato público serializado a JSON que recibe el cliente.
 */
export interface Report {
  id: string;
  cityId: 'aguilares-tucuman';
  
  // Coordenadas geográficas
  lat: number;
  lng: number;
  geohash?: string;
  
  // Categorización y contenido
  category: CategoryId;
  title: string;
  description: string | null;
  
  // Fotos opcionales del reporte (Cloudinary URLs)
  images?: string[];
  
  // Estado del reporte
  status: 'ACTIVE' | 'RESOLVED' | 'DUPLICATE';
  
  // Fechas serializadas en formato ISO 8601 (string) en las API Routes
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;

  // Confirmaciones e interactividad (Fase 2)
  verifiedCount?: number;
  confirmedBy?: string[];
}

/**
 * Metadatos privados vinculados a cada reporte.
 * Estos datos se almacenan en una colección separada y NUNCA se exponen al cliente.
 */
export interface ReportPrivateMeta {
  reportId: string;
  ipHash: string;          // SHA256(ip + HASH_SALT)
  fingerprintHash: string; // SHA256(visitorId + HASH_SALT)
  userAgent: string;
  origin: string | null;
  createdAt: string;
}

/**
 * Control de rate limiting en base de datos.
 * Document ID = 'fp:{fingerprintHash}' o 'ip:{ipHash}'
 */
export interface RateLimit {
  type: 'fp' | 'ip';
  hash: string;
  count: number;
  windowStart: string;     // Inicio de la ventana rolling de 24h
  lastReportAt: string;
}
