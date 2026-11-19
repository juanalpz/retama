/**
 * controlador de propiedades.
 * la clase PropertyController atiende el catalogo publico; las funciones
 * exportadas mas abajo atienden el panel del vendedor (abm, estado y fotos).
 */

import type { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { propertyService } from "../services/property.service";
import { questionService } from "../services/question.service";
import { visitService } from "../services/visit.service";
import { parsePagination, parseNumberParam } from "../utils/pagination.utils";
import { toId } from "../utils/id.utils";

// =================================================================================
// endpoints: catálogo público de propiedades
// =================================================================================

class PropertyController {
  /**
   * GET /api/properties
   * listado publico de propiedades publicadas, con filtros, orden y paginado.
   *
   * @param request query: q, titulo, tipo, operacion, minPrice, maxPrice, barrioZona, ambientes, tags, sortBy, sortOrder, page, limit (todos opcionales)
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }
   */
  async listAll(request: Request, response: Response): Promise<void> {
    /**
     * lee un parametro de texto de la url.
     *
     * @param value valor crudo del parametro
     * @returns el texto sin espacios sobrantes, o undefined si no vino o esta vacio
     */
    const text = (value: unknown): string | undefined =>
      typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

    // los tags llegan separados por coma: ?tags=Pileta,Cochera (nombres o ids)
    const tags = text(request.query.tags)?.split(',').map(t => t.trim()).filter(Boolean);

    const sortOrder = text(request.query.sortOrder)?.toUpperCase();
    const { page, limit } = parsePagination(request.query, 12);

    const filters = {
      // q busca texto libre en titulo y descripcion
      q: text(request.query.q),
      titulo: text(request.query.titulo),
      tipo: text(request.query.tipo),
      operacion: text(request.query.operacion),
      minPrice: parseNumberParam(request.query.minPrice),
      maxPrice: parseNumberParam(request.query.maxPrice),
      barrioZona: text(request.query.barrioZona),
      ambientes: parseNumberParam(request.query.ambientes),
      tags,
      sortBy: text(request.query.sortBy),
      sortOrder: (sortOrder === 'ASC' || sortOrder === 'DESC') ? sortOrder as 'ASC' | 'DESC' : undefined,
      page,
      limit,
    };

    const properties = await propertyService.getAll(filters);
    response.json(properties);
  }

  /**
   * GET /api/tags
   * lista los tags (amenities) disponibles. el front los usa para el filtro del
   * listado y para el formulario de propiedad, que envia los ids elegidos.
   *
   * @param _request peticion http (no se usa)
   * @param response respuesta http
   * @returns 200 con una lista de { id, tag } ordenada por nombre
   */
  async listTags(_request: Request, response: Response): Promise<void> {
    const tags = await propertyService.getTags();
    response.json(tags);
  }

  /**
   * GET /api/properties/:id
   * detalle publico de una propiedad, con fotos, tags e inmobiliaria.
   *
   * @param request params: id de la propiedad
   * @param response respuesta http
   * @returns 200 con la propiedad, o 404 con { error } si no existe, es un borrador o el id no es un numero
   */
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Propiedad no encontrada" });
      return;
    }

    const property = await propertyService.getById(Number(id));

    if (!property) {
      response.status(404).json({ error: "Propiedad no encontrada" });
      return;
    }

    response.json(property);
  }

  /**
   * GET /api/properties/:id/questions
   * consultas publicas de una propiedad, con la respuesta del vendedor si la tienen.
   *
   * @param request params: id de la propiedad. query: page, limit
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }, o 404 con { error } si la propiedad no existe
   */
  async getQuestions(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Propiedad no encontrada" });
      return;
    }

    const { page, limit } = parsePagination(request.query, 10);

    const result = await questionService.getByPropertyId(Number(id), page, limit);

    if (!result) {
      response.status(404).json({ error: "Propiedad no encontrada" });
      return;
    }

    response.json(result);
  }

  /**
   * POST /api/properties/:id/questions
   * crea una consulta sobre una propiedad. no hace falta estar autenticado.
   *
   * @param request params: id de la propiedad. body ya validado: nombreSolicitante, pregunta
   * @param response respuesta http
   * @returns 201 con la consulta creada, o 404 con { error } si la propiedad no existe o es un borrador
   */
  async createQuestion(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Propiedad no encontrada" });
      return;
    }

    // el body ya llega validado por validateSchema(questionSchema) en la ruta
    const question = await questionService.create(Number(id), request.body);

    if (!question) {
      response.status(404).json({ error: "Propiedad no encontrada" });
      return;
    }

    response.status(201).json(question);
  }

  /**
   * POST /api/properties/:id/visits
   * crea una solicitud de visita. no hace falta estar autenticado.
   *
   * @param request params: id de la propiedad. body ya validado: nombreVisitante, telefonoVisitante, fechaPropuesta, y opcionales apellidoVisitante y mensajeAsociado
   * @param response respuesta http
   * @returns 201 con la visita creada, 404 con { error } si la propiedad no existe, o 409 si no esta publicada
   */
  async createVisit(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Propiedad no encontrada" });
      return;
    }

    // el body ya llega validado por validateSchema(visitSchema) en la ruta
    const result = await visitService.create(Number(id), request.body);

    // 404 si la propiedad no existe, 409 si no esta publicada
    if (!result.success) {
      response.status(result.status).json({ error: result.message });
      return;
    }

    response.status(201).json(result.visit);
  }
}

