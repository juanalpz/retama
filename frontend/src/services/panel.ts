/**
 * llamadas a la api del panel del vendedor.
 * algunas respuestas de la api vienen envueltas en { success, ... } y otras no;
 * aca se desenvuelven para que los componentes reciban siempre el objeto.
 */

import type { Activity, Agency, EstadoPropiedad, EstadoVisita, Paginated, Photo, Property, Question, Visit } from "../types/api";
import { http } from "./http";

// ---------------------------------------------------------------- inmobiliaria

/**
 * pide la inmobiliaria del vendedor con sus telefonos y correos.
 *
 * @param signal permite cancelar el pedido (opcional)
 * @returns la inmobiliaria
 */
export const getMyAgency = async (signal?: AbortSignal): Promise<Agency> => {
  const response = await http.get<{ inmobiliaria: Agency }>("/vendedor/inmobiliaria", { signal });
  return response.data.inmobiliaria;
};

/**
 * edita los datos de la inmobiliaria.
 *
 * @param data campos a modificar: nombreFantasia, descripcion, logoUrl, direccionLinea1
 * @returns la inmobiliaria actualizada
 */
export const updateMyAgency = async (data: Partial<Pick<Agency, "nombreFantasia" | "descripcion" | "logoUrl" | "direccionLinea1">>): Promise<Agency> => {
  const response = await http.put<{ inmobiliaria: Agency }>("/vendedor/inmobiliaria", data);
  return response.data.inmobiliaria;
};

/**
 * elimina la inmobiliaria del vendedor. la api responde 409 si tiene propiedades activas.
 *
 * @returns nada
 */
export const deleteMyAgency = async (): Promise<void> => {
  await http.delete("/vendedor/inmobiliaria");
};

/**
 * agrega un telefono de contacto.
 *
 * @param telefono numero de telefono
 * @returns nada
 */
export const addPhone = async (telefono: string): Promise<void> => {
  await http.post("/vendedor/inmobiliaria/telefonos", { telefono });
};

/**
 * elimina un telefono de contacto.
 *
 * @param id id del telefono
 * @returns nada
 */
export const deletePhone = async (id: number): Promise<void> => {
  await http.delete(`/vendedor/inmobiliaria/telefonos/${id}`);
};

// ---------------------------------------------------------------- propiedades

// campos del formulario de propiedad, tal como los espera la api
export interface PropertyPayload {
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  operacion: string;
  precio: number;
  moneda: string;
  direccionLinea1: string;
  barrioZona: string;
  superficieTotalM2: number;
  superficieCubiertaM2?: number | null;
  ambientes?: number | null;
  dormitorios?: number | null;
  banios?: number | null;
  antiguedad?: number | null;
  tags: number[];
}

/**
 * pide las propiedades del vendedor, en cualquier estado.
 *
 * @param params estado por el que filtrar (opcional) y pagina
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado
 */
export const listMyProperties = async (params: { estado?: string; page?: number }, signal?: AbortSignal): Promise<Paginated<Property>> => {
  const response = await http.get<Paginated<Property>>("/vendedor/propiedades", {
    params: { estado: params.estado || undefined, page: params.page ?? 1, limit: 10 },
    signal,
  });
  return response.data;
};

/**
 * pide el detalle de una propiedad propia, con su historial de estados.
 *
 * @param id id de la propiedad
 * @param signal permite cancelar el pedido (opcional)
 * @returns la propiedad
 */
export const getMyProperty = async (id: number | string, signal?: AbortSignal): Promise<Property> => {
  const response = await http.get<Property>(`/vendedor/propiedades/${id}`, { signal });
  return response.data;
};

/**
 * crea una propiedad en borrador.
 *
 * @param data datos del formulario
 * @returns la propiedad creada
 */
export const createProperty = async (data: PropertyPayload): Promise<Property> => {
  const response = await http.post<{ propiedad: Property }>("/vendedor/propiedades", data);
  return response.data.propiedad;
};

