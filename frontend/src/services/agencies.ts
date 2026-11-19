/**
 * llamadas a la api publica de inmobiliarias, reseñas, consultas y visitas.
 */

import type { Agency, Paginated, Property, Question, Review, Visit } from "../types/api";
import { http } from "./http";

/**
 * pide el listado publico de inmobiliarias, ordenado por nombre.
 *
 * @param params nombre (texto a buscar, opcional) y page
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado; cada inmobiliaria trae contacto, promedio y cantidad de reseñas
 */
export const listAgencies = async (params: { nombre?: string; page?: number }, signal?: AbortSignal): Promise<Paginated<Agency>> => {
  const response = await http.get<Paginated<Agency>>("/agencies", {
    params: { nombre: params.nombre || undefined, page: params.page ?? 1, limit: 12 },
    signal,
  });
  return response.data;
};

/**
 * pide el perfil publico de una inmobiliaria.
 *
 * @param id id de la inmobiliaria
 * @param signal permite cancelar el pedido (opcional)
 * @returns la inmobiliaria con contacto, promedio y cantidad de reseñas
 */
export const getAgency = async (id: number | string, signal?: AbortSignal): Promise<Agency> => {
  const response = await http.get<Agency>(`/agencies/${id}`, { signal });
  return response.data;
};

/**
 * pide las propiedades publicadas de una inmobiliaria.
 *
 * @param id id de la inmobiliaria
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado (hasta 50 propiedades)
 */
export const listAgencyProperties = async (id: number | string, signal?: AbortSignal): Promise<Paginated<Property>> => {
  const response = await http.get<Paginated<Property>>(`/agencies/${id}/properties`, { params: { limit: 50 }, signal });
  return response.data;
};

/**
 * pide las reseñas de una inmobiliaria, la mas reciente primero.
 *
 * @param id id de la inmobiliaria
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado (hasta 50 reseñas)
 */
export const listReviews = async (id: number | string, signal?: AbortSignal): Promise<Paginated<Review>> => {
  const response = await http.get<Paginated<Review>>(`/agencies/${id}/reviews`, { params: { limit: 50 }, signal });
  return response.data;
};

/**
 * crea una reseña sobre una inmobiliaria.
 *
 * @param id id de la inmobiliaria
 * @param data nombreSolicitante, resenia y calificacion (1 a 5)
 * @returns la reseña creada
 */
export const createReview = async (id: number | string, data: { nombreSolicitante: string; resenia: string; calificacion: number }): Promise<Review> => {
  const response = await http.post<Review>(`/agencies/${id}/reviews`, data);
  return response.data;
};

/**
 * pide las consultas publicas de una propiedad.
 *
 * @param propertyId id de la propiedad
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado (hasta 50 consultas)
 */
export const listQuestions = async (propertyId: number | string, signal?: AbortSignal): Promise<Paginated<Question>> => {
  const response = await http.get<Paginated<Question>>(`/properties/${propertyId}/questions`, { params: { limit: 50 }, signal });
  return response.data;
};

/**
 * crea una consulta sobre una propiedad.
 *
 * @param propertyId id de la propiedad
 * @param data nombreSolicitante y pregunta
 * @returns la consulta creada
 */
export const createQuestion = async (propertyId: number | string, data: { nombreSolicitante: string; pregunta: string }): Promise<Question> => {
  const response = await http.post<Question>(`/properties/${propertyId}/questions`, data);
  return response.data;
};

/**
 * pide una visita a una propiedad.
 *
 * @param propertyId id de la propiedad
 * @param data nombreVisitante, telefonoVisitante, fechaPropuesta (iso) y mensajeAsociado (opcional)
 * @returns la visita creada, en estado PENDIENTE
 */
export const createVisit = async (
  propertyId: number | string,
  data: { nombreVisitante: string; telefonoVisitante: string; fechaPropuesta: string; mensajeAsociado?: string },
): Promise<Visit> => {
  const response = await http.post<Visit>(`/properties/${propertyId}/visits`, data);
  return response.data;
};
