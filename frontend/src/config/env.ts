/**
 * configuracion del front que sale de las variables de entorno.
 * es el unico archivo que lee import.meta.env.
 */

// url base de la api. si no se define VITE_API_URL se usa el backend local.
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