/**
 * edita una propiedad propia.
 *
 * @param id id de la propiedad
 * @param data datos del formulario
 * @returns la propiedad actualizada
 */
export const updateProperty = async (id: number | string, data: PropertyPayload): Promise<Property> => {
  const response = await http.put<{ propiedad: Property }>(`/vendedor/propiedades/${id}`, data);
  return response.data.propiedad;
};

/**
 * cambia el estado de una propiedad. la api valida que la transicion sea valida.
 *
 * @param id id de la propiedad
 * @param nuevoEstado estado al que se quiere pasar
 * @returns la propiedad con su estado nuevo
 */
export const changePropertyStatus = async (id: number, nuevoEstado: EstadoPropiedad): Promise<Property> => {
  const response = await http.patch<{ propiedad: Property }>(`/vendedor/propiedades/${id}/estado`, { nuevoEstado });
  return response.data.propiedad;
};

/**
 * da de baja una propiedad (pasa a cancelada).
 *
 * @param id id de la propiedad
 * @returns nada
 */
export const cancelProperty = async (id: number): Promise<void> => {
  await http.delete(`/vendedor/propiedades/${id}`);
};

// ---------------------------------------------------------------- fotos

/**
 * pide las fotos de una propiedad propia, ordenadas por posicion.
 *
 * @param propertyId id de la propiedad
 * @param signal permite cancelar el pedido (opcional)
 * @returns la lista de fotos
 */
export const listPhotos = async (propertyId: number | string, signal?: AbortSignal): Promise<Photo[]> => {
  const response = await http.get<{ photos: Photo[] }>(`/vendedor/propiedades/${propertyId}/fotos`, { signal });
  return response.data.photos;
};

/**
 * agrega una foto a una propiedad.
 *
 * @param propertyId id de la propiedad
 * @param data url de la imagen y su posicion en la galeria
 * @returns la foto creada
 */
export const addPhoto = async (propertyId: number | string, data: { url: string; orden: number }): Promise<Photo> => {
  const response = await http.post<{ photo: Photo }>(`/vendedor/propiedades/${propertyId}/fotos`, data);
  return response.data.photo;
};

/**
 * cambia el orden de una foto o la marca como portada.
 *
 * @param propertyId id de la propiedad
 * @param photoId id de la foto
 * @param data orden y/o esPortada
 * @returns nada
 */
export const updatePhoto = async (propertyId: number | string, photoId: number, data: { orden?: number; esPortada?: boolean }): Promise<void> => {
  await http.patch(`/vendedor/propiedades/${propertyId}/fotos/${photoId}`, data);
};

/**
 * elimina una foto.
 *
 * @param propertyId id de la propiedad
 * @param photoId id de la foto
 * @returns nada
 */
export const deletePhoto = async (propertyId: number | string, photoId: number): Promise<void> => {
  await http.delete(`/vendedor/propiedades/${propertyId}/fotos/${photoId}`);
};

// ---------------------------------------------------------------- consultas y visitas

/**
 * pide las consultas recibidas por el vendedor.
 *
 * @param sinResponder true para traer solo las pendientes
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado (hasta 50 consultas)
 */
export const listMyQuestions = async (sinResponder: boolean, signal?: AbortSignal): Promise<Paginated<Question>> => {
  const response = await http.get<Paginated<Question>>("/vendedor/comentarios", { params: { sinResponder: sinResponder || undefined, limit: 50 }, signal });
  return response.data;
};

/**
 * responde una consulta. la api responde 409 si ya estaba respondida.
 *
 * @param id id de la consulta
 * @param respuestaVendedor texto de la respuesta
 * @returns la consulta con su respuesta
 */
export const replyQuestion = async (id: number, respuestaVendedor: string): Promise<Question> => {
  const response = await http.put<Question>(`/vendedor/comentarios/${id}/respuesta`, { respuestaVendedor });
  return response.data;
};

