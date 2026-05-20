/**
 * Helper para responder un error 400 Bad Request (parámetros inválidos, validación fallida de Zod, etc.).
 */
export function badRequest(message: string, details?: unknown) {
  return Response.json(
    {
      success: false,
      error: message,
      ...(details !== undefined ? { details } : {}),
    },
    { status: 400 }
  );
}

/**
 * Helper para responder un error 429 Too Many Requests (límite de peticiones alcanzado).
 */
export function tooManyRequests(message: string, resetAt: Date) {
  return Response.json(
    {
      success: false,
      error: message,
      resetAt: resetAt.toISOString(),
    },
    { status: 429 }
  );
}

/**
 * Helper para responder un error 500 Internal Server Error.
 * Loggea el error de forma segura en el servidor sin exponer detalles sensibles al cliente.
 */
export function serverError(context?: string, error?: unknown) {
  console.error(`🔴 [SERVER ERROR] ${context || 'Unknown context'}:`, error);
  
  return Response.json(
    {
      success: false,
      error: 'Error interno del servidor. Por favor, intente nuevamente más tarde.',
    },
    { status: 500 }
  );
}

/**
 * Helper para responder un error 403 Forbidden.
 */
export function forbidden(message: string) {
  return Response.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
}
