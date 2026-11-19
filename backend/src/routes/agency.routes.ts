/**
 * rutas de inmobiliarias. el archivo exporta dos routers:
 *   - agencyRouter: catalogo publico y reseñas (/api/agencies)
 *   - router (export default): perfil de la inmobiliaria del vendedor (/api/vendedor/inmobiliaria)
 */

import { Router } from "express";
import { agencyController, getAgencyProfile, updateAgencyProfile, deleteAgencyProfile, addPhone, deletePhone, addEmail, deleteEmail } from '../controllers/agency.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { updateAgencySchema, createPhoneSchema, createEmailSchema } from '../schemas/agency.schema';
import { reviewSchema } from '../schemas/review.schema';

// =================================================================================
// endpoints: catálogo público de inmobiliarias
// =================================================================================

// catálogo público de inmobiliarias

export const agencyRouter = Router();

/**
 * @route GET /api/agencies
 * @description lista de todas las agencias/inmobiliarias.
 * @access público
 */
agencyRouter.get("/", agencyController.listAll);

/**
 * @route GET /api/agencies/:id
 * @description obtiene los detalles de una inmobiliaria específica.
 * @access público
 */
agencyRouter.get("/:id", agencyController.getById);

/**
 * @route GET /api/agencies/:id/properties
 * @description obtiene las propiedades de una inmobiliaria específica.
 * @access público
 */
agencyRouter.get("/:id/properties", agencyController.getProperties);

/**
 * @route GET /api/agencies/:id/reviews
 * @description obtiene las reseñas de una inmobiliaria específica.
 * @access público
 */
agencyRouter.get("/:id/reviews", agencyController.getReviews);

/**
 * @route POST /api/agencies/:id/reviews
 * @description crea una reseña para una inmobiliaria específica.
 * @access público
 */
agencyRouter.post("/:id/reviews", validateSchema(reviewSchema), agencyController.createReview);

// gestión privada de inmobiliaria

const router = Router();

/**
 * @route GET /api/vendedor/inmobiliaria
 * @description obtiene el perfil de la inmobiliaria del vendedor autenticado.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getAgencyProfile);

/**
 * @route PUT /api/vendedor/inmobiliaria
 * @description actualiza el perfil de la inmobiliaria del vendedor autenticado.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.put('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updateAgencySchema), updateAgencyProfile);

/**
 * @route POST /api/vendedor/inmobiliaria/telefonos
 * @description agrega un teléfono al perfil de la inmobiliaria.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.post('/telefonos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPhoneSchema), addPhone);

/**
 * @route DELETE /api/vendedor/inmobiliaria/telefonos/:id
 * @description elimina un teléfono del perfil de la inmobiliaria.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.delete('/telefonos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deletePhone);

/**
 * @route POST /api/vendedor/inmobiliaria/correos
 * @description agrega un correo al perfil de la inmobiliaria.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.post('/correos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createEmailSchema), addEmail);

/**
 * @route DELETE /api/vendedor/inmobiliaria/correos/:id
 * @description elimina un correo del perfil de la inmobiliaria.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.delete('/correos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteEmail);

/**
 * @route DELETE /api/vendedor/inmobiliaria
 * @description elimina el perfil completo de la inmobiliaria del vendedor autenticado.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
router.delete('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteAgencyProfile);

export default router;