/**
 * pide las visitas recibidas por el vendedor.
 *
 * @param estado estado por el que filtrar (opcional)
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado (hasta 50 visitas)
 */
export const listMyVisits = async (estado: string, signal?: AbortSignal): Promise<Paginated<Visit>> => {
  const response = await http.get<Paginated<Visit>>("/vendedor/visitas", { params: { estado: estado || undefined, limit: 50 }, signal });
  return response.data;
};

/**
 * cambia el estado de una visita.
 *
 * @param id id de la visita
 * @param estado estado al que se quiere pasar
 * @returns la visita actualizada
 */
export const updateVisitStatus = async (id: number, estado: EstadoVisita): Promise<Visit> => {
  const response = await http.put<Visit>(`/vendedor/visitas/${id}/estado`, { estado });
  return response.data;
};

// ---------------------------------------------------------------- actividad

/**
 * pide el feed de actividad, la mas reciente primero.
 *
 * @param page numero de pagina
 * @param signal permite cancelar el pedido (opcional)
 * @returns el resultado paginado
 */
export const listActivity = async (page: number, signal?: AbortSignal): Promise<Paginated<Activity>> => {
  const response = await http.get<Paginated<Activity>>("/vendedor/actividad", { params: { page, limit: 20 }, signal });
  return response.data;
};

/**
 * pide la cantidad de actividad sin leer.
 *
 * @param signal permite cancelar el pedido (opcional)
 * @returns el numero para el contador de la navegacion
 */
export const getUnreadCount = async (signal?: AbortSignal): Promise<number> => {
  const response = await http.get<{ sinLeer: number }>("/vendedor/actividad/sin-leer", { signal });
  return response.data.sinLeer;
};

/**
 * marca una actividad como leida.
 *
 * @param id id de la actividad
 * @returns nada
 */
export const markActivityRead = async (id: number): Promise<void> => {
  await http.patch(`/vendedor/actividad/${id}/leer`);
};

/**
 * marca toda la actividad como leida.
 *
 * @returns nada
 */
export const markAllActivityRead = async (): Promise<void> => {
  await http.patch("/vendedor/actividad/leer-todas");
};

// ---------------------------------------------------------------- reportes

export interface StatusCount {
  estado: EstadoPropiedad;
  cantidad: number;
}

export interface MonthlyEvolution {
  mes: string;
  publicaciones: number;
  cierres: number;
}

/**
 * pide la cantidad de propiedades por estado.
 *
 * @param signal permite cancelar el pedido (opcional)
 * @returns la lista de { estado, cantidad } con los siete estados
 */
export const getStatusSummary = async (signal?: AbortSignal): Promise<StatusCount[]> => {
  const response = await http.get<{ propiedadesPorEstado: StatusCount[] }>("/vendedor/reportes/por-estado", { signal });
  return response.data.propiedadesPorEstado;
};

/**
 * pide las publicaciones y cierres por mes.
 *
 * @param signal permite cancelar el pedido (opcional)
 * @returns la lista de { mes, publicaciones, cierres }
 */
export const getMonthlyEvolution = async (signal?: AbortSignal): Promise<MonthlyEvolution[]> => {
  const response = await http.get<{ evolucionMensual: MonthlyEvolution[] }>("/vendedor/reportes/mensual", { signal });
  return response.data.evolucionMensual;
};

/**
 * pide el tiempo promedio en mercado.
 *
 * @param signal permite cancelar el pedido (opcional)
 * @returns los dias promedio, o null si todavia no hubo ventas ni alquileres
 */
export const getAverageTimeOnMarket = async (signal?: AbortSignal): Promise<number | null> => {
  const response = await http.get<{ tiempoPromedioMercadoDias: number | null }>("/vendedor/reportes/tiempo-en-mercado", { signal });
  return response.data.tiempoPromedioMercadoDias;
};
