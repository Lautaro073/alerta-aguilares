import crypto from 'crypto';
import { env } from '@/lib/server/env';

/**
 * Calcula el hash SHA-256 de una cadena de texto (IP o Fingerprint) combinada con el HASH_SALT.
 * Esta función es crítica para el cumplimiento de la privacidad y el rate limiting dual
 * ya que garantiza que NUNCA almacenemos IPs o identificadores del navegador en texto plano en la base de datos.
 */
export function hashValue(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value + env.HASH_SALT)
    .digest('hex');
}
