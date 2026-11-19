/**
 * controlador de autenticacion: registro, login y sesion actual.
 * el body ya llega validado por el middleware validateSchema.
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { registerSeller, loginSeller, getAuthenticatedProfile } from '../services/auth.service';

/**
 * POST /api/auth/register
 * registra un vendedor y crea su inmobiliaria en el mismo paso.
 *
 * @param req body: nombre, apellido, email, password, nombreFantasia, y opcionales telefono y descripcion
 * @param res respuesta http
 * @returns 201 con { success, message, token, usuario }, o 409 con { error, details } si el email o el nombre de fantasia ya existen
 */
export const register = async (req: Request, res: Response): Promise<Response> => {
  const result = await registerSeller(req.body);

  if (!result.success) {
    const field = (result as { field?: string }).field;
    return res.status(result.status).json({
      error: result.message,
      ...(field ? { details: [{ field, message: result.message }] } : {}),
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Vendedor e inmobiliaria registrados con éxito',
    token: result.token,
    usuario: result.usuario,
  });
};

/**
 * POST /api/auth/login
 * inicia sesion con email y contraseña.
 *
 * @param req body: email, password
 * @param res respuesta http
 * @returns 200 con { success, message, token, usuario }, o 401 con { error } si las credenciales no son validas
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;
  const result = await loginSeller(email, password);

  if (!result.success) {
    return res.status(result.status).json({ error: result.message });
  }

  return res.status(200).json({
    success: true,
    message: 'Inicio de sesión exitoso',
    token: result.token,
    usuario: result.usuario,
  });
};

/**
 * GET /api/auth/me
 * devuelve el vendedor autenticado y su inmobiliaria a partir del token.
 * el front lo usa para restaurar la sesion al recargar la pagina.
 *
 * @param req peticion con req.user cargado por authenticateToken
 * @param res respuesta http
 * @returns 200 con { success, usuario }, o 401 con { error } si el vendedor del token ya no existe
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const sellerId = Number(req.user?.id);

  if (!sellerId) {
    return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });
  }

  const profile = await getAuthenticatedProfile(sellerId);

  // el token es valido pero el vendedor ya no existe: la sesion deja de servir
  if (!profile) {
    return res.status(401).json({ error: 'La sesión ya no es válida' });
  }

  return res.status(200).json({ success: true, usuario: profile });
};
