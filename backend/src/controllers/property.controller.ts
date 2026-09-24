/** 
 * @fileoverview Controlador de Propiedades: Catálogo Público y Gestión Privada.
 * Maneja el listado filtrado, detalle de propiedades, creación de consultas y visitas
 * para el catálogo público, y el ABM completo de propiedades, cambios de estado,
 * y gestión de fotos para el dashboard privado del vendedor.
 */

import type { Request, Response } from "express";
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { propertyService } from "../services/property.service";
import { questionService } from "../services/question.service";
import { visitService } from "../services/visit.service";
import { questionSchema } from "../schemas/question.schema";
import { visitSchema } from "../schemas/visit.schema";

const ID_REGEX = /^\d+$/;

// =================================================================================
// ENDPOINTS: CATÁLOGO PÚBLICO DE PROPIEDADES
// =================================================================================

class PropertyController {
  /**
   * Lista todas las propiedades publicadas con filtros opcionales y paginación.
   * 
   * Soporta filtros por título, tipo de propiedad, operación, rango de precios,
   * barrio/zona, cantidad de ambientes, tags, y ordenamiento personalizado.
   * Solo devuelve propiedades en estado 'PUBLICADA'.
   * 
   * @async
   * @param {Request} request - Petición HTTP con query params opcionales
   *   ('titulo', 'tipo', 'operacion', 'minPrice', 'maxPrice', 'barrioZona', 'ambientes',
   *    'tags', 'sortBy', 'sortOrder', 'page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON de resultados paginados.
   * 
   * @example
   * GET /api/properties?operacion=VENTA&minPrice=50000&page=1&limit=10
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
   * Obtiene el detalle completo de una propiedad por su ID.
   * 
   * Incluye fotos, tags, datos de la inmobiliaria y toda la información pública.
   * 
   * @async
   * @param {Request} request - Petición HTTP con el parámetro 'id' de la propiedad.
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON de la propiedad o HTTP 404 si no existe.
   * 
   * @example
   * GET /api/properties/5
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
   * Obtiene las preguntas públicas de una propiedad de forma paginada.
   * 
   * Devuelve las consultas realizadas por usuarios interesados junto con
   * las respuestas del vendedor (si las tiene).
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' en params y query params ('page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON de preguntas paginadas o HTTP 404.
   * 
   * @example
   * GET /api/properties/5/questions?page=1&limit=5
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

    if (!result) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.json(result);
  }

  /**
   * Crea una nueva pregunta/consulta sobre una propiedad específica.
   * 
   * Permite a un usuario interesado enviar una consulta al vendedor.
   * Valida el body con el schema Zod de preguntas y genera una notificación
   * automática al vendedor dueño de la propiedad.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' en params y body validado
   *   ('nombreSolicitante', 'emailSolicitante', 'mensaje').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 201 con la pregunta creada o HTTP 400/404.
   * 
   * @example
   * POST /api/properties/5/questions
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
   * Solicita un turno de visita para una propiedad específica.
   * 
   * Permite a un usuario interesado agendar una visita con el vendedor.
   * Valida el body con el schema Zod de visitas (fecha futura obligatoria)
   * y genera una notificación automática al vendedor dueño de la propiedad.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' en params y body validado
   *   ('nombreVisitante', 'apellidoVisitante', 'telefonoVisitante', 'fechaPropuesta', 'mensajeAsociado').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 201 con el turno creado o HTTP 400/404.
   * 
   * @example
   * POST /api/properties/5/visits
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

// =================================================================================
// ENDPOINTS: GESTIÓN PRIVADA DE PROPIEDADES (Dashboard Vendedor)
// =================================================================================

/**
 * Crea una nueva propiedad asociada a la inmobiliaria del vendedor autenticado.
 * 
 * La propiedad se crea siempre en estado 'BORRADOR'. El body ya viene validado
 * por el middleware validateSchema(createPropertySchema).
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con body validado por Zod
 *   ('titulo', 'descripcion', 'tipoPropiedad', 'operacion', 'precio', 'moneda', etc.).
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 201 con la propiedad creada o HTTP 401/404/500.
 * 
 * @example
 * POST /api/vendedor/propiedades
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Lista las propiedades de la inmobiliaria del vendedor autenticado con paginación.
 * 
 * Permite filtrar por estado ('BORRADOR', 'PUBLICADA', 'RESERVADA', etc.)
 * para gestionar el pipeline de propiedades desde el dashboard.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con query params ('estado', 'page', 'limit').
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 con listado paginado o HTTP 401/404/500.
 * 
 * @example
 * GET /api/vendedor/propiedades?estado=PUBLICADA&page=1&limit=12
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Obtiene el detalle completo de una propiedad propia del vendedor autenticado.
 * 
 * Incluye fotos, tags, estado actual e historial. Solo devuelve la propiedad si
 * pertenece a la inmobiliaria del vendedor logueado.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' de la propiedad en params.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 con la propiedad o HTTP 400/401/404/500.
 * 
 * @example
 * GET /api/vendedor/propiedades/5
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Edita los datos de una propiedad del vendedor autenticado.
 * 
 * Permite actualizar título, descripción, precio y demás campos.
 * No se puede editar si la propiedad está en VENDIDA, ALQUILADA o CANCELADA,
 * ni tampoco si tiene visitas CONFIRMADA pendientes.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' en params y body validado por Zod.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 con la propiedad actualizada o HTTP 400/401/404/500.
 * 
 * @example
 * PUT /api/vendedor/propiedades/5
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Cambia el estado de una propiedad siguiendo la máquina de estados del sistema.
 * 
 * Valida que la transición solicitada sea válida según las reglas:
 * BORRADOR → PUBLICADA, PUBLICADA → RESERVADA/PAUSADA/CANCELADA, etc.
 * Registra el cambio en propiedades_cambios_logs y genera una notificación.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' en params y body ({ nuevoEstado }).
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 con el estado actualizado o HTTP 400/401/404/500.
 * 
 * @example
 * PATCH /api/vendedor/propiedades/5/estado
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Da de baja una propiedad del vendedor autenticado (la pasa a estado CANCELADA).
 * 
 * Equivale a un soft-delete: la propiedad deja de estar visible pero no se borra físicamente.
 * No se puede dar de baja si tiene visitas CONFIRMADA pendientes.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' de la propiedad en params.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 confirmando la baja o HTTP 400/401/404/500.
 * 
 * @example
 * DELETE /api/vendedor/propiedades/5
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

// =================================================================================
// ENDPOINTS: GESTIÓN DE FOTOS DE PROPIEDADES
// =================================================================================

/**
 * Lista todas las fotos de una propiedad del vendedor autenticado, ordenadas por el campo 'orden'.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' de la propiedad en params.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 con el array de fotos o HTTP 400/401/404/500.
 * 
 * @example
 * GET /api/vendedor/propiedades/5/fotos
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const getPhotos = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const photos = await propertyService.getPhotos(sellerId, propertyId);
        if (!photos) return res.status(404).json({ success: false, message: 'Propiedad no encontrada' });

        return res.status(200).json({ success: true, photos });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

/**
 * Sube/agrega una nueva foto a una propiedad del vendedor autenticado.
 * 
 * Recibe { url, orden, esPortada }. Si esPortada es true, desmarca la portada anterior
 * para garantizar que siempre haya una sola portada.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' en params y body validado ('url', 'orden', 'esPortada').
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 201 con la foto creada o HTTP 400/401/500.
 * 
 * @example
 * POST /api/vendedor/propiedades/5/fotos
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const addPhoto = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        if (isNaN(propertyId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const result = await propertyService.addPhoto(sellerId, propertyId, req.body);
        if (!result.success) return res.status(400).json({ success: false, message: result.message });

        return res.status(201).json({ success: true, photo: result.photo });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

/**
 * Edita una foto existente de una propiedad (cambia su orden o la marca como portada).
 * 
 * Si esPortada se establece en true, desmarca automáticamente la portada anterior.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' y 'photoId' en params y body validado.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 confirmando la edición o HTTP 400/401/500.
 * 
 * @example
 * PATCH /api/vendedor/propiedades/5/fotos/3
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const updatePhoto = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        const photoId = Number(req.params.photoId);
        if (isNaN(propertyId) || isNaN(photoId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const result = await propertyService.updatePhoto(sellerId, propertyId, photoId, req.body);
        if (!result.success) return res.status(400).json({ success: false, message: result.message });

        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

/**
 * Elimina una foto de una propiedad del vendedor autenticado.
 * 
 * No se puede eliminar la última foto si la propiedad está en estado 'PUBLICADA',
 * ya que las propiedades publicadas requieren al menos una foto.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' y 'photoId' en params.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response | void>} Respuesta HTTP 200 confirmando la eliminación o HTTP 400/401/500.
 * 
 * @example
 * DELETE /api/vendedor/propiedades/5/fotos/3
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const deletePhoto = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

        const propertyId = Number(req.params.id);
        const photoId = Number(req.params.photoId);
        if (isNaN(propertyId) || isNaN(photoId)) return res.status(400).json({ success: false, message: 'ID invalido' });

        const result = await propertyService.deletePhoto(sellerId, propertyId, photoId);
        if (!result.success) return res.status(400).json({ success: false, message: result.message });

        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};