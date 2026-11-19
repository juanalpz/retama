/**
 * helpers de seguridad: hash de contraseñas con bcrypt y tokens jwt.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config';

/**
 * genera el hash de una contraseña para guardarlo en la base.
 *
 * @param password contraseña en texto plano
 * @returns el hash de bcrypt (incluye la sal)
 */
export const hashPassword = async (password: string): Promise<string> => {
  // hashea la clave usando bcrypt y la cantidad de rondas configurada
  return await bcrypt.hash(password, ENV.BCRYPT_ROUNDS);
};

/**
 * compara una contraseña en texto plano contra un hash guardado.
 *
 * @param password contraseña que ingreso el usuario
 * @param hash hash guardado en la base
 * @returns true si coinciden, false si no
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // compara la contraseña mediante el método seguro de bcrypt.
  return await bcrypt.compare(password, hash);
};

/**
 * firma un token jwt con los datos minimos del usuario. dura 2 horas.
 *
 * @param payload objeto con id (id del vendedor) y role (su rol)
 * @returns el token firmado, como texto
 */
export const generateToken = (payload: { id: number; role: string }): string => {
  // firma el token adjuntando el payload, la clave secreta y el tiempo de expiración de 2hs.
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '2h' });
}