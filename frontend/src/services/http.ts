/**
 * cliente http unico del front.
 * todos los servicios usan esta instancia de axios: ningun componente arma
 * urls ni headers a mano. se encarga de la url base, del token y de dejar
 * los errores de la api siempre con la misma forma.
 */

import axios, { AxiosError } from "axios";
import { API_URL } from "../config/env";
import type { ApiError } from "../types/api";
import { expireSession, getToken } from "./session";

export const http = axios.create({ baseURL: API_URL });

// agrega el token a cada pedido si hay una sesion iniciada
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * convierte cualquier error de un pedido en un ApiError.
 * la api responde { error, details? }; details se pasa a un objeto por campo
 * para que los formularios puedan mostrar cada mensaje junto a su input.
 *
 * @param error lo que lanzo axios (o cualquier otra cosa)
 * @returns el error normalizado: status, message y fields
 */
export const toApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const response = (error as AxiosError<{ error?: string; details?: { field: string; message: string }[] }>).response;

    // sin respuesta: el servidor esta caido o no hay conexion
    if (!response) {
      return { status: 0, message: "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.", fields: {} };
    }

    const fields: Record<string, string> = {};
    for (const detail of response.data?.details ?? []) {
      // si un campo tiene varios errores se muestra el primero
      if (!fields[detail.field]) fields[detail.field] = detail.message;
    }

    return {
      status: response.status,
      message: response.data?.error || "Ocurrió un error inesperado.",
      fields,
    };
  }

  return { status: 0, message: "Ocurrió un error inesperado.", fields: {} };
};

// todo error sale ya normalizado. un 401 con sesion iniciada significa que el
// token vencio: se cierra la sesion y la app manda al login.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    if (apiError.status === 401 && getToken()) {
      expireSession();
    }
    return Promise.reject(apiError);
  },
);
