/**
 * llamadas a la api del catalogo publico de propiedades y de amenities.
 */

import type { Paginated, Property, Tag } from "../types/api";
import { http } from "./http";

// filtros del listado publico. todos son opcionales y se combinan.
export interface PropertyFilters {
  q?: string;
  tipo?: string;
  operacion?: string;
  minPrice?: string;
  maxPrice?: string;
  barrioZona?: string;
  ambientes?: string;
  // nombres de amenities
  tags?: string[];
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

/**
 * pide el listado de propiedades publicadas.
 *
 * @param filters filtros, orden y pagina
 * @param signal permite cancelar el pedido si el componente ya no lo necesita (opcional)
 * @returns el resultado paginado { data, total, page, limit, totalPages }
 */
export const listProperties = async (filters: PropertyFilters, signal?: AbortSignal): Promise<Paginated<Property>> => {
  const { tags, ...rest } = filters;

  // solo se envian los filtros que tienen valor
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== "") params[key] = value;
  }
  if (tags && tags.length > 0) params.tags = tags.join(",");

  const response = await http.get<Paginated<Property>>("/properties", { params, signal });
  return response.data;
};

/**
 * pide el detalle publico de una propiedad.
 *
 * @param id id de la propiedad
 * @param signal permite cancelar el pedido (opcional)
 * @returns la propiedad con fotos, tags e inmobiliaria
 */
export const getProperty = async (id: number | string, signal?: AbortSignal): Promise<Property> => {
  const response = await http.get<Property>(`/properties/${id}`, { signal });
  return response.data;
};

/**
 * pide la lista de amenities disponibles.
 *
 * @param signal permite cancelar el pedido (opcional)
 * @returns los tags ordenados por nombre
 */
export const listTags = async (signal?: AbortSignal): Promise<Tag[]> => {
  const response = await http.get<Tag[]>("/tags", { signal });
  return response.data;
};
