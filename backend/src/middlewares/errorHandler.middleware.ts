/**
 * manejo central de errores de la api.
 * todas las respuestas de error usan el mismo formato: { error, details? }
 *   - error: mensaje legible para mostrar al usuario
 *   - details: opcional, lista de { field, message } cuando falla una validacion
 */

import { Request, Response, NextFunction } from 'express';

/**
 * responde cuando la ruta pedida no existe.
 * se registra despues de todas las rutas y antes del errorHandler.
 *
 * @param req peticion http; se usa el metodo y la url para armar el mensaje
 * @param res respuesta http
 * @returns la respuesta 404 con { error }
 */
export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

/**
 * captura cualquier error que no se haya manejado en los controladores.
 * express lo reconoce como middleware de errores porque recibe 4 parametros.
 * el detalle del error queda en la consola del servidor y nunca se envia al cliente.
 *
 * @param err error capturado; puede traer statusCode o status
 * @param req peticion http (no se usa)
 * @param res respuesta http
 * @param next siguiente middleware (no se usa, pero express exige el parametro)
 * @returns la respuesta con { error }: 400 si el body no era un json valido, el status del error si lo trae, o 500 con un mensaje generico
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // el body no era un json valido (lo detecta express.json)
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }

  const statusCode = err?.statusCode || err?.status || 500;

  // el detalle completo queda solo en la consola del servidor
  console.error('error capturado en el servidor:', err?.message || err);

  // en un error inesperado no se le muestra al cliente el mensaje interno ni el stack
  const message = statusCode >= 500 ? 'Error interno del servidor' : err?.message || 'Error en la petición';

  return res.status(statusCode).json({ error: message });
};
