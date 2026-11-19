/**
 * tipos de propiedad.
 * en la base se guarda un numero (columna id_tipo_propiedad) y en la api
 * se usa el nombre. este archivo es el unico lugar donde vive esa equivalencia.
 */

export const TIPOS_PROPIEDAD = ['CASA', 'DEPARTAMENTO', 'TERRENO', 'COMERCIAL'] as const;

export type TipoPropiedad = (typeof TIPOS_PROPIEDAD)[number];

const ID_POR_TIPO: Record<TipoPropiedad, number> = {
  CASA: 1,
  DEPARTAMENTO: 2,
  TERRENO: 3,
  COMERCIAL: 4,
};

/**
 * convierte el nombre del tipo al numero que se guarda en la base.
 *
 * @param tipo nombre del tipo, por ejemplo 'CASA' (no distingue mayusculas)
 * @returns el numero del tipo, o null si no viene o no existe
 */
export const tipoToId = (tipo: string | undefined | null): number | null => {
  if (!tipo) return null;
  return ID_POR_TIPO[tipo.toUpperCase() as TipoPropiedad] ?? null;
};

/**
 * convierte el numero guardado en la base al nombre del tipo.
 *
 * @param id numero del tipo (valor de id_tipo_propiedad)
 * @returns el nombre del tipo, o null si no viene o no existe
 */
export const idToTipo = (id: number | undefined | null): TipoPropiedad | null => {
  const found = TIPOS_PROPIEDAD.find((tipo) => ID_POR_TIPO[tipo] === id);
  return found ?? null;
};

/**
 * interpreta el filtro de tipo del listado publico, que puede llegar como
 * nombre ("CASA") o como numero ("1").
 *
 * @param value valor del parametro tipo de la url
 * @returns el numero del tipo, o null si no vino o no corresponde a ningun tipo
 */
export const parseTipoFilter = (value: string | undefined): number | null => {
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  return tipoToId(value);
};