export const propertyController = new PropertyController();

// =================================================================================
// endpoints: gestión privada de propiedades (dashboard vendedor)
// =================================================================================

/**
 * POST /api/vendedor/propiedades
 * crea una propiedad en la inmobiliaria del vendedor. siempre queda en borrador.
 *
 * @param req req.user (vendedor del token) y body ya validado por createPropertySchema
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 201 con { success, message, propiedad }, o 404 con { error } si el vendedor no tiene inmobiliaria
 */
export const createProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });
        
        // el request.body ya debe venir validado por el middleware validateSchema(createPropertySchema)
        const property = await propertyService.createProperty(sellerId, req.body);
        if (!property) return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
        
        return res.status(201).json({ success: true, message: 'Propiedad creada en estado BORRADOR', propiedad: property });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * GET /api/vendedor/propiedades
 * lista las propiedades de la inmobiliaria del vendedor, en cualquier estado.
 *
 * @param req req.user y query: estado, page, limit
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { data, total, page, limit, totalPages }, o 404 con { error } si el vendedor no tiene inmobiliaria
 */
export const getSellerProperties = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const { page, limit } = parsePagination(req.query, 12);
        const estado = typeof req.query.estado === 'string' ? req.query.estado.toUpperCase() : undefined;

        const result = await propertyService.getSellerProperties(sellerId, estado, page, limit);
        if (!result) return res.status(404).json({ error: 'Inmobiliaria no encontrada' });

        return res.status(200).json(result);
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * GET /api/vendedor/propiedades/:id
 * detalle de una propiedad propia, con su historial de estados.
 *
 * @param req req.user y params: id de la propiedad
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con la propiedad (incluye historialEstados), 400 si el id no es un numero, o 404 si no existe o es de otro vendedor
 */
export const getSellerPropertyById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ error: 'ID invalido' });

        const property = await propertyService.getSellerPropertyById(sellerId, propertyId);
        if (!property) return res.status(404).json({ error: 'Propiedad no encontrada' });

        return res.status(200).json(property);
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * PUT /api/vendedor/propiedades/:id
 * edita una propiedad propia. se envian solo los campos que cambian.
 *
 * @param req req.user, params: id de la propiedad, y body ya validado por updatePropertySchema
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message, propiedad }, 404 si no existe, o 409 con { error } si esta cerrada o tiene visitas confirmadas
 */
