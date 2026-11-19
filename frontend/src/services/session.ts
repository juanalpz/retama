/**
 * guarda la sesion del vendedor (token y datos) en localStorage.
 * vive aparte del contexto de react para que la capa http pueda leer el token
 * y cerrar la sesion sin depender de ningun componente.
 */

import type { User } from "../types/api";

const TOKEN_KEY = "retama.token";
const USER_KEY = "retama.user";

// evento que se dispara cuando la sesion se cierra desde fuera de react (por un 401)
export const SESSION_EXPIRED_EVENT = "retama:session-expired";

/**
 * lee el token guardado.
 *
 * @returns el token jwt, o null si no hay sesion
 */
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

/**
 * lee los datos del vendedor guardados.
 *
 * @returns el vendedor, o null si no hay sesion o el dato guardado esta roto
 */
export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

/**
 * guarda la sesion despues de un login o registro.
 *
 * @param token token jwt que devolvio la api
 * @param user datos del vendedor
 * @returns nada
 */
export const saveSession = (token: string, user: User): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * borra la sesion guardada.
 *
 * @returns nada
 */
export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * cierra la sesion porque la api rechazo el token y avisa a la app,
 * que escucha el evento para mandar al login.
 *
 * @returns nada
 */
export const expireSession = (): void => {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};
