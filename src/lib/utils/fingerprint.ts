import * as FingerprintJS from '@fingerprintjs/fingerprintjs';

const FINGERPRINT_KEY = 'ciudadalerta_visitor_id';

/**
 * Obtiene o inicializa la huella digital (Visitor ID) del navegador del usuario.
 * Utiliza sessionStorage como caché para evitar cálculos repetidos en la misma sesión.
 * 
 * @returns {Promise<string>} La huella digital del navegador.
 */
export async function getVisitorId(): Promise<string> {
  // Asegurarnos de que estamos en el entorno del cliente
  if (typeof window === 'undefined') {
    return '';
  }

  // Intentar recuperar el visitorId de la caché de sesión
  const cachedId = sessionStorage.getItem(FINGERPRINT_KEY);
  if (cachedId) {
    return cachedId;
  }

  try {
    // Inicializar el agente de FingerprintJS de forma asíncrona
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    
    const visitorId = result.visitorId;
    
    // Guardar en sessionStorage para optimizar accesos futuros
    sessionStorage.setItem(FINGERPRINT_KEY, visitorId);
    
    return visitorId;
  } catch (error) {
    console.error('🔴 [FINGERPRINT] Error al generar la huella digital:', error);
    
    // Generar un ID fallback único temporal para esta sesión en caso de bloqueo por extensiones/adblockers
    const fallbackId = `fallback_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    sessionStorage.setItem(FINGERPRINT_KEY, fallbackId);
    
    return fallbackId;
  }
}
