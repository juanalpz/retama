/**
 * middlewares de autenticacion y autorizacion.
 * verifican el token jwt del header Authorization y el rol del usuario.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config';

// request de express con los datos del usuario que venian en el token
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

/**
 * exige un token jwt valido en el header "Authorization: Bearer <token>".
 * si es valido deja los datos del usuario en req.user y sigue con el siguiente
 * middleware. si falta, esta vencido o fue alterado corta el pedido con 401,
 * asi el front puede cerrar la sesion y mandar al login en un solo lugar.
 *
 * @param req peticion http; se lee el header authorization
 * @param res respuesta http; se usa solo para responder el 401
 * @param next funcion que pasa el control al siguiente middleware
 * @returns la respuesta 401 con { error }, o nada si el token es valido
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  // el formato esperado es "Bearer <token>", nos quedamos con la segunda parte
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: number; role: string };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * arma un middleware que deja pasar solo a los roles indicados.
 * va siempre despues de authenticateToken, porque necesita req.user.
 *
 * @param allowedRoles roles permitidos, por ejemplo 'VENDEDOR', 'ADMIN'
 * @returns un middleware que responde 403 con { error } si el rol no alcanza, o sigue si alcanza
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Acceso denegado: no tenés permisos suficientes' });
    }

    next();
  };
};
