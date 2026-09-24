/** 
 * @fileoverview Controlador del Perfil Público y Privado de Inmobiliarias.
 * Gestiona tanto el catálogo público de inmobiliarias (listado, detalle, propiedades,
 * reseñas) como las operaciones privadas del vendedor sobre su propia inmobiliaria
 * (ver perfil, actualizar datos, gestionar teléfonos, correos y dar de baja).
 */

import type { Request, Response } from "express";
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { agencyService } from "../services/agency.service";
import * as agencyServicePrivate from '../services/agency.service';
import { reviewSchema } from "../schemas/review.schema";

const ID_REGEX = /^\d+$/;

// =================================================================================
// ENDPOINTS: CATÁLOGO PÚBLICO DE INMOBILIARIAS
// =================================================================================

class AgencyController {
  /**
   * Lista todas las inmobiliarias registradas con paginación y filtro opcional por nombre.
   * 
   * Permite búsquedas parciales por nombre de fantasía (ej. "costa" encuentra "Costa Mar Propiedades").
   * 
   * @async
   * @param {Request} request - Petición HTTP con query params opcionales ('nombre', 'page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON paginado de inmobiliarias.
   * 
   * @example
   * GET /api/agencies?nombre=mar&page=1&limit=10
   */
  async listAll(request: Request, response: Response): Promise<void> {
    const nombre = request.query.nombre as string | undefined;
    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 10;
    const agencies = await agencyService.getAll(nombre, page, limit);
    response.json(agencies);
  }

  /**
   * Obtiene el perfil completo de una inmobiliaria por su ID, incluyendo datos de contacto.
   * 
   * Carga las relaciones de teléfonos y correos electrónicos asociados a la inmobiliaria.
   * 
   * @async
   * @param {Request} request - Petición HTTP con el parámetro 'id' de la inmobiliaria.
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con el JSON de la inmobiliaria o HTTP 404 si no existe.
   * 
   * @example
   * GET /api/agencies/1
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
   * Obtiene el catálogo paginado de propiedades publicadas de una inmobiliaria.
   * 
   * Solo devuelve propiedades en estado 'PUBLICADA' para el catálogo público.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' en params y query params de paginación ('page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON de propiedades paginadas o HTTP 404.
   * 
   * @example
   * GET /api/agencies/1/properties?page=1&limit=12
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
   * Crea una nueva reseña (calificación de 1 a 5 estrellas) para una inmobiliaria.
   * 
   * Valida el body con el schema Zod de reseñas antes de persistirla.
   * Genera una notificación automática al vendedor dueño de la inmobiliaria.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' en params y body validado
   *   ('nombreSolicitante', 'emailSolicitante', 'calificacion', 'comentario').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 201 Created con la reseña o HTTP 400/404 en caso de error.
   * 
   * @example
   * POST /api/agencies/1/reviews
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
   * Obtiene las reseñas de una inmobiliaria de forma paginada.
   * 
   * Útil para renderizar la sección de opiniones en el perfil público.
   * 
   * @async
   * @param {Request} request - Petición HTTP con 'id' en params y query params ('page', 'limit').
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con JSON de reseñas paginadas o HTTP 404.
   * 
   * @example
   * GET /api/agencies/1/reviews?page=1&limit=5
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

// =================================================================================
// ENDPOINTS: GESTIÓN PRIVADA DE INMOBILIARIA (Dashboard Vendedor)
// =================================================================================

/**
 * Obtiene el perfil completo de la inmobiliaria del vendedor autenticado.
 * 
 * Busca la inmobiliaria vinculada al usuario logueado a través de su sellerId
 * extraído del token JWT. Incluye teléfonos, correos y datos de contacto.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP extendida con los datos del usuario del token.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 con la inmobiliaria o HTTP 401/404/500 en caso de error.
 * 
 * @example
 * GET /api/vendedor/inmobiliaria
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Actualiza los datos del perfil de la inmobiliaria del vendedor autenticado.
 * 
 * Permite editar nombre de fantasía, descripción, dirección y otros datos.
 * Si el nombre de fantasía ya está en uso por otra inmobiliaria, retorna error 400 por unicidad (constraint 23505).
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con body validado por Zod ('nombreFantasia', 'descripcion', etc.).
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 con la inmobiliaria actualizada o HTTP 400/404/500.
 * 
 * @example
 * PUT /api/vendedor/inmobiliaria
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Agrega un nuevo teléfono de contacto a la inmobiliaria del vendedor autenticado.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con body validado ('telefono', 'tipoTelefono').
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 201 con el teléfono creado o HTTP 404/500.
 * 
 * @example
 * POST /api/vendedor/inmobiliaria/telefonos
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Elimina un teléfono de contacto de la inmobiliaria del vendedor autenticado.
 * 
 * Verifica que el teléfono exista y pertenezca a la inmobiliaria del vendedor antes de eliminarlo.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' del teléfono en params.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 confirmando eliminación o HTTP 403/500.
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria/telefonos/5
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Agrega un nuevo correo electrónico de contacto a la inmobiliaria del vendedor autenticado.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con body validado ('correo', 'tipoCorreo').
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 201 con el correo creado o HTTP 404/500.
 * 
 * @example
 * POST /api/vendedor/inmobiliaria/correos
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Elimina un correo electrónico de contacto de la inmobiliaria del vendedor autenticado.
 * 
 * Verifica que el correo exista y pertenezca a la inmobiliaria del vendedor antes de eliminarlo.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con 'id' del correo en params.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 confirmando eliminación o HTTP 403/500.
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria/correos/3
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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

/**
 * Da de baja la inmobiliaria del vendedor autenticado y toda su información asociada.
 * 
 * Elimina de forma definitiva el perfil de la inmobiliaria, incluyendo sus propiedades,
 * fotos, teléfonos y correos de contacto. Esta operación es irreversible.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP extendida con los datos del usuario del token.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 confirmando la eliminación o HTTP 400/404/500.
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
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
