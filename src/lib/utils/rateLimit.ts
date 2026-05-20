import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { env } from '@/lib/server/env';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}

/**
 * Verifica y actualiza atómicamente el rate limit dual de un usuario mediante una transacción de Firestore.
 * 
 * Lógica de ventana móvil (rolling 24h):
 * 1. Si no existe registro del hash, se crea con count = 1 y se inicializa la ventana.
 * 2. Si existe, se evalúa el tiempo transcurrido desde el inicio de la ventana (`windowStart`):
 *    - Si transcurrieron más de 24 horas, la ventana expiró: se resetea count = 1 y se inicia una nueva ventana.
 *    - Si está dentro de las 24 horas, se verifica si superó el límite (5 para Fingerprint, 10 para IP):
 *      - Si lo superó: se deniega el acceso y se calcula cuándo se reestablecerá (`windowStart + 24 horas`).
 *      - Si no: se incrementa count en 1.
 * 
 * @param keys Objeto con los hashes SHA-256 de Fingerprint e IP.
 */
export async function checkRateLimit(keys: {
  fpHash: string;
  ipHash: string;
}): Promise<RateLimitResult> {
  const { fpHash, ipHash } = keys;
  
  const fpRef = adminDb.collection('rate_limits').doc(`fp:${fpHash}`);
  const ipRef = adminDb.collection('rate_limits').doc(`ip:${ipHash}`);
  
  const windowMs = env.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000;
  
  return adminDb.runTransaction(async (transaction) => {
    const now = new Date();
    
    // 1. Obtener registros actuales en la transacción
    const fpSnap = await transaction.get(fpRef);
    const ipSnap = await transaction.get(ipRef);
    
    const fpData = fpSnap.data();
    const ipData = ipSnap.data();
    
    // ---- EVALUAR FINGERPRINT LIMITS ----
    let fpCount = 0;
    let fpWindowStart = now;
    let fpAllowed = true;
    let fpResetAt = now;
    
    if (fpData) {
      const windowStart = (fpData.windowStart as admin.firestore.Timestamp).toDate();
      const timeElapsed = now.getTime() - windowStart.getTime();
      
      if (timeElapsed >= windowMs) {
        // Ventana expirada, resetear contador
        fpCount = 1;
        fpWindowStart = now;
      } else {
        fpCount = fpData.count as number;
        fpWindowStart = windowStart;
        
        if (fpCount >= env.MAX_REPORTS_PER_DAY_FP) {
          fpAllowed = false;
          fpResetAt = new Date(windowStart.getTime() + windowMs);
        } else {
          fpCount += 1;
        }
      }
    } else {
      // Primer reporte con este fingerprint
      fpCount = 1;
      fpWindowStart = now;
    }
    
    // ---- EVALUAR IP LIMITS ----
    let ipCount = 0;
    let ipWindowStart = now;
    let ipAllowed = true;
    let ipResetAt = now;
    
    if (ipData) {
      const windowStart = (ipData.windowStart as admin.firestore.Timestamp).toDate();
      const timeElapsed = now.getTime() - windowStart.getTime();
      
      if (timeElapsed >= windowMs) {
        // Ventana expirada, resetear contador
        ipCount = 1;
        ipWindowStart = now;
      } else {
        ipCount = ipData.count as number;
        ipWindowStart = windowStart;
        
        if (ipCount >= env.MAX_REPORTS_PER_DAY_IP) {
          ipAllowed = false;
          ipResetAt = new Date(windowStart.getTime() + windowMs);
        } else {
          ipCount += 1;
        }
      }
    } else {
      // Primer reporte con esta IP
      ipCount = 1;
      ipWindowStart = now;
    }
    
    // 2. Si alguno está bloqueado, no realizamos escrituras y retornamos el bloqueo
    if (!fpAllowed || !ipAllowed) {
      // Si ambos están bloqueados, devolvemos el reset que ocurra más tarde (más seguro)
      const worstResetAt = fpResetAt > ipResetAt ? fpResetAt : ipResetAt;
      
      // Calcular remanente seguro
      const remainingFp = Math.max(0, env.MAX_REPORTS_PER_DAY_FP - (fpData?.count || 0));
      const remainingIp = Math.max(0, env.MAX_REPORTS_PER_DAY_IP - (ipData?.count || 0));
      
      return {
        allowed: false,
        remaining: Math.min(remainingFp, remainingIp),
        resetAt: worstResetAt,
      };
    }
    
    // 3. Escribir actualizaciones en la transacción
    transaction.set(fpRef, {
      type: 'fp',
      hash: fpHash,
      count: fpCount,
      windowStart: admin.firestore.Timestamp.fromDate(fpWindowStart),
      lastReportAt: admin.firestore.Timestamp.fromDate(now),
    }, { merge: true });
    
    transaction.set(ipRef, {
      type: 'ip',
      hash: ipHash,
      count: ipCount,
      windowStart: admin.firestore.Timestamp.fromDate(ipWindowStart),
      lastReportAt: admin.firestore.Timestamp.fromDate(now),
    }, { merge: true });
    
    // 4. Retornar remanentes
    const remainingFp = env.MAX_REPORTS_PER_DAY_FP - fpCount;
    const remainingIp = env.MAX_REPORTS_PER_DAY_IP - ipCount;
    
    return {
      allowed: true,
      remaining: Math.min(remainingFp, remainingIp),
    };
  });
}
