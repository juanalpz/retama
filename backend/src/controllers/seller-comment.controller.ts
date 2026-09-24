import type { Request, Response } from "express";
import { questionService } from "../services/question.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const ID_REGEX = /^\d+$/;

class SellerCommentController {
  /**
   * 6.1 GET /api/vendedor/comentarios
   * Listar todos los comentarios recibidos en las propiedades de la inmobiliaria.
   * Filtro opcional: sinResponder=true para ver solo pendientes.
   */
  async getComments(request: Request, response: Response): Promise<void> {
    const req = request as AuthenticatedRequest;
    const sellerId = req.user?.id;
    if (!sellerId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const sinResponder = req.query.sinResponder === 'true';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await questionService.getQuestionsBySeller(sellerId, undefined, sinResponder, page, limit);
    response.json(result);
  }

  /**
   * 6.2 GET /api/vendedor/propiedades/:id/comentarios
   * Listar comentarios de una propiedad específica del vendedor.
   */
  async getPropertyComments(request: Request, response: Response): Promise<void> {
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

    const sinResponder = req.query.sinResponder === 'true';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const result = await questionService.getQuestionsBySeller(sellerId, Number(id), sinResponder, page, limit);
    response.json(result);
  }

  /**
   * 6.3 PUT /api/vendedor/comentarios/:id/respuesta
   * Responder un comentario. Recibe { respuestaVendedor }.
   */
  async replyToComment(request: Request, response: Response): Promise<void> {
    const req = request as AuthenticatedRequest;
    const sellerId = req.user?.id;
    if (!sellerId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id } = request.params;
    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(400).json({ message: "Invalid comment ID" });
      return;
    }

    const { respuestaVendedor } = request.body;
    if (!respuestaVendedor || typeof respuestaVendedor !== 'string' || respuestaVendedor.trim() === '') {
      response.status(400).json({ message: "Invalid body: 'respuestaVendedor' is required and must be a string." });
      return;
    }

    const result = await questionService.replyToQuestion(Number(id), sellerId, respuestaVendedor.trim());

    if (result === null) {
      response.status(404).json({ message: "Comment not found" });
      return;
    }

    if (result === false) {
      response.status(403).json({ message: "Forbidden: comment does not belong to your agency properties" });
      return;
    }

    response.json(result);
  }
}

export const sellerCommentController = new SellerCommentController();