export const updateProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ error: 'ID invalido' });

        const result = await propertyService.updateProperty(sellerId, propertyId, req.body);
        if (!result.success) {
            return res.status(result.status).json({ error: result.message });
        }

        return res.status(200).json({ success: true, message: 'Propiedad actualizada exitosamente', propiedad: result.property });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * PATCH /api/vendedor/propiedades/:id/estado
 * cambia el estado de una propiedad siguiendo la maquina de estados.
 *
 * @param req req.user, params: id de la propiedad, y body: nuevoEstado
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message, propiedad }, 400 si la transicion no es valida, 404 si no existe, o 409 si choca con una regla de negocio
 */
export const changePropertyStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ error: 'ID invalido' });

        const { nuevoEstado } = req.body;

        const result = await propertyService.changePropertyStatus(sellerId, propertyId, nuevoEstado);
        if (!result.success) {
            return res.status(result.status).json({ error: result.message });
        }

        return res.status(200).json({ success: true, message: `Estado cambiado exitosamente a ${nuevoEstado}`, propiedad: result.property });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * DELETE /api/vendedor/propiedades/:id
 * da de baja una propiedad propia. no se borra: pasa a estado CANCELADA.
 *
 * @param req req.user y params: id de la propiedad
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message }, 404 si no existe, o 409 con { error } si esta vendida, alquilada o tiene visitas confirmadas
 */
export const deleteProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ error: 'ID invalido' });

        const result = await propertyService.deleteProperty(sellerId, propertyId);
        if (!result.success) {
            return res.status(result.status).json({ error: result.message });
        }

        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

// =================================================================================
// endpoints: gestión de fotos de propiedades
// =================================================================================

/**
 * GET /api/vendedor/propiedades/:id/fotos
 * lista las fotos de una propiedad propia, ordenadas por el campo orden.
 *
 * @param req req.user y params: id de la propiedad
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, photos }, o 404 con { error } si la propiedad no existe o es de otro vendedor
 */
export const getPhotos = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ error: 'ID invalido' });

        const photos = await propertyService.getPhotos(sellerId, propertyId);
        if (!photos) return res.status(404).json({ error: 'Propiedad no encontrada' });

        return res.status(200).json({ success: true, photos });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * POST /api/vendedor/propiedades/:id/fotos
 * agrega una foto a la galeria de una propiedad propia.
 *
 * @param req req.user, params: id de la propiedad, y body ya validado: url, orden, esPortada
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 201 con { success, photo }, o 404 con { error } si la propiedad no existe o es de otro vendedor
 */
export const addPhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ error: 'ID invalido' });

        const result = await propertyService.addPhoto(sellerId, propertyId, req.body);
        if (!result.success) return res.status(result.status).json({ error: result.message });

        return res.status(201).json({ success: true, photo: result.photo });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * PATCH /api/vendedor/propiedades/:id/fotos/:photoId
 * cambia el orden de una foto o la marca como portada.
 *
 * @param req req.user, params: id de la propiedad y photoId, y body ya validado: orden, esPortada
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message }, 400 si no se envia ningun campo, 404 si la foto no existe, o 409 si se intenta dejar la galeria sin portada
 */
export const updatePhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        const photoId = toId(req.params.photoId);
        if (isNaN(propertyId) || isNaN(photoId)) return res.status(400).json({ error: 'ID invalido' });

        const result = await propertyService.updatePhoto(sellerId, propertyId, photoId, req.body);
        if (!result.success) return res.status(result.status).json({ error: result.message });

        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * DELETE /api/vendedor/propiedades/:id/fotos/:photoId
 * elimina una foto de la galeria de una propiedad propia.
 *
 * @param req req.user y params: id de la propiedad y photoId
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message }, 404 si la foto no existe, o 409 si es la ultima foto de una propiedad publicada
 */
export const deletePhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const propertyId = toId(req.params.id);
        const photoId = toId(req.params.photoId);
        if (isNaN(propertyId) || isNaN(photoId)) return res.status(400).json({ error: 'ID invalido' });

        const result = await propertyService.deletePhoto(sellerId, propertyId, photoId);
        if (!result.success) return res.status(result.status).json({ error: result.message });

        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};