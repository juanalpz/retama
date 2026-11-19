/**
 * controlador de inmobiliarias.
 * la clase AgencyController atiende el catalogo publico y las reseñas; las funciones
 * exportadas mas abajo atienden el perfil de la inmobiliaria del vendedor.
 */

import type { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { agencyService } from "../services/agency.service";
import * as agencyServicePrivate from '../services/agency.service';
import { parsePagination } from "../utils/pagination.utils";
import { toId } from "../utils/id.utils";

// =================================================================================
// endpoints: catálogo público de inmobiliarias
// =================================================================================

class AgencyController {
  /**
   * GET /api/agencies
   * listado publico de inmobiliarias con su calificacion, con busqueda parcial por nombre de fantasia.
   *
   * @param request query: nombre, page, limit (todos opcionales)
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }
   */
  async listAll(request: Request, response: Response): Promise<void> {
    const nombre = request.query.nombre as string | undefined;
    const { page, limit } = parsePagination(request.query, 10);
    const agencies = await agencyService.getAll(nombre, page, limit);
    response.json(agencies);
  }

  /**
   * GET /api/agencies/:id
   * perfil publico de una inmobiliaria: sus datos, telefonos, correos,
   * calificacion promedio y cantidad de reseñas. no incluye datos del vendedor.
   *
   * @param request params: id de la inmobiliaria
   * @param response respuesta http
   * @returns 200 con la inmobiliaria, o 404 con { error } si no existe o el id no es un numero
   */
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    const agency = await agencyService.getById(Number(id));
    if (!agency) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    response.json(agency);
  }

  /**
   * GET /api/agencies/:id/properties
   * propiedades publicadas de una inmobiliaria.
   *
   * @param request params: id de la inmobiliaria. query: page, limit
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }, o 404 con { error } si la inmobiliaria no existe
   */
  async getProperties(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    const { page, limit } = parsePagination(request.query, 12);
    const properties = await agencyService.getProperties(Number(id), page, limit);
    // null significa que la inmobiliaria no existe
    if (!properties) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    response.json(properties);
  }

  /**
   * POST /api/agencies/:id/reviews
   * crea una reseña sobre una inmobiliaria. no hace falta estar autenticado.
   *
   * @param request params: id de la inmobiliaria. body ya validado: nombreSolicitante, resenia, calificacion
   * @param response respuesta http
   * @returns 201 con la reseña creada, o 404 con { error } si la inmobiliaria no existe
   */
  async createReview(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    // el body ya llega validado por validateSchema(reviewSchema) en la ruta
    const review = await agencyService.createReview(Number(id), request.body);
    if (!review) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    response.status(201).json(review);
  }

  /**
   * GET /api/agencies/:id/reviews
   * reseñas de una inmobiliaria, la mas reciente primero.
   *
   * @param request params: id de la inmobiliaria. query: page, limit
   * @param response respuesta http
   * @returns 200 con { data, total, page, limit, totalPages }, o 404 con { error } si la inmobiliaria no existe
   */
  async getReviews(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    if (isNaN(toId(id))) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    const { page, limit } = parsePagination(request.query, 10);
    const result = await agencyService.getReviews(Number(id), page, limit);
    if (!result) {
      response.status(404).json({ error: "Inmobiliaria no encontrada" });
      return;
    }
    response.json(result);
  }
}

export const agencyController = new AgencyController();

// =================================================================================
// endpoints: gestión privada de inmobiliaria (dashboard vendedor)
// =================================================================================

/**
 * GET /api/vendedor/inmobiliaria
 * devuelve la inmobiliaria del vendedor autenticado, con sus telefonos y correos.
 *
 * @param req req.user (vendedor del token)
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, inmobiliaria }, o 404 con { error } si el vendedor no tiene inmobiliaria
 */
export const getAgencyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });
        const agencyProfile = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
        if (!agencyProfile) return res.status(404).json({ error: 'Inmobiliaria no encontrada para este vendedor' });
        return res.status(200).json({ success: true, inmobiliaria: agencyProfile });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * PUT /api/vendedor/inmobiliaria
 * edita los datos de la inmobiliaria del vendedor. se envian solo los campos que cambian.
 *
 * @param req req.user y body ya validado: nombreFantasia, descripcion, logoUrl, direccionLinea1, direccionLinea2
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message, inmobiliaria }, 404 si no tiene inmobiliaria, o 409 con { error, details } si el nombre ya esta en uso
 */
