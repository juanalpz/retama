/**
 * controlador de las solicitudes de visita recibidas por el vendedor.
 * todas las rutas pasan antes por authenticateToken, asi que req.user siempre existe.
 */

import type { Request, Response } from "express";
import { visitService } from "../services/visit.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { parsePagination } from "../utils/pagination.utils";
import { toId } from "../utils/id.utils";

class SellerVisitController {
  /**
   * GET /api/vendedor/visitas
   * lista las visitas de todas las propiedades del vendedor, con el nombre y el
   * telefono de quien la pidio.
   *
   * @param request req.user y query: estado, page, limit
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }
   */
  async getVisits(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const estado = typeof request.query.estado === 'string' ? request.query.estado.toUpperCase() : undefined;
    const { page, limit } = parsePagination(request.query, 10);

    const result = await visitService.getVisitsBySeller(sellerId, undefined, estado, page, limit);
    response.json(result);
  }

  /**
   * GET /api/vendedor/propiedades/:id/visitas
   * lista las visitas de una propiedad del vendedor.
   *
   * @param request req.user, params: id de la propiedad, y query: estado, page, limit
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }, o 400 con { error } si el id no es un numero
   */
  async getPropertyVisits(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(400).json({ error: "ID de propiedad inválido" });
      return;
    }

    const estado = typeof request.query.estado === 'string' ? request.query.estado.toUpperCase() : undefined;
    const { page, limit } = parsePagination(request.query, 10);

    const result = await visitService.getVisitsBySeller(sellerId, Number(id), estado, page, limit);
    response.json(result);
  }

  /**
   * PUT /api/vendedor/visitas/:id/estado
   * cambia el estado de una visita (confirmar, rechazar, cancelar o marcar realizada).
   *
   * @param request req.user, params: id de la visita, y body ya validado: estado
   * @param response respuesta http
   * @returns 200 con la visita actualizada, 400 si la transicion no es valida, 403 si es de otro vendedor, o 404 si no existe
   */
  async updateVisitStatus(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(400).json({ error: "ID de visita inválido" });
      return;
    }

    const result = await visitService.updateVisitState(Number(id), sellerId, request.body.estado);

    if (!result.success) {
      response.status(result.status).json({ error: result.message });
      return;
    }

    response.json(result.visit);
  }
}

export const sellerVisitController = new SellerVisitController();
