/** 
 * @fileoverview controlador del perfil publico de inmobiliarias.
 * permite consultar el detalle de la inmobiliaria, su catalogo exclusivo y dejar reseñas.
 */

import type { Request, Response } from "express";
import { agencyService } from "../services/agency.service";
import { reviewSchema } from "../schemas/review.schema";

const ID_REGEX = /^\d+$/;

class AgencyController {
  /**
   * lista todas las agencias con paginacion y filtro opcional por nombre.
   * 
   * @async
   * @param {Request} request - peticion http
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} JSON con listado paginado
   * 
   * @example
   * get /agencies?nombre=mar
   */
  async listAll(request: Request, response: Response): Promise<void> {
    const nombre = request.query.nombre as string | undefined;
    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 10;

    const agencies = await agencyService.getAll(nombre, page, limit);
    response.json(agencies);
  }

  /**
   * obtiene los datos de contacto y el perfil de una inmobiliaria por su id.
   * 
   * @async
   * @param {Request} request - peticion http con id de la inmobiliaria
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con el json de la agencia o 404
   * 
   * @example
   * get /agencies/1
   */
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Agency not found" });
      return;
    }

    const agency = await agencyService.getById(Number(id));

    if (!agency) {
      response.status(404).json({ message: "Agency not found" });
      return;
    }

    response.json(agency);
  }

  /**
   * obtiene el catalogo paginado de propiedades que pertenecen a una inmobiliaria.
   * 
   * @async
   * @param {Request} request - peticion http con id y query params de paginacion (page, limit)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con las propiedades paginadas o 404
   * 
   * @example
   * get /agencies/1/properties?page=1&limit=12
   */
  async getProperties(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Agency not found" });
      return;
    }

    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 12;

    const properties = await agencyService.getProperties(Number(id), page, limit);

    response.json(properties);
  }

  /**
   * crea una reseña (1 a 5 estrellas) para una inmobiliaria.
   * 
   * @async
   * @param {Request} request - peticion http con id y body (nombreautor, emailautor, calificacion, comentario)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con la reseña creada o error 400/404
   * 
   * @example
   * post /agencies/1/reviews
   */
  async createReview(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Agency not found" });
      return;
    }

    const parseResult = reviewSchema.safeParse(request.body);

    if (!parseResult.success) {
      response.status(400).json({ message: "Invalid body", issues: parseResult.error.issues });
      return;
    }

    const review = await agencyService.createReview(Number(id), parseResult.data);

    if (!review) {
      response.status(404).json({ message: "Agency not found" });
      return;
    }

    response.status(201).json(review);
  }

  /**
   * obtiene las reseñas de una inmobiliaria de forma paginada.
   * 
   * @async
   * @param {Request} request - peticion http con id de la agencia y query params (page, limit)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con las reseñas paginadas o 404
   * 
   * @example
   * get /agencies/1/reviews?page=1&limit=5
   */
  async getReviews(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Agency not found" });
      return;
    }

    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 10;

    const result = await agencyService.getReviews(Number(id), page, limit);

    if (!result) {
      response.status(404).json({ message: "Agency not found" });
      return;
    }

    response.json(result);
  }
}

export const agencyController = new AgencyController();
