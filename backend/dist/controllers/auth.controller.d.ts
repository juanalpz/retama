/**
 * @fileoverview Controlador de Autenticación y Gestión de Usuarios/Inmobiliarias.
 * Maneja el registro unificado de vendedores con su inmobiliaria asociada,
 * la verificación de credenciales en el inicio de sesión y la emisión de tokens JWT.
 */
import { Request, Response } from 'express';
/**
 * Registra un nuevo usuario vendedor y crea automáticamente su perfil de Inmobiliaria asociado.
 *
 * 1. Verifica la unicidad del email del usuario y del nombre de fantasía de la inmobiliaria.
 * 2. Hashea la contraseña con bcrypt por seguridad (Security by Design / OWASP A02).
 * 3. Crea el registro en la tabla 'usuarios' y su correspondiente 'inmobiliarias'.
 * 4. Retorna el token JWT de sesión junto con los datos públicos creados.
 *
 * @async
 * @param {Request} req - Petición HTTP de Express conteniendo los datos validados del cuerpo
 * ('nombre', 'apellido', 'email', 'password', 'nombreFantasia', 'descripcion')
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 201 Created con token JWT o HTTP 400/500 en caso de conflicto/error.
 *
 * @example
 * POST /api/auth/register
 */
export declare const register: (req: Request, res: Response) => Promise<Response>;
/**
 * Autentica un usuario vendedor mediante sus credenciales (email y contraseña).
 *
 * 1. Busca el usuario en PostgreSQL por correo electrónico.
 * 2. Compara la contraseña en texto plano recibida contra el hash almacenado utilizando bcrypt.
 * 3. Genera y firma un token de acceso JWT si las credenciales son válidas.
 *
 * @async
 * @param {Request} req - Petición HTTP de Express conteniendo 'email' y 'password'.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con el token o HTTP 401 Unauthorized si falla.
 *
 * @example
 * POST /api/auth/login
 */
export declare const login: (req: Request, res: Response) => Promise<Response>;
