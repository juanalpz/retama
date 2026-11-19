import { render } from "@testing-library/react";
import { vi } from "vitest";
import { App } from "../src/App";
import * as agencies from "../src/services/agencies";
import * as auth from "../src/services/auth";
import * as panel from "../src/services/panel";
import * as properties from "../src/services/properties";
import type { Activity, Agency, ApiError, Paginated, Property, Question, Review, User, Visit } from "../src/types/api";

// los tests de pantallas reemplazan la capa de servicios con vi.mock, asi que
// estos modulos llegan aca como funciones simuladas
export const api = {
  auth: vi.mocked(auth),
  properties: vi.mocked(properties),
  agencies: vi.mocked(agencies),
  panel: vi.mocked(panel),
};

/**
 * arma una respuesta paginada como las que devuelve la api.
 *
 * @param data elementos de la pagina
 * @param extra campos de paginacion que el test quiere pisar (opcional)
 * @returns el objeto { data, total, page, limit, totalPages }
 */
export const paged = <T,>(data: T[], extra: Partial<Paginated<T>> = {}): Paginated<T> => ({
  data,
  total: data.length,
  page: 1,
  limit: 12,
  totalPages: data.length > 0 ? 1 : 0,
  ...extra,
});

/**
 * arma un error con la forma que entrega la capa http del front.
 *
 * @param status codigo http
 * @param message mensaje del back
 * @param fields errores por campo (opcional)
 * @returns el error normalizado
 */
export const apiError = (status: number, message: string, fields: Record<string, string> = {}): ApiError => ({ status, message, fields });

export const AGENCY: Agency = {
  id: 1,
  nombreFantasia: "Inmobiliaria del Mar",
  descripcion: "Más de 20 años en Pinamar.",
  logoUrl: null,
  direccionLinea1: "Av. Bunge 1250, Pinamar",
  direccionLinea2: null,
  createdAt: "2026-01-10T12:00:00.000Z",
  telefonos: [{ id: 1, telefono: "02254-48-1111", tipoTelefono: null }],
  correos: [{ id: 1, correo: "juan@inmobiliaria.com", tipoCorreo: null }],
  calificacionPromedio: 4,
  cantidadResenias: 1,
};

export const USER: User = {
  id: 1,
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@inmobiliaria.com",
  rol: "VENDEDOR",
  createdAt: "2026-01-10T12:00:00.000Z",
  inmobiliaria: { id: 1, nombreFantasia: "Inmobiliaria del Mar", descripcion: null, logoUrl: null, direccionLinea1: null, direccionLinea2: null },
};

/**
 * arma una propiedad de prueba.
 *
 * @param extra campos que el test quiere pisar (opcional)
 * @returns una casa en venta, publicada, con dos fotos y un amenity
 */
export const property = (extra: Partial<Property> = {}): Property => ({
  id: 2,
  titulo: "Casa con pileta en Ostende",
  descripcion: "Casa de tres dormitorios sobre lote arbolado.",
  tipoPropiedad: "CASA",
  operacion: "VENTA",
  precio: 120000,
  moneda: "USD",
  direccionLinea1: "Cairo 845",
  barrioZona: "Ostende",
  superficieTotalM2: 600,
  superficieCubiertaM2: 140,
  ambientes: 4,
  dormitorios: 3,
  banios: 2,
  antiguedad: 15,
  estado: "PUBLICADA",
  createdAt: "2026-01-10T12:00:00.000Z",
  updatedAt: "2026-01-10T12:00:00.000Z",
  fotos: [
    { id: 1, url: "/fotos/foto-01.jpg", orden: 0, esPortada: true },
    { id: 2, url: "/fotos/foto-02.jpg", orden: 1, esPortada: false },
  ],
  tags: [{ id: 1, tag: { id: 1, tag: "Pileta" } }],
  agency: AGENCY,
  ...extra,
});

/**
 * arma una consulta de prueba.
 *
 * @param extra campos que el test quiere pisar (opcional)
 * @returns una consulta pendiente sobre la propiedad 2
 */
export const question = (extra: Partial<Question> = {}): Question => ({
  id: 1,
  nombreSolicitante: "Lucía",
  pregunta: "¿Admite mascotas?",
  respuestaVendedor: null,
  fechaCreacion: new Date().toISOString(),
  property: { id: 2, titulo: "Casa con pileta en Ostende" },
  ...extra,
});

