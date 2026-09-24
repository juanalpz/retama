/**
 * @fileoverview Rutas de Gestión de Inmobiliarias.
 * Define los endpoints correspondientes a las operaciones sobre el perfil
 * de la inmobiliaria del vendedor (lectura, actualización, eliminación).
 */

import { Router } from 'express';
import { getAgencyProfile, updateAgencyProfile, deleteAgencyProfile, addPhone, deletePhone, addEmail, deleteEmail } from '../controllers/agency.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { updateAgencySchema, createPhoneSchema, createEmailSchema } from '../schemas/agency.schema';

// ==========================================
// 2. ENDPOINTS GESTIÓN DE INMOBILIARIA
// ==========================================

const router = Router();

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.1] Obtiene los datos detallados de la inmobiliaria del vendedor autenticado, 
 * incluyendo teléfonos y correos.
 * 
 * @route GET /api/vendedor/inmobiliaria
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 * 
 * @example
 * GET /api/vendedor/inmobiliaria
 */
router.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getAgencyProfile);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.2] Actualiza los datos principales de la inmobiliaria (nombre, descripción, logo, dirección).
 * 
 * @route PUT /api/vendedor/inmobiliaria
 * @access Privado (Requiere validación de token JWT y rol VENDEDOR o ADMIN)
 * 
 * @example
 * PUT /api/vendedor/inmobiliaria
 */
router.put('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updateAgencySchema), updateAgencyProfile);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.3] Añade un teléfono a la inmobiliaria.
 * 
 * @route POST /api/vendedor/inmobiliaria/telefonos
 * @access Privado
 * 
 * @example
 * POST /api/vendedor/inmobiliaria/telefonos
 */
router.post('/telefonos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPhoneSchema), addPhone);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.4] Elimina un teléfono de la inmobiliaria.
 * 
 * @route DELETE /api/vendedor/inmobiliaria/telefonos/:id
 * @access Privado
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria/telefonos/1
 */
router.delete('/telefonos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deletePhone);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.5] Añade un correo a la inmobiliaria.
 * 
 * @route POST /api/vendedor/inmobiliaria/correos
 * @access Privado
 * 
 * @example
 * POST /api/vendedor/inmobiliaria/correos
 */
router.post('/correos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createEmailSchema), addEmail);

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.6] Elimina un correo de la inmobiliaria.
 * 
 * @route DELETE /api/vendedor/inmobiliaria/correos/:id
 * @access Privado
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria/correos/1
 */
router.delete('/correos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteEmail);

export default router;

/**
 * [Endpoint 2.7] Elimina la inmobiliaria del vendedor autenticado (valida que no haya propiedades activas).
 * 
 * @route DELETE /api/vendedor/inmobiliaria
 * @access Privado
 * 
 * @example
 * DELETE /api/vendedor/inmobiliaria
 */
router.delete('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteAgencyProfile);

// ----------------------------------------------------------------------------------------------------
