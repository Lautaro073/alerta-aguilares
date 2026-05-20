/**
 * Estructura estándar y fuertemente tipada para todas las respuestas de API en CiudadAlerta.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };
