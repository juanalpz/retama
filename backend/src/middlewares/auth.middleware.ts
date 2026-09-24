/**
 * @fileoverview Middlewares de autenticación y autorización para Express.
 * Implementa la verificación de tokens JWT en cabeceras HTTP y la restricción
 * de endpoints mediante el esquema de control de acceso por roles (RBAC).
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config';
import { success } from 'zod';

/**
 * Interfaz que extiende la Request de Express con los datos del usuario
 * decodificados del token JWT por el middleware `authenticateToken`.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

/** 
 * Middleware para autenticar solicitudes HTTP mediante un token JWT.
 * 
 * Extrae el token de la cabecera 'Authorization' (esperando el formato 'Bearer <TOKEN>'),
 * valida su firma y su fecha de expiración. Si es correcto, inyecta los datos del usuario
 * en la propiedad 'req.user' para su uso en los siguientes controladores.
 * 
 * @params {Request} req - Objeto de petición HTTP de Express.
 * @param {Response} res - Objeto de respuesta HTTP de Express.
 * @param {NextFunction} next - Función callback para continuar al siguiente middleware o controlador.
 * @returns {Response | void} - Retorna un error HTTP 401/403 en JSON si falla, o invoca 'next()' si es válido.
 * 
 * @example
 * router.get('/perfil', authenticateToken, obtenerPerfilController);
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // 1. Extraemos el encabezado 'Authorization' enviado por el cliente.
    const authHeader = req.headers['authorization'];

    // 2. Formato esperado: 'Bearer <TOKEN>'. Separamos la cadena y tomamos la segunda posición.
    const token = authHeader && authHeader.split(' ')[1];

    // 3. Si no se proporcionó ningún token en los headers, denegamos el acceso con 401 (Unauthorized).
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado: Token no proporcionado'
        });
    }

    try {
        // 4. Verificamos la firma y validez del token con la clave secreta de la app.
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: number; role: string };

        // 5. Adjuntamos el usuario decodificado a la request de Express.
        (req as any).user = decoded;

        // 6. Todo correcto, cedemos el control al controlador final.
        next();
    } catch (error) {
        // Retornamos 403 (Forbidden) si el token fue alterado, es inválido o expiró.
        return res.status(403).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

/**
 * Factory Middleware para autorizar solicitudes basándose en el Rol del usuario.
 * 
 * Comprueba que el usuario previamente autenticado posea uno de los roles permitidos.
 * Debe ejecutarse SIEMPRE después del middleware 'authenticateToken'.
 * 
 * @param {...string} allowedRoles - Lista de roles permitidos para acceder a la ruta ('ADMIN' o 'VENDEDOR').
 * @returns {Function} - Función middleware de Express que valida el rol.
 * 
 * @example
 * router.post('/propiedades', authenticateToken, authorizeRoles('VENDEDOR'), crearPropiedadController);
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Extraemos el usuario decodificado guardado anteriormente en la request.
        const user = (req as any).user;

        // Verificamos si existe el usuario y si su rol está incluido en la lista permitida.
        if (!user || !allowedRoles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: No tenés permisos suficientes'
            });
        }

        // El usuario cuenta con el rol requerido, permitimos continuar.
        next();
    };
};