"use strict";
/**
 * @fileoverview Funciones utilitarias para la seguridad, hashing de contraseñas y JWT.
 * Implementa el encriptado de claves mediante bcryptjs y la generación de tokens
 * con jsonwebtoken para el manejo de sesiones de vendedores.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
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
const hashPassword = async (password) => {
    // Hashea la clave usando bcrypt y la cantidad de rondas configurada
    return await bcryptjs_1.default.hash(password, env_config_1.ENV.BCRYPT_ROUNDS);
};
exports.hashPassword = hashPassword;
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
const comparePassword = async (password, hash) => {
    // Compara la contraseña mediante el método seguro de bcrypt.
    return await bcryptjs_1.default.compare(password, hash);
};
exports.comparePassword = comparePassword;
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
const generateToken = (payload) => {
    // Firma el token adjuntando el payload, la clave secreta y el tiempo de expiración de 2hs.
    return jsonwebtoken_1.default.sign(payload, env_config_1.ENV.JWT_SECRET, { expiresIn: '2h' });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.utils.js.map