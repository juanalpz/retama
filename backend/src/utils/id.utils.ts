/**
 * lectura de los ids que llegan en la url.
 */

// mayor valor que entra en una columna entera de postgres
const MAX_ID = 2147483647;

/**
 * convierte un id de la url a numero.
 * solo acepta enteros positivos que entren en una columna entera de postgres,
 * asi un id mal formado o gigante nunca llega a la consulta.
 *
 * @param value valor crudo del parametro, por ejemplo req.params.id
 * @returns el id como numero, o NaN si no es un id valido
 */
export const toId = (value: unknown): number => {
  if (typeof value !== 'string' || !/^\d{1,10}$/.test(value)) return NaN;
  const id = Number(value);
  return id >= 1 && id <= MAX_ID ? id : NaN;
};
