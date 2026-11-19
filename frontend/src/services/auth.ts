/**
 * llamadas a la api de autenticacion.
 */

import type { User } from "../types/api";
import { http } from "./http";

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  nombreFantasia: string;
}

interface AuthResponse {
  token: string;
  usuario: User;
}

/**
 * registra un vendedor y crea su inmobiliaria.
 *
 * @param data datos del formulario de registro
 * @returns { token, usuario } de la cuenta creada
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  // el telefono es opcional: si esta vacio no se envia
  const body = { ...data, telefono: data.telefono?.trim() || undefined };
  const response = await http.post<AuthResponse>("/auth/register", body);
  return { token: response.data.token, usuario: response.data.usuario };
};

/**
 * inicia sesion.
 *
 * @param email email del vendedor
 * @param password contraseña
 * @returns { token, usuario }
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await http.post<AuthResponse>("/auth/login", { email, password });
  return { token: response.data.token, usuario: response.data.usuario };
};

/**
 * pide los datos del vendedor del token guardado.
 *
 * @returns el vendedor con su inmobiliaria
 */
export const getMe = async (): Promise<User> => {
  const response = await http.get<{ usuario: User }>("/auth/me");
  return response.data.usuario;
};
