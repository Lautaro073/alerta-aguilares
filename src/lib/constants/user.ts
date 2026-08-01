/**
 * Nombre público de respaldo cuando una cuenta no tiene nombre visible cargado
 * (puede pasar al entrar con Google si esa cuenta no comparte un nombre).
 *
 * Se usa tanto al sincronizar el perfil como al crear un reporte: tiene que ser
 * el MISMO valor en los dos lados, si no un usuario aparecería con un nombre
 * distinto según por dónde se lo mire.
 *
 * Nunca derivar este nombre del correo electrónico: se publica en el mapa.
 */
export const DEFAULT_DISPLAY_NAME = 'Vecino de Aguilares';
