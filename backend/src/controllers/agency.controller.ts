/** 
 * @fileoverview Controlador de Gestión de Inmobiliarias.
 * Proporciona los endpoints para consultar, modificar y gestionar la información
 * del perfil de la inmobiliaria asociada al vendedor autenticado.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import * as agencyService from '../services/agency.service';

// ==========================================
// 2. ENDPOINTS GESTIÓN DE INMOBILIARIA
// ==========================================

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.1] Obtiene el perfil detallado de la inmobiliaria del vendedor autenticado,
 * incluyendo su información de contacto (teléfonos y correos electrónicos).
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP de Express, extendida con los datos del usuario decodificados del token.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con el perfil de la inmobiliaria, o HTTP 401/404/500 en caso de error.
 * 
 * @example
 * GET /api/vendedor/inmobiliaria
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const getAgencyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        const agencyProfile = await agencyService.getAgencyProfileBySellerId(sellerId);

        if (!agencyProfile) {
            return res.status(404).json({
                success: false,
                message: 'Inmobiliaria no encontrada para este vendedor'
            });
        }

        return res.status(200).json({
            success: true,
            inmobiliaria: agencyProfile
        });
    } catch (error) {
        console.error('Error en getAgencyProfile controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al obtener el perfil de la inmobiliaria'
        });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.2] Actualiza el perfil principal de la inmobiliaria del vendedor autenticado.
 * Solo permite modificar los datos básicos de la inmobiliaria.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP de Express, extendida con los datos del usuario.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con el perfil actualizado, o HTTP 400/401/404/500 en caso de error.
 * 
 * @example
 * PUT /api/vendedor/inmobiliaria
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 * Body: { "nombreFantasia": "Nueva Inmobiliaria" }
 */
export const updateAgencyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        const updatedProfile = await agencyService.updateAgencyProfileBySellerId(sellerId, req.body);

        if (!updatedProfile) {
            return res.status(404).json({
                success: false,
                message: 'Inmobiliaria no encontrada para este vendedor'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Inmobiliaria actualizada correctamente',
            inmobiliaria: updatedProfile
        });
    } catch (error: any) {
        console.error('Error en updateAgencyProfile controller:', error);
        
        // Manejo de errores de base de datos (ej. nombreFantasia duplicado en PostgreSQL)
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'El nombre de fantasía ya está en uso por otra inmobiliaria'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error interno al actualizar el perfil de la inmobiliaria'
        });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.3] Añade un nuevo número de teléfono a la inmobiliaria del vendedor autenticado.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el cuerpo (telefono, tipoTelefono).
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 201 Created con el teléfono, o HTTP 400/401/404/500 en error.
 * 
 * @example
 * POST /api/vendedor/inmobiliaria/telefonos
 * Body: { "telefono": "2254123456", "tipoTelefono": "WhatsApp" }
 */
export const addPhone = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const { telefono, tipoTelefono } = req.body;

        const newPhone = await agencyService.addPhoneToAgency(sellerId, telefono, tipoTelefono);

        if (!newPhone) {
            return res.status(404).json({ success: false, message: 'Inmobiliaria no encontrada' });
        }

        return res.status(201).json({ success: true, message: 'Teléfono añadido exitosamente', telefono: newPhone });
    } catch (error) {
        console.error('Error en addPhone controller:', error);
        return res.status(500).json({ success: false, message: 'Error interno al añadir el teléfono' });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.4] Elimina un teléfono específico de la inmobiliaria, validando que le pertenezca.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el ID del teléfono en los parámetros de ruta.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK si se eliminó, o HTTP 401/403/404/500 en error.
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria/telefonos/5
 */
export const deletePhone = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const phoneId = Number(req.params.id);

        const success = await agencyService.removePhoneFromAgency(sellerId, phoneId);

        if (!success) {
            return res.status(403).json({ success: false, message: 'El teléfono no existe o no pertenece a tu inmobiliaria' });
        }

        return res.status(200).json({ success: true, message: 'Teléfono eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deletePhone controller:', error);
        return res.status(500).json({ success: false, message: 'Error interno al eliminar el teléfono' });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.5] Añade un nuevo correo electrónico a la inmobiliaria del vendedor autenticado.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el cuerpo (correo, tipoCorreo).
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 201 Created con el correo, o HTTP 400/401/404/500 en error.
 * 
 * @example
 * POST /api/vendedor/inmobiliaria/correos
 * Body: { "correo": "ventas@retama.com", "tipoCorreo": "Ventas" }
 */
export const addEmail = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const { correo, tipoCorreo } = req.body;

        const newEmail = await agencyService.addEmailToAgency(sellerId, correo, tipoCorreo);

        if (!newEmail) {
            return res.status(404).json({ success: false, message: 'Inmobiliaria no encontrada' });
        }

        return res.status(201).json({ success: true, message: 'Correo añadido exitosamente', correo: newEmail });
    } catch (error) {
        console.error('Error en addEmail controller:', error);
        return res.status(500).json({ success: false, message: 'Error interno al añadir el correo' });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.6] Elimina un correo electrónico específico de la inmobiliaria, validando que le pertenezca.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP con el ID del correo en los parámetros de ruta.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK si se eliminó, o HTTP 401/403/404/500 en error.
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria/correos/3
 */
export const deleteEmail = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);
        const emailId = Number(req.params.id);

        const success = await agencyService.removeEmailFromAgency(sellerId, emailId);

        if (!success) {
            return res.status(403).json({ success: false, message: 'El correo no existe o no pertenece a tu inmobiliaria' });
        }

        return res.status(200).json({ success: true, message: 'Correo eliminado exitosamente' });
    } catch (error) {
        console.error('Error en deleteEmail controller:', error);
        return res.status(500).json({ success: false, message: 'Error interno al eliminar el correo' });
    }
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.7] Elimina la inmobiliaria del vendedor autenticado.
 * Regla de negocio: La inmobiliaria NO se puede eliminar si tiene propiedades 'Publicada' o 'Reservada'.
 * Si se aprueba la eliminación, se borrarán en cascada sus teléfonos, correos y propiedades restantes.
 * 
 * @async
 * @param {AuthenticatedRequest} req - Petición HTTP de Express, extendida con los datos del usuario.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK si se eliminó, o HTTP 401/404/500 en error.
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria
 * Headers: { "Authorization": "Bearer <TOKEN>" }
 */
export const deleteAgencyProfile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
        const sellerId = Number(req.user?.id);

        if (!sellerId) {
            return res.status(401).json({
                success: false,
                message: 'No se pudo identificar al usuario desde el token'
            });
        }

        const result = await agencyService.deleteAgencyBySellerId(sellerId);

        if (!result.success) {
            // Diferenciar entre Not Found y Regla de Negocio
            const isNotFound = result.message === 'Inmobiliaria no encontrada';
            return res.status(isNotFound ? 404 : 400).json({
                success: false,
                message: result.message || 'No se pudo eliminar la inmobiliaria'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Inmobiliaria eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteAgencyProfile controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al eliminar la inmobiliaria'
        });
    }
};