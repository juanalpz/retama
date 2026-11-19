/**
 * lectura de los parametros de paginado y numericos que llegan en la url.
 */

// tope de resultados por pagina, para que nadie pida la tabla entera de una vez
const MAX_LIMIT = 50;

/**
 * lee page y limit de la url (?page=1&limit=10) y los deja siempre validos:
 * enteros positivos, con valores por defecto si no vienen o vienen mal,
 * y con el limite acotado a MAX_LIMIT.
 *
 * @param query parametros de la url (req.query)
 * @param defaultLimit cantidad por pagina a usar si no se pide ninguna
 * @returns un objeto { page, limit } listo para pasar al servicio
 */
export const parsePagination = (query: Record<string, any>, defaultLimit: number): { page: number; limit: number } => {
  const page = parseInt(query.page as string, 10);
  const limit = parseInt(query.limit as string, 10);

  return {
    page: page > 0 ? page : 1,
    limit: limit > 0 ? Math.min(limit, MAX_LIMIT) : defaultLimit,
  };
};

/**
 * convierte un parametro de la url a numero, sin dejar pasar un NaN a la consulta.
 *
 * @param value valor crudo del parametro (puede no venir)
 * @returns el numero, o undefined si no vino o no es un numero valido
 */
export const parseNumberParam = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