export const updateAgencyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

        const result = await agencyServicePrivate.updateAgencyProfileBySellerId(sellerId, req.body);
        if (!result.success) {
            // 409 cuando el nombre de fantasia ya lo usa otra inmobiliaria
            const details = result.status === 409 ? { details: [{ field: 'nombreFantasia', message: result.message }] } : {};
            return res.status(result.status).json({ error: result.message, ...details });
        }

        return res.status(200).json({ success: true, message: 'Inmobiliaria actualizada', inmobiliaria: result.inmobiliaria });
    } catch (error) {
        return next(error);
    }
};

/**
 * POST /api/vendedor/inmobiliaria/telefonos
 * agrega un telefono de contacto a la inmobiliaria del vendedor.
 *
 * @param req req.user y body ya validado: telefono, tipoTelefono (opcional)
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 201 con { success, message, telefono }, o 404 con { error } si el vendedor no tiene inmobiliaria
 */
export const addPhone = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        const { telefono, tipoTelefono } = req.body;
        const newPhone = await agencyServicePrivate.addPhoneToAgency(sellerId, telefono, tipoTelefono);
        if (!newPhone) return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
        return res.status(201).json({ success: true, message: 'Teléfono añadido exitosamente', telefono: newPhone });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * DELETE /api/vendedor/inmobiliaria/telefonos/:id
 * elimina un telefono de contacto de la inmobiliaria del vendedor.
 *
 * @param req req.user y params: id del telefono
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message }, o 404 con { error } si el telefono no existe o es de otra inmobiliaria
 */
export const deletePhone = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        const phoneId = toId(req.params.id);
        // un id mal formado se responde igual que un telefono que no existe
        if (isNaN(phoneId)) return res.status(404).json({ error: 'El teléfono no existe o no pertenece a tu inmobiliaria' });
        const success = await agencyServicePrivate.removePhoneFromAgency(sellerId, phoneId);
        if (!success) return res.status(404).json({ error: 'El teléfono no existe o no pertenece a tu inmobiliaria' });
        return res.status(200).json({ success: true, message: 'Teléfono eliminado exitosamente' });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * POST /api/vendedor/inmobiliaria/correos
 * agrega un correo de contacto a la inmobiliaria del vendedor.
 *
 * @param req req.user y body ya validado: correo, tipoCorreo (opcional)
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 201 con { success, message, correo }, o 404 con { error } si el vendedor no tiene inmobiliaria
 */
export const addEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        const { correo, tipoCorreo } = req.body;
        const newEmail = await agencyServicePrivate.addEmailToAgency(sellerId, correo, tipoCorreo);
        if (!newEmail) return res.status(404).json({ error: 'Inmobiliaria no encontrada' });
        return res.status(201).json({ success: true, message: 'Correo añadido exitosamente', correo: newEmail });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * DELETE /api/vendedor/inmobiliaria/correos/:id
 * elimina un correo de contacto de la inmobiliaria del vendedor.
 *
 * @param req req.user y params: id del correo
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message }, o 404 con { error } si el correo no existe o es de otra inmobiliaria
 */
export const deleteEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        const emailId = toId(req.params.id);
        // un id mal formado se responde igual que un correo que no existe
        if (isNaN(emailId)) return res.status(404).json({ error: 'El correo no existe o no pertenece a tu inmobiliaria' });
        const success = await agencyServicePrivate.removeEmailFromAgency(sellerId, emailId);
        if (!success) return res.status(404).json({ error: 'El correo no existe o no pertenece a tu inmobiliaria' });
        return res.status(200).json({ success: true, message: 'Correo eliminado exitosamente' });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};

/**
 * DELETE /api/vendedor/inmobiliaria
 * elimina la inmobiliaria del vendedor junto con sus propiedades, fotos,
 * consultas, visitas y reseñas. no se puede deshacer.
 *
 * @param req req.user (vendedor del token)
 * @param res respuesta http
 * @param next pasa los errores inesperados al manejador central
 * @returns 200 con { success, message }, 404 si no tiene inmobiliaria, o 409 con { error } si tiene propiedades publicadas o reservadas
 */
export const deleteAgencyProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const sellerId = Number(req.user?.id);
        if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });
        const result = await agencyServicePrivate.deleteAgencyBySellerId(sellerId);
        // 409 cuando todavia tiene propiedades publicadas o reservadas
        if (!result.success) return res.status(result.status).json({ error: result.message });
        return res.status(200).json({ success: true, message: 'Inmobiliaria eliminada exitosamente' });
    } catch (error) {
        // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
        return next(error);
    }
};