/**
 * arma una solicitud de visita de prueba.
 *
 * @param extra campos que el test quiere pisar (opcional)
 * @returns una visita pendiente sobre la propiedad 2
 */
export const visit = (extra: Partial<Visit> = {}): Visit => ({
  id: 1,
  nombreVisitante: "Marcos",
  apellidoVisitante: null,
  telefonoVisitante: "1155550000",
  fechaPropuesta: "2030-05-10T15:00:00.000Z",
  mensajeAsociado: "Puedo por la tarde",
  estado: "PENDIENTE",
  fechaCreacion: new Date().toISOString(),
  property: { id: 2, titulo: "Casa con pileta en Ostende" },
  ...extra,
});

/**
 * arma una reseña de prueba.
 *
 * @param extra campos que el test quiere pisar (opcional)
 * @returns una reseña de 4 estrellas
 */
export const review = (extra: Partial<Review> = {}): Review => ({
  id: 1,
  nombreSolicitante: "Ana",
  resenia: "Muy buena atención.",
  calificacion: 4,
  fechaCreacion: "2026-02-01T12:00:00.000Z",
  ...extra,
});

/**
 * arma una actividad de prueba.
 *
 * @param extra campos que el test quiere pisar (opcional)
 * @returns una actividad sin leer generada por una consulta
 */
export const activity = (extra: Partial<Activity> = {}): Activity => ({
  id: 1,
  tipo: "COMENTARIO",
  referenciaId: 1,
  referenciaTipo: "pregunta",
  mensaje: "Lucía consultó por Casa con pileta en Ostende",
  leido: false,
  fechaCreacion: new Date().toISOString(),
  ...extra,
});

/**
 * deja todos los servicios simulados con una respuesta por defecto (listados
 * vacios, sin novedades), para que cada test solo pise lo que le interesa.
 *
 * @returns nada
 */
export const resetApi = (): void => {
  vi.resetAllMocks();

  api.auth.getMe.mockResolvedValue(USER);
  api.auth.login.mockResolvedValue({ token: "token-de-prueba", usuario: USER });
  api.auth.register.mockResolvedValue({ token: "token-de-prueba", usuario: USER });

  api.properties.listProperties.mockResolvedValue(paged<Property>([]));
  api.properties.listTags.mockResolvedValue([]);
  api.properties.getProperty.mockResolvedValue(property());

  api.agencies.listAgencies.mockResolvedValue(paged<Agency>([]));
  api.agencies.getAgency.mockResolvedValue(AGENCY);
  api.agencies.listAgencyProperties.mockResolvedValue(paged<Property>([]));
  api.agencies.listReviews.mockResolvedValue(paged<Review>([]));
  api.agencies.listQuestions.mockResolvedValue(paged<Question>([]));

  api.panel.getMyAgency.mockResolvedValue(AGENCY);
  api.panel.listMyProperties.mockResolvedValue(paged<Property>([]));
  api.panel.getMyProperty.mockResolvedValue(property());
  api.panel.listPhotos.mockResolvedValue([]);
  api.panel.listMyQuestions.mockResolvedValue(paged<Question>([]));
  api.panel.listMyVisits.mockResolvedValue(paged<Visit>([]));
  api.panel.listActivity.mockResolvedValue(paged<Activity>([]));
  api.panel.getUnreadCount.mockResolvedValue(0);
  api.panel.getStatusSummary.mockResolvedValue([]);
  api.panel.getMonthlyEvolution.mockResolvedValue([]);
  api.panel.getAverageTimeOnMarket.mockResolvedValue(null);
};

/**
 * guarda una sesion de vendedor en el navegador, como queda despues del login.
 *
 * @param user vendedor de la sesion (opcional, por defecto el de prueba)
 * @returns nada
 */
export const signIn = (user: User = USER): void => {
  localStorage.setItem("retama.token", "token-de-prueba");
  localStorage.setItem("retama.user", JSON.stringify(user));
};

/**
 * monta la aplicacion completa (rutas, layouts y contexto de sesion) parada
 * en una url, igual que si el usuario la abriera directo en el navegador.
 *
 * @param path url inicial, con su query si hace falta
 * @returns lo que devuelve render de testing library
 */
export const renderApp = (path = "/") => {
  window.history.pushState({}, "", path);
  return render(<App />);
};
