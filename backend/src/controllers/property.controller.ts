/** 
 * @fileoverview controlador de catalogo publico de propiedades e interacciones.
 * maneja el listado filtrado, detalle de propiedades y la creacion de comentarios o visitas.
 */

import type { Request, Response } from "express";
import { propertyService } from "../services/property.service";
import { commentService } from "../services/comment.service";
import { visitService } from "../services/visit.service";
import { commentSchema } from "../schemas/comment.schema";
import { visitSchema } from "../schemas/visit.schema";

const ID_REGEX = /^\d+$/;

class PropertyController {
  /**
   * lista todas las propiedades disponibles con filtros opcionales y paginacion.
   * 
   * @async
   * @param {Request} request - peticion http que incluye query params (tipo, operacion, minprice, maxprice, barriozona, page, limit)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con el json de resultados paginados
   * 
   * @example
   * get /properties?operacion=venta&page=1&limit=10
   */
  async listAll(request: Request, response: Response): Promise<void> {
    const tagsQuery = request.query.tags as string;
    const tags = tagsQuery ? tagsQuery.split(',').map(t => t.trim()) : undefined;

    const filters = {
      titulo: request.query.titulo as string,
      tipo: request.query.tipo as string,
      operacion: request.query.operacion as string,
      minPrice: request.query.minPrice ? Number(request.query.minPrice) : undefined,
      maxPrice: request.query.maxPrice ? Number(request.query.maxPrice) : undefined,
      barrioZona: request.query.barrioZona as string,
      ambientes: request.query.ambientes ? Number(request.query.ambientes) : undefined,
      tags: tags,
      sortBy: request.query.sortBy as string,
      sortOrder: request.query.sortOrder as 'ASC' | 'DESC' | undefined,
      page: parseInt(request.query.page as string, 10) || 1,
      limit: parseInt(request.query.limit as string, 10) || 12,
    };

    const properties = await propertyService.getAll(filters);
    response.json(properties);
  }

  /**
   * obtiene el detalle completo de una propiedad por su id.
   * 
   * @async
   * @param {Request} request - peticion http con id en parametros
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con json de la propiedad o 404 si no existe
   * 
   * @example
   * get /properties/5
   */
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const property = await propertyService.getById(Number(id));

    if (!property) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.json(property);
  }

  /**
   * obtiene los comentarios de una propiedad con paginacion.
   * 
   * @async
   * @param {Request} request - peticion http con id de propiedad y query params (page, limit)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con JSON de comentarios paginados o 404
   * 
   * @example
   * get /properties/5/comments?page=1&limit=5
   */
  async getComments(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 10;

    const result = await commentService.getByPropertyId(Number(id), page, limit);

    if (!result) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.json(result);
  }

  /**
   * crea un comentario o consulta para una propiedad especifica.
   * 
   * @async
   * @param {Request} request - peticion http con id de propiedad y body validado (nombre, email, comentario)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con el comentario creado o 400/404 ante errores
   * 
   * @example
   * post /properties/5/comments
   */
  async createComment(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const parseResult = commentSchema.safeParse(request.body);

    if (!parseResult.success) {
      response.status(400).json({ message: "Invalid body", issues: parseResult.error.issues });
      return;
    }

    const comment = await commentService.create(Number(id), parseResult.data);

    if (!comment) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.status(201).json(comment);
  }

  /**
   * solicita un turno de visita para una propiedad especifica.
   * 
   * @async
   * @param {Request} request - peticion http con body validado (nombrevisitante, apellidovisitante, fechapropuesta futura)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con el turno de visita creado o 400/404 ante errores
   * 
   * @example
   * post /properties/5/visits
   */
  async createVisit(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const parseResult = visitSchema.safeParse(request.body);

    if (!parseResult.success) {
      response.status(400).json({ message: "Invalid body", issues: parseResult.error.issues });
      return;
    }

    const visit = await visitService.create(Number(id), parseResult.data);

    if (!visit) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.status(201).json(visit);
  }
}

export const propertyController = new PropertyController();