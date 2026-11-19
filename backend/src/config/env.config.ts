/**
 * lectura centralizada de las variables de entorno.
 * los valores salen del archivo .env para no dejar secretos escritos en el codigo.
 * el resto del proyecto importa ENV desde aca en vez de leer process.env.
 */

import dotenv from 'dotenv';

// carga las variables del archivo .env en process.env
dotenv.config();

// origenes que pueden llamar a la api desde el navegador.
// si no se define CORS_ORIGIN se usa el puerto por defecto de vite.
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const ENV = {
  // puerto donde escucha el servidor
  PORT: Number(process.env.PORT) || 3000,

  // clave para firmar y verificar los tokens jwt
  JWT_SECRET: process.env.JWT_SECRET || 'secreto_retama_dev',

  // rondas de hashing de bcrypt
  BCRYPT_ROUNDS: 10,

  // lista de origenes permitidos por cors
  CORS_ORIGINS: corsOrigins,
};
