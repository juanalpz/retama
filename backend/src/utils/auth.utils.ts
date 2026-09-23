/**
 * @fileoverview Funciones utilitarias para la seguridad, hashing de contraseñas y JWT.
 * Implementa el encriptado de claves mediante bcryptjs y la generación de tokens
 * con jsonwebtoken para el manejo de sesiones de vendedores.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config';

/**
 * Genera un hash seguro a partir de una contraseña en texto plano, aplicando el algoritmo 
 * bcrypt con salt de 10 rondas.
 * 
 * @async
 * @param {string} password - Contraseña ingresada por el usuario en texto plano.
 * @returns {Promise<string>} - Promesa que resuelve en la contraseña encriptada (hash con salt).
 * 
 * @example
 * cont hashedPassword = await hashPassword('MiClave123');
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Hashea la clave usando bcrypt y la cantidad de rondas configurada
  return await bcrypt.hash(password, ENV.BCRYPT_ROUNDS);
};

/**
 * Compara una contraseña ingresada en texto plano contra el hash almacenado en PostgreSQL.
 * 
 * @async
 * @param {string} password - Contraseña en texto plano introducida en el formulario.
 * @param {string} hash - Hash recuperado previamente en la base de datos.
 * @returns {Promise<boolean>} - Promesa con valor booleano (true si coinciden, false si no).
 *  
 * @example
 * const esValida = await comparePassword('MiClave123', usuario.passwordHash);
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // Compara la contraseña mediante el método seguro de bcrypt.
  return await bcrypt.compare(password, hash);
};

/**
 * Genera un token de acceso JWT (JSON Web Token) firmado para autenticación stateless.
 * 
 * @param {Object} payload - Datos mínimos del usuario a incluir dentro del payload del token.
 * @param {number} payload.id - Identificador único del usuario (ID).
 * @param {string} payload.role - Rol asignado al usuario ('VENDEDOR' o 'ADMIN').
 * @returns {string} - Token firmado en formato de cadena de texto con tiempo de expiración de 2 horas.
 * 
 * @example
 * const token = generateToken({ id: 1, role: 'VENDEDOR' });
 */
export const generateToken = (payload: { id: number; role: string }): string => {
  // Firma el token adjuntando el payload, la clave secreta y el tiempo de expiración de 2hs.
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '2h' });
}