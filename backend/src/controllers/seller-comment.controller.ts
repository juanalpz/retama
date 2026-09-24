/** 
 * @fileoverview Controlador de Consultas/Preguntas del Dashboard del Vendedor.
 * Permite al vendedor ver todas las consultas recibidas en las propiedades
 * de su inmobiliaria, filtrar por propiedad o por estado de respuesta,
 * y responder a las consultas de los interesados.
 */

import type { Request, Response } from "express";
import { questionService } from "../services/question.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const ID_REGEX = /^\d+$/;

// =================================================================================
// ENDPOINTS: GESTIÓN DE CONSULTAS (Dashboard Vendedor)
// =================================================================================

class SellerCommentController {
  /**
   * Lista todos los comentarios/consultas recibidos en las propiedades de la inmobiliaria.
   * 
   * Permite filtrar solo las consultas sin responder con el query param 'sinResponder=true',
   * útil para mostrar un badge con la cantidad de pendientes en el dashboard.
   * 
   * @async
   * @param {Request} request - Petición HTTP con query params opcionales ('sinResponder', 'page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON paginado de consultas o HTTP 401.
   * 
   * @example
   * GET /api/vendedor/comentarios?sinResponder=true&page=1&limit=10
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
   * Lista los comentarios/consultas de una propiedad específica del vendedor.
   * 
   * Filtra por el ID de la propiedad recibido en los parámetros de ruta,
   * verificando que pertenezca a la inmobiliaria del vendedor autenticado.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' de la propiedad en params
   *   y query params opcionales ('sinResponder', 'page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON paginado o HTTP 400/401.
   * 
   * @example
   * GET /api/vendedor/propiedades/5/comentarios?sinResponder=true
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
   * Permite al vendedor responder a una consulta recibida en una de sus propiedades.
   * 
   * Recibe el texto de la respuesta en el body y lo almacena en el campo 'respuestaVendedor'.
   * Verifica que la consulta exista y que pertenezca a una propiedad de la inmobiliaria del vendedor.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' de la consulta en params
   *   y body con 'respuestaVendedor' (string obligatorio).
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con la consulta actualizada, HTTP 400/403/404.
   * 
   * @example
   * PUT /api/vendedor/comentarios/12/respuesta
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
