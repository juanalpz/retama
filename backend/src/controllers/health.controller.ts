/**
 * controlador de salud de la api.
 */

import type { Request, Response } from "express";

// =================================================================================
// endpoints: health check
// =================================================================================

/**
 * GET /api/health
 * confirma que la api esta respondiendo.
 *
 * @param _request peticion http (no se usa)
 * @param response respuesta http
 * @returns 200 con { status: "ok" }
 */
export function getHealth(_request: Request, response: Response): void {
  response.json({ status: "ok" });
}