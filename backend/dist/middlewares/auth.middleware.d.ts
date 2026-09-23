/**
 * @fileoverview Middlewares de autenticación y autorización para Express.
 * Implementa la verificación de tokens JWT en cabeceras HTTP y la restricción
 * de endpoints mediante el esquema de control de acceso por roles (RBAC).
 */
import { Request, Response, NextFunction } from 'express';
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
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
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
export declare const authorizeRoles: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
