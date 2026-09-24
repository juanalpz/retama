/**
 * @fileoverview Controlador de ABM y Ciclo de Vida de Propiedades.
 * Proporciona los endpoints para crear, listar, consultar en detalle, editar,
 * cambiar el estado y eliminar propiedades de la inmobiliaria del vendedor autenticado.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as propertyService from '../services/property.service';

// ==========================================
// 3. ABM Y CICLO DE VIDA DE PROPIEDADES
// ==========================================

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.1] Crea una nueva propiedad asociada a la inmobiliaria del vendedor autenticado.
 * La propiedad se crea en estado BORRADOR. El vendedor deberá publicarla en un paso posterior.
 *
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el cuerpo validado por Zod (createPropertySchema).
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 201 Created con la propiedad, o HTTP 401/404/500 en caso de error.
 *
 * @example
 * POST /api/vendedor/propiedades
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 * Body: { "titulo": "Depto 2 amb", "operacion": "ALQUILER", "precio": 400, "moneda": "USD", ... }
 */
export const createProperty = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        const result = await propertyService.createProperty(sellerId, req.body);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Inmobiliaria no encontrada para este vendedor'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Propiedad creada exitosamente en estado BORRADOR',
            propiedad: result
        });
    } catch (error) {
        console.error('Error en createProperty controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al crear la propiedad'
        });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.2] Obtiene el listado de todas las propiedades de la inmobiliaria del vendedor autenticado.
 * Cada propiedad incluye sus fotos y tags asociados.
 *
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP de Express, extendida con los datos del usuario.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con el listado, o HTTP 401/404/500 en caso de error.
 *
 * @example
 * GET /api/vendedor/propiedades
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const getProperties = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        const properties = await propertyService.getPropertiesBySellerId(sellerId);

        if (properties === null) {
            return res.status(404).json({
                success: false,
                message: 'Inmobiliaria no encontrada para este vendedor'
            });
        }

        return res.status(200).json({
            success: true,
            total: properties.length,
            propiedades: properties
        });
    } catch (error) {
        console.error('Error en getProperties controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al obtener las propiedades'
        });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.3] Obtiene el detalle completo de una propiedad específica del vendedor.
 * Incluye fotos, tags e historial de cambios de estado.
 *
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el ID de la propiedad en los parámetros de ruta.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con el detalle, o HTTP 401/403/404/500 en caso de error.
 *
 * @example
 * GET /api/vendedor/propiedades/5
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const getPropertyDetail = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const propertyId = Number(req.params.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        if (isNaN(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la propiedad debe ser un número válido'
            });
        }

        const result = await propertyService.getPropertyDetail(sellerId, propertyId);

        if (!result.found) {
            return res.status(404).json({
                success: false,
                message: 'Propiedad no encontrada'
            });
        }

        if (!result.owned) {
            return res.status(403).json({
                success: false,
                message: 'La propiedad no pertenece a tu inmobiliaria'
            });
        }

        return res.status(200).json({
            success: true,
            propiedad: result.property
        });
    } catch (error) {
        console.error('Error en getPropertyDetail controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al obtener el detalle de la propiedad'
        });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.4] Edita los datos de una propiedad existente del vendedor autenticado.
 * Reglas de negocio:
 * - No se puede editar en estados terminales (VENDIDA, ALQUILADA, CANCELADA).
 * - No se puede editar si tiene visitas confirmadas pendientes.
 *
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el ID en la ruta y los datos en el cuerpo.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con la propiedad actualizada, o error.
 *
 * @example
 * PUT /api/vendedor/propiedades/5
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 * Body: { "precio": 500, "moneda": "USD" }
 */
export const updateProperty = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const propertyId = Number(req.params.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        if (isNaN(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la propiedad debe ser un número válido'
            });
        }

        const result = await propertyService.updateProperty(sellerId, propertyId, req.body);

        if (!result.success) {
            // Diferenciar entre Not Found y Reglas de Negocio
            const isNotFound = result.message?.includes('no encontrada');
            const isForbidden = result.message?.includes('no pertenece');
            const statusCode = isNotFound ? 404 : isForbidden ? 403 : 400;
            return res.status(statusCode).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Propiedad actualizada exitosamente',
            propiedad: result.property
        });
    } catch (error) {
        console.error('Error en updateProperty controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al actualizar la propiedad'
        });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.5] Cambia el estado de una propiedad siguiendo la máquina de estados del dominio.
 * Las transiciones se validan del lado del servidor conforme a la consigna.
 * Cada cambio queda registrado en el historial para los reportes.
 *
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el ID en la ruta y { nuevoEstado } en el cuerpo.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con la propiedad actualizada, o error.
 *
 * @example
 * PATCH /api/vendedor/propiedades/5/estado
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 * Body: { "nuevoEstado": "PUBLICADA" }
 */
export const changePropertyStatus = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const propertyId = Number(req.params.id);
        const { nuevoEstado } = req.body;

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        if (isNaN(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la propiedad debe ser un número válido'
            });
        }

        const result = await propertyService.changePropertyStatus(sellerId, propertyId, nuevoEstado);

        if (!result.success) {
            const isNotFound = result.message?.includes('no encontrada');
            const isForbidden = result.message?.includes('no pertenece');
            const statusCode = isNotFound ? 404 : isForbidden ? 403 : 400;
            return res.status(statusCode).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            message: `Estado cambiado a ${nuevoEstado} exitosamente`,
            propiedad: result.property
        });
    } catch (error) {
        console.error('Error en changePropertyStatus controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al cambiar el estado de la propiedad'
        });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.6] Elimina una propiedad del vendedor autenticado.
 * Reglas de negocio:
 * - La propiedad debe pertenecer a la inmobiliaria del vendedor.
 * - No se puede eliminar si tiene visitas confirmadas pendientes.
 *
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el ID de la propiedad en los parámetros de ruta.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK si se eliminó, o error.
 *
 * @example
 * DELETE /api/vendedor/propiedades/5
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const deleteProperty = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const propertyId = Number(req.params.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        if (isNaN(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la propiedad debe ser un número válido'
            });
        }

        const result = await propertyService.deleteProperty(sellerId, propertyId);

        if (!result.success) {
            const isNotFound = result.message?.includes('no encontrada');
            const isForbidden = result.message?.includes('no pertenece');
            const statusCode = isNotFound ? 404 : isForbidden ? 403 : 400;
            return res.status(statusCode).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Propiedad eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteProperty controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al eliminar la propiedad'
        });
    }
};