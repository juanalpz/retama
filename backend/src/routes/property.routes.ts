/**
 * @fileoverview Rutas de Propiedades de la API REST.
 * Define los endpoints para el catálogo público de propiedades y la gestión 
 * privada (ABM) de propiedades, fotos y estado desde el dashboard del vendedor.
 */

import { Router } from "express";
import { propertyController } from "../controllers/property.controller";
import { createProperty, getSellerProperties, getSellerPropertyById, updateProperty, changePropertyStatus, deleteProperty, getPhotos, addPhoto, updatePhoto, deletePhoto } from "../controllers/property.controller";
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { createPropertySchema, updatePropertySchema, changePropertyStatusSchema } from '../schemas/property.schema';
import { photoSchema, photoUpdateSchema } from '../schemas/property-photo.schema';

// =================================================================================
// ENDPOINTS: CATÁLOGO PÚBLICO DE PROPIEDADES
// =================================================================================

export const propertyRouter = Router();

/**
 * @route GET /api/properties
 * @description Lista todas las propiedades (estado PUBLICADA). Filtros disponibles por query params.
 * @access Público
 */
propertyRouter.get("/", propertyController.listAll);

/**
 * @route GET /api/properties/:id
 * @description Obtiene los detalles de una propiedad pública específica por su ID.
 * @access Público
 */
propertyRouter.get("/:id", propertyController.getById);

/**
 * @route GET /api/properties/:id/questions
 * @description Obtiene las preguntas y respuestas públicas asociadas a una propiedad.
 * @access Público
 */
propertyRouter.get("/:id/questions", propertyController.getQuestions);

/**
 * @route POST /api/properties/:id/questions
 * @description Crea una nueva pregunta para el vendedor de la propiedad.
 * @access Público
 */
propertyRouter.post("/:id/questions", propertyController.createQuestion);

/**
 * @route POST /api/properties/:id/visits
 * @description Solicita un turno de visita para una propiedad.
 * @access Público
 */
propertyRouter.post("/:id/visits", propertyController.createVisit);

// =================================================================================
// ENDPOINTS: GESTIÓN PRIVADA DE PROPIEDADES (Dashboard Vendedor)
// =================================================================================

const privateRouter = Router();

/**
 * @route GET /api/vendedor/propiedades
 * @description Lista las propiedades asociadas a la inmobiliaria del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getSellerProperties);

/**
 * @route GET /api/vendedor/propiedades/:id
 * @description Obtiene el detalle de una propiedad de la inmobiliaria del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.get('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getSellerPropertyById);

/**
 * @route POST /api/vendedor/propiedades
 * @description Crea una nueva propiedad (Estado inicial: BORRADOR).
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.post('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPropertySchema), createProperty);

/**
 * @route PUT /api/vendedor/propiedades/:id
 * @description Actualiza los datos de una propiedad del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.put('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updatePropertySchema), updateProperty);

/**
 * @route PATCH /api/vendedor/propiedades/:id/estado
 * @description Cambia el estado de una propiedad siguiendo la máquina de estados.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.patch('/:id/estado', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(changePropertyStatusSchema), changePropertyStatus);

/**
 * @route DELETE /api/vendedor/propiedades/:id
 * @description Da de baja una propiedad (cambia a CANCELADA) del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.delete('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteProperty);

/**
 * @route GET /api/vendedor/propiedades/:id/fotos
 * @description Obtiene las fotos de una propiedad del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.get('/:id/fotos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getPhotos);

/**
 * @route POST /api/vendedor/propiedades/:id/fotos
 * @description Agrega una nueva foto a la propiedad del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.post('/:id/fotos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(photoSchema), addPhoto);

/**
 * @route PATCH /api/vendedor/propiedades/:id/fotos/:photoId
 * @description Edita una foto (orden y esPortada).
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.patch('/:id/fotos/:photoId', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(photoUpdateSchema), updatePhoto);

/**
 * @route DELETE /api/vendedor/propiedades/:id/fotos/:photoId
 * @description Elimina una foto de la propiedad del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.delete('/:id/fotos/:photoId', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deletePhoto);

export default privateRouter;