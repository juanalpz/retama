/** 
 * @fileoverview controlador de catalogo publico de propiedades e interacciones.
 * maneja el listado filtrado, detalle de propiedades y la creacion de comentarios o visitas.
 */

import type { Request, Response } from "express";
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { propertyService } from "../services/property.service";
import { questionService } from "../services/question.service";
import { questionService } from "../services/question.service";
import { visitService } from "../services/visit.service";
import { questionSchema } from "../schemas/question.schema";
import { questionSchema } from "../schemas/question.schema";
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
   * obtiene las preguntas de una propiedad con paginacion.
   * 
   * @async
   * @param {Request} request - peticion http con id de propiedad y query params (page, limit)
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con JSON de preguntas paginadas o 404
   * 
   * @example
   * get /properties/5/questions?page=1&limit=5
   */
  async getQuestions(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 10;

    const result = await questionService.getByPropertyId(Number(id), page, limit);
    const result = await questionService.getByPropertyId(Number(id), page, limit);

    if (!result) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.json(result);
  }

  /**
   * crea una pregunta para una propiedad especifica.
   * 
   * @async
   * @param {Request} request - peticion http con id de propiedad y body validado
   * @param {Response} response - respuesta http
   * @returns {Promise<void>} responde con la pregunta creada o 400/404 ante errores
   * 
   * @example
   * post /properties/5/questions
   */
  async createQuestion(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const parseResult = questionSchema.safeParse(request.body);

    if (!parseResult.success) {
      response.status(400).json({ message: "Invalid body", issues: parseResult.error.issues });
      return;
    }

    const question = await questionService.create(Number(id), parseResult.data);

    if (!question) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.status(201).json(question);
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

// ==========================================
// 2. CONTROLADOR PRIVADO (Dashboard)
// ==========================================

export const createProperty = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'No se pudo identificar al usuario desde el token' });
        
        // El request.body ya debe venir validado por el middleware validateSchema(createPropertySchema)
        const property = await propertyService.createProperty(sellerId, req.body);
        if (!property) return res.status(404).json({ success: false, message: 'Inmobiliaria no encontrada' });
        
        return res.status(201).json({ success: true, message: 'Propiedad creada en estado BORRADOR', propiedad: property });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const getSellerProperties = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 12;
        const estado = req.query.estado as string | undefined;

        const result = await propertyService.getSellerProperties(sellerId, estado, page, limit);
        if (!result) return res.status(404).json({ success: false, message: 'Inmobiliaria no encontrada' });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const getSellerPropertyById = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const property = await propertyService.getSellerPropertyById(sellerId, propertyId);
        if (!property) return res.status(404).json({ success: false, message: 'Propiedad no encontrada' });

        return res.status(200).json(property);
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const updateProperty = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const result = await propertyService.updateProperty(sellerId, propertyId, req.body);
        if (!result.success) {
            return res.status(result.message?.includes('no encontrada') ? 404 : 400).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, message: 'Propiedad actualizada exitosamente', propiedad: result.property });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const changePropertyStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const { nuevoEstado } = req.body;

        const result = await propertyService.changePropertyStatus(sellerId, propertyId, nuevoEstado);
        if (!result.success) {
            const status = result.message?.includes('no encontrada') ? 404 : 400;
            return res.status(status).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, message: `Estado cambiado exitosamente a ${nuevoEstado}`, propiedad: result.property });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const deleteProperty = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const result = await propertyService.deleteProperty(sellerId, propertyId);
        if (!result.success) {
            const status = result.message?.includes('no encontrada') ? 404 : 400;
            return res.status(status).json({ success: false, message: result.message });
        }

        return res.status(200).json({ success: true, message: 'Propiedad dada de baja exitosamente' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};