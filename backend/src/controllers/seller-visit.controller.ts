import type { Request, Response } from "express";
import { visitService } from "../services/visit.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const ID_REGEX = /^\d+$/;

class SellerVisitController {
  /**
   * GET /api/vendedor/visitas
   * Listar todas las solicitudes de visita recibidas.
   * Filtro opcional: estado (ej. PENDIENTE, CONFIRMADA)
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
   * GET /api/vendedor/propiedades/:id/visitas
   * Listar visitas de una propiedad específica.
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
   * PUT /api/vendedor/visitas/:id/estado
   * Actualizar el estado de una visita (ej. PENDIENTE -> CONFIRMADA -> REALIZADA o CANCELADA/RECHAZADA)
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
