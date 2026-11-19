/**
 * helpers para mostrar datos de la api en pantalla.
 */

import type { Moneda, Operacion, Property, TipoPropiedad } from "../types/api";

// nombre para mostrar de cada tipo de propiedad
export const TIPO_LABELS: Record<TipoPropiedad, string> = {
  CASA: "Casa",
  DEPARTAMENTO: "Departamento",
  TERRENO: "Terreno",
  COMERCIAL: "Local",
};

// nombre para mostrar de cada operacion
export const OPERACION_LABELS: Record<Operacion, string> = {
  VENTA: "Venta",
  ALQUILER: "Alquiler",
};

/**
 * arma el precio para mostrar, con separador de miles y la moneda adelante.
 *
 * @param precio importe
 * @param moneda ARS o USD
 * @param operacion si es ALQUILER se agrega "/mes" (opcional)
 * @returns el texto del precio, por ejemplo "USD 120.000" o "USD 400/mes"
 */
export const formatPrice = (precio: number, moneda: Moneda, operacion?: Operacion): string => {
  const importe = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(precio);
  return `${moneda} ${importe}${operacion === "ALQUILER" ? "/mes" : ""}`;
};

/**
 * elige la foto que representa a una propiedad en los listados.
 *
 * @param property propiedad con sus fotos
 * @returns la url de la portada, de la primera foto si no hay portada, o null si no tiene fotos
 */
export const coverUrl = (property: Pick<Property, "fotos">): string | null => {
  const fotos = property.fotos ?? [];
  const portada = fotos.find((foto) => foto.esPortada) ?? [...fotos].sort((a, b) => a.orden - b.orden)[0];
  return portada?.url ?? null;
};

/**
 * une las clases de css que tengan valor.
 *
 * @param classes clases, o valores falsos que se descartan
 * @returns las clases separadas por espacio
 */
export const cx = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(" ");
