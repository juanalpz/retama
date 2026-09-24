/** 
 * @fileoverview Controlador de Visitas del Dashboard del Vendedor.
 * Permite al vendedor ver las solicitudes de visita recibidas para sus propiedades,
 * filtrar por propiedad o estado, y actualizar el estado de cada visita
 * (PENDIENTE → CONFIRMADA → REALIZADA, o CANCELADA/RECHAZADA).
 */

import type { Request, Response } from "express";
import { visitService } from "../services/visit.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const ID_REGEX = /^\d+$/;

// =================================================================================
// ENDPOINTS: GESTIÓN DE VISITAS (Dashboard Vendedor)
// =================================================================================

class SellerVisitController {
  /**
   * Lista todas las solicitudes de visita recibidas en las propiedades de la inmobiliaria.
   * 
   * Permite filtrar por estado (ej. 'PENDIENTE', 'CONFIRMADA') para gestionar
   * el pipeline de visitas desde el dashboard.
   * 
   * @async
   * @param {Request} request - Petición HTTP con query params opcionales ('estado', 'page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON paginado de visitas o HTTP 401.
   * 
   * @example
   * GET /api/vendedor/visitas?estado=PENDIENTE&page=1&limit=10
   * Headers: { "Authorization": "Bearer <TOKEN>" }
   */
  async getVisits(request: Request, response: Response): Promise<void> {
    const req = request as AuthenticatedRequest;
    const sellerId = req.user?.id;
    if (!sellerId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const estado = req.query.estado as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await visitService.getVisitsBySeller(sellerId, undefined, estado, page, limit);
    response.json(result);
  }

  /**
   * Lista las solicitudes de visita de una propiedad específica del vendedor.
   * 
   * Filtra por el ID de la propiedad recibido en los parámetros de ruta,
   * verificando que pertenezca a la inmobiliaria del vendedor autenticado.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' de la propiedad en params
   *   y query params opcionales ('estado', 'page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON paginado o HTTP 400/401.
   * 
   * @example
   * GET /api/vendedor/propiedades/5/visitas?estado=CONFIRMADA
   * Headers: { "Authorization": "Bearer <TOKEN>" }
   */
  async getPropertyVisits(request: Request, response: Response): Promise<void> {
    const req = request as AuthenticatedRequest;
    const sellerId = req.user?.id;
    if (!sellerId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = request.params;
    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(400).json({ message: "Invalid property ID" });
      return;
    }

    const estado = req.query.estado as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await visitService.getVisitsBySeller(sellerId, Number(id), estado, page, limit);
    response.json(result);
  }

  /**
   * Actualiza el estado de una solicitud de visita.
   * 
   * Permite al vendedor aceptar (CONFIRMADA), rechazar (RECHAZADA), cancelar (CANCELADA)
   * o marcar como realizada (REALIZADA) una visita. Valida que el estado recibido sea
   * uno de los permitidos y que la visita pertenezca a una propiedad de su inmobiliaria.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' de la visita en params
   *   y body con 'estado' (string: PENDIENTE | CONFIRMADA | REALIZADA | CANCELADA | RECHAZADA).
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con la visita actualizada, HTTP 400/403/404.
   * 
   * @example
   * PUT /api/vendedor/visitas/8/estado
   * Headers: { "Authorization": "Bearer <TOKEN>" }
   */
  async updateVisitStatus(request: Request, response: Response): Promise<void> {
    const req = request as AuthenticatedRequest;
    const sellerId = req.user?.id;
    if (!sellerId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = request.params;
    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(400).json({ message: "Invalid visit ID" });
      return;
    }

    const { estado } = request.body;
    if (!estado || typeof estado !== 'string') {
      response.status(400).json({ message: "Invalid body: 'estado' is required." });
      return;
    }

    // Opcional: Podríamos validar que el string sea uno de los permitidos, ej: PENDIENTE, CONFIRMADA, REALIZADA, CANCELADA, RECHAZADA.
    const validStates = ["PENDIENTE", "CONFIRMADA", "REALIZADA", "CANCELADA", "RECHAZADA"];
    const upperEstado = estado.toUpperCase();
    
    if (!validStates.includes(upperEstado)) {
      response.status(400).json({ message: `Invalid state. Must be one of: ${validStates.join(', ')}` });
      return;
    }

    const result = await visitService.updateVisitState(Number(id), sellerId, upperEstado);

    if (result === null) {
      response.status(404).json({ message: "Visit not found" });
      return;
    }

    if (result === false) {
      response.status(403).json({ message: "Forbidden: visit does not belong to your agency properties" });
      return;
    }

    response.json(result);
  }
}

export const sellerVisitController = new SellerVisitController();
