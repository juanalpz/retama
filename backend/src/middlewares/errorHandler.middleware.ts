/**
 * @fileoverview Middleware global de captura y manejo de errores para Express.
 * Intercepta cualquier excepción o error no controlado generado en las rutas,
 * controladores o servicios de la aplicación, emitiendo una respuesta JSON 
 * uniforme y previniendo la exposición del stack trace por seguridad.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Interceptor/Manejador global de errores de la aplicación HTTP.
 * 
 * Express reconoce automáticamente a esta función como un middleware de errores
 * por contar con 4 parámetros en su firma '(err, req, res, next)'.
 * 
 * @param {any} err - Objeto de error capturado (puede incluir 'statusCode', y 'message').
 * @param {Request} req - Objeto de petición HTTP de Express.
 * @param {Response} res - Objeto de respuesta HTTP de Express.
 * @param {NextFunction} next - Función callback para continuar el flujo de middlewares.
 * @returns {Response} - Respuesta HTTP en formato JSON con la estructura homologada '{ success: false, error: string }'.
 * 
 * @example
 * // Se registra SIEMPRE al final de app.ts, después de todas las rutas:
 * app.use(errorHandler);
 */
export const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // 1. Imprimimos el detalle del error en la consola interna del servidor para fines de depuración y logging
  console.error('Error capturado en el servidor:', err.message || err);

  // 2. Extraemos el código de estado HTTP (por defecto 500 Internal Server Error si no fue especificado).
  const statusCode = err.statusCode || 500;
  
  // 3. Definimos un mensaje amigable y seguro para el cliente.
  const message = err.message || 'Error interno del servidor';

  // 4. Retornamos la respuesta estandarizada en formato JSON sin filtrar detalles de la infraestructura.
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};