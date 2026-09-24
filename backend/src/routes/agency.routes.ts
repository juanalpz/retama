/**
 * @fileoverview Rutas de Inmobiliarias de la API REST.
 * Define los endpoints para el catálogo público de inmobiliarias y la
 * gestión del perfil de la inmobiliaria desde el dashboard del vendedor.
 */

import { Router } from "express";
import { agencyController, getAgencyProfile, updateAgencyProfile, deleteAgencyProfile, addPhone, deletePhone, addEmail, deleteEmail } from '../controllers/agency.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { updateAgencySchema, createPhoneSchema, createEmailSchema } from '../schemas/agency.schema';

// =================================================================================
// ENDPOINTS: CATÁLOGO PÚBLICO DE INMOBILIARIAS
// =================================================================================

// Catálogo público de inmobiliarias

export const agencyRouter = Router();

/**
 * @route GET /api/agencies
 * @description Lista de todas las agencias/inmobiliarias.
 * @access Público
 */
agencyRouter.get("/", agencyController.listAll);

/**
 * @route GET /api/agencies/:id
 * @description Obtiene los detalles de una inmobiliaria específica.
 * @access Público
 */
agencyRouter.get("/:id", agencyController.getById);

/**
 * @route GET /api/agencies/:id/properties
 * @description Obtiene las propiedades de una inmobiliaria específica.
 * @access Público
 */
agencyRouter.get("/:id/properties", agencyController.getProperties);

/**
 * @route GET /api/agencies/:id/reviews
 * @description Obtiene las reseñas de una inmobiliaria específica.
 * @access Público
 */
agencyRouter.get("/:id/reviews", agencyController.getReviews);

/**
 * @route POST /api/agencies/:id/reviews
 * @description Crea una reseña para una inmobiliaria específica.
 * @access Público
 */
agencyRouter.post("/:id/reviews", agencyController.createReview);

// Gestión privada de inmobiliaria

const router = Router();

/**
 * @route GET /api/vendedor/inmobiliaria
 * @description Obtiene el perfil de la inmobiliaria del vendedor autenticado.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getAgencyProfile);

/**
 * @route PUT /api/vendedor/inmobiliaria
 * @description Actualiza el perfil de la inmobiliaria del vendedor autenticado.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.put('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updateAgencySchema), updateAgencyProfile);

/**
 * @route POST /api/vendedor/inmobiliaria/telefonos
 * @description Agrega un teléfono al perfil de la inmobiliaria.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.post('/telefonos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPhoneSchema), addPhone);

/**
 * @route DELETE /api/vendedor/inmobiliaria/telefonos/:id
 * @description Elimina un teléfono del perfil de la inmobiliaria.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.delete('/telefonos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deletePhone);

/**
 * @route POST /api/vendedor/inmobiliaria/correos
 * @description Agrega un correo al perfil de la inmobiliaria.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.post('/correos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createEmailSchema), addEmail);

/**
 * @route DELETE /api/vendedor/inmobiliaria/correos/:id
 * @description Elimina un correo del perfil de la inmobiliaria.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.delete('/correos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteEmail);

/**
 * @route DELETE /api/vendedor/inmobiliaria
 * @description Elimina el perfil completo de la inmobiliaria del vendedor autenticado.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.delete('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteAgencyProfile);

export default router;
