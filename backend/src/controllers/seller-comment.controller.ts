/**
 * controlador de las consultas recibidas por el vendedor.
 * todas las rutas pasan antes por authenticateToken, asi que req.user siempre existe.
 */

import type { Request, Response } from "express";
import { questionService } from "../services/question.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { parsePagination } from "../utils/pagination.utils";
import { toId } from "../utils/id.utils";

class SellerCommentController {
  /**
   * GET /api/vendedor/comentarios
   * lista las consultas de todas las propiedades del vendedor, las mas nuevas primero.
   *
   * @param request req.user y query: sinResponder (true para ver solo las pendientes), page, limit
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }
   */
  async getComments(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const sinResponder = request.query.sinResponder === 'true';
    const { page, limit } = parsePagination(request.query, 10);

    const result = await questionService.getQuestionsBySeller(sellerId, undefined, sinResponder, page, limit);
    response.json(result);
  }

  /**
   * GET /api/vendedor/propiedades/:id/comentarios
   * lista las consultas de una propiedad del vendedor.
   *
   * @param request req.user, params: id de la propiedad, y query: sinResponder, page, limit
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }, o 400 con { error } si el id no es un numero
   */
  async getPropertyComments(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(400).json({ error: "ID de propiedad inválido" });
      return;
    }

    const sinResponder = request.query.sinResponder === 'true';
    const { page, limit } = parsePagination(request.query, 10);

    const result = await questionService.getQuestionsBySeller(sellerId, Number(id), sinResponder, page, limit);
    response.json(result);
  }

  /**
   * PUT /api/vendedor/comentarios/:id/respuesta
   * guarda la respuesta del vendedor a una consulta.
   *
   * @param request req.user, params: id de la consulta, y body ya validado: respuestaVendedor
   * @param response respuesta http
   * @returns 200 con la consulta respondida, 403 si es de otro vendedor, 404 si no existe, o 409 si ya estaba respondida
   */
  async replyToComment(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(400).json({ error: "ID de consulta inválido" });
      return;
    }

    const result = await questionService.replyToQuestion(Number(id), sellerId, request.body.respuestaVendedor);

    if (!result.success) {
      response.status(result.status).json({ error: result.message });
      return;
    }

    response.json(result.question);
  }
}

export const sellerCommentController = new SellerCommentController();
