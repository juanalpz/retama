/** 
 * @fileoverview controlador del perfil publico y privado de inmobiliarias.
 */
import type { Request, Response } from "express";
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { agencyService } from "../services/agency.service";
import * as agencyServicePrivate from '../services/agency.service';
import { reviewSchema } from "../schemas/review.schema";

const ID_REGEX = /^\d+$/;

// ==========================================
// 1. CONTROLADOR PÚBLICO
// ==========================================
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

// ==========================================
// 2. CONTROLADOR PRIVADO (Dashboard)
// ==========================================

export const getAgencyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'No se pudo identificar al usuario desde el token' });
        const agencyProfile = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
        if (!agencyProfile) return res.status(404).json({ success: false, message: 'Inmobiliaria no encontrada para este vendedor' });
        return res.status(200).json({ success: true, inmobiliaria: agencyProfile });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const updateAgencyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });
        const updatedProfile = await agencyServicePrivate.updateAgencyProfileBySellerId(sellerId, req.body);
        if (!updatedProfile) return res.status(404).json({ success: false, message: 'No encontrada' });
        return res.status(200).json({ success: true, message: 'Actualizada', inmobiliaria: updatedProfile });
    } catch (error: any) {
        if (error.code === '23505') return res.status(400).json({ success: false, message: 'Nombre en uso' });
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const addPhone = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const { telefono, tipoTelefono } = req.body;
        const newPhone = await agencyServicePrivate.addPhoneToAgency(sellerId, telefono, tipoTelefono);
        if (!newPhone) return res.status(404).json({ success: false, message: 'Inmobiliaria no encontrada' });
        return res.status(201).json({ success: true, message: 'Teléfono añadido exitosamente', telefono: newPhone });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const deletePhone = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const phoneId = Number(req.params.id);
        const success = await agencyServicePrivate.removePhoneFromAgency(sellerId, phoneId);
        if (!success) return res.status(403).json({ success: false, message: 'El teléfono no existe o no pertenece a tu inmobiliaria' });
        return res.status(200).json({ success: true, message: 'Teléfono eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const addEmail = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const { correo, tipoCorreo } = req.body;
        const newEmail = await agencyServicePrivate.addEmailToAgency(sellerId, correo, tipoCorreo);
        if (!newEmail) return res.status(404).json({ success: false, message: 'Inmobiliaria no encontrada' });
        return res.status(201).json({ success: true, message: 'Correo añadido exitosamente', correo: newEmail });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const deleteEmail = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const emailId = Number(req.params.id);
        const success = await agencyServicePrivate.removeEmailFromAgency(sellerId, emailId);
        if (!success) return res.status(403).json({ success: false, message: 'El correo no existe o no pertenece a tu inmobiliaria' });
        return res.status(200).json({ success: true, message: 'Correo eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

export const deleteAgencyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });
        const result = await agencyServicePrivate.deleteAgencyBySellerId(sellerId);
        if (!result.success) return res.status(result.message === 'Inmobiliaria no encontrada' ? 404 : 400).json({ success: false, message: result.message });
        return res.status(200).json({ success: true, message: 'Inmobiliaria eliminada exitosamente' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};
