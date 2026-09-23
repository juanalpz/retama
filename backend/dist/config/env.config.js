"use strict";
/**
 * @fileoverview Configuración y lectura centralizada de las variables de entorno.
 * Carga las claves guardadas en el archivo '.env' para evitar hardcodear secretos
 * en el código de la aplicación (cumpliendo con las recomendaciones de OWASP A05).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Carga las variables definidas en el archivo .env hacia process.env
dotenv_1.default.config();
/**
 * Objeto global de configuración que centraliza las variables de entorno del servidor.
 *
 * @type {Object}
 * @property {number} PORT - Puerto en el que se ejecuta el servidor HTTP de Express (por defecto: 3000)
 * @property {string} JWT_SECRET - Clave secreta utilizada para la firma y verificación de tokens JWT
 * @property {number} BCRYPT_ROUNDS - Cantidad de rondas de salting para el algoritmo bcrypt (estándar: 10)
 */
exports.ENV = {
    // Puerto de escucha del servidor web
    PORT: Number(process.env.PORT) || 3000,
    // Clave secreta para firmar tokens JWT
    JWT_SECRET: process.env.JWT_SECRET || 'secreto_retama_dev',
    // Rondas de hashing para bcrypt
    BCRYPT_ROUNDS: 10,
};
//# sourceMappingURL=env.config.js.map