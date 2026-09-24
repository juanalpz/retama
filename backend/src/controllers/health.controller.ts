/** 
 * @fileoverview Controlador de Salud del Sistema (Health Check).
 * Provee un endpoint liviano para verificar que el servidor está levantado
 * y respondiendo correctamente, sin requerir autenticación.
 */

import type { Request, Response } from "express";

// =================================================================================
// ENDPOINTS: HEALTH CHECK
// =================================================================================

/**
 * Retorna el estado actual del servidor.
 * 
 * Funciona como un "latido" que permite a clientes, balanceadores de carga
 * y servicios de monitoreo verificar que la API está disponible.
 * 
 * @param {Request} _request - Petición HTTP de Express (no se utiliza).
 * @param {Response} response - Respuesta HTTP de Express.
 * @returns {void} Respuesta HTTP 200 OK con un JSON indicando el estado.
 * 
 * @example
 * GET /api/health
 */
export function getHealth(_request: Request, response: Response): void {
  response.json({ status: "ok" });
}