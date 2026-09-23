/**
 * @fileoverview Configuración y lectura centralizada de las variables de entorno.
 * Carga las claves guardadas en el archivo '.env' para evitar hardcodear secretos
 * en el código de la aplicación (cumpliendo con las recomendaciones de OWASP A05).
 */
/**
 * Objeto global de configuración que centraliza las variables de entorno del servidor.
 *
 * @type {Object}
 * @property {number} PORT - Puerto en el que se ejecuta el servidor HTTP de Express (por defecto: 3000)
 * @property {string} JWT_SECRET - Clave secreta utilizada para la firma y verificación de tokens JWT
 * @property {number} BCRYPT_ROUNDS - Cantidad de rondas de salting para el algoritmo bcrypt (estándar: 10)
 */
export declare const ENV: {
    PORT: number;
    JWT_SECRET: string;
    BCRYPT_ROUNDS: number;
};
