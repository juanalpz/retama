/**
 * rutas de propiedades. el archivo exporta tres routers:
 *   - propertyRouter: catalogo publico (/api/properties)
 *   - tagRouter: listado de amenities (/api/tags)
 *   - privateRouter (export default): abm, estado y fotos del vendedor (/api/vendedor/propiedades)
 */

import { Router } from "express";
import { propertyController } from "../controllers/property.controller";
import { createProperty, getSellerProperties, getSellerPropertyById, updateProperty, changePropertyStatus, deleteProperty, getPhotos, addPhoto, updatePhoto, deletePhoto } from "../controllers/property.controller";
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { createPropertySchema, updatePropertySchema, changePropertyStatusSchema } from '../schemas/property.schema';
import { photoSchema, photoUpdateSchema } from '../schemas/property-photo.schema';
import { questionSchema } from '../schemas/question.schema';
import { visitSchema } from '../schemas/visit.schema';

// =================================================================================
// endpoints: catálogo público de propiedades
// =================================================================================

export const propertyRouter = Router();

/**
 * @route GET /api/properties
 * @description lista todas las propiedades (estado PUBLICADA). filtros disponibles por query params.
 * @access público
 */
propertyRouter.get("/", propertyController.listAll);

/**
 * @route GET /api/properties/:id
 * @description obtiene los detalles de una propiedad pública específica por su ID.
 * @access público
 */
propertyRouter.get("/:id", propertyController.getById);

/**
 * @route GET /api/properties/:id/questions
 * @description obtiene las preguntas y respuestas públicas asociadas a una propiedad.
 * @access público
 */
propertyRouter.get("/:id/questions", propertyController.getQuestions);

/**
 * @route POST /api/properties/:id/questions
 * @description crea una nueva pregunta para el vendedor de la propiedad.
 * @access público
 */
propertyRouter.post("/:id/questions", validateSchema(questionSchema), propertyController.createQuestion);

/**
 * @route POST /api/properties/:id/visits
 * @description solicita un turno de visita para una propiedad.
 * @access público
 */
propertyRouter.post("/:id/visits", validateSchema(visitSchema), propertyController.createVisit);

// =================================================================================
// endpoints: tags (AMENITIES)
// =================================================================================

export const tagRouter = Router();

/**
 * @route GET /api/tags
 * @description lista los tags (amenities) disponibles para filtrar y para cargar una propiedad.
 * @access público
 */
tagRouter.get("/", propertyController.listTags);

// =================================================================================
// endpoints: gestión privada de propiedades (dashboard vendedor)
// =================================================================================

const privateRouter = Router();

/**
 * @route GET /api/vendedor/propiedades
 * @description lista las propiedades asociadas a la inmobiliaria del vendedor.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getSellerProperties);

/**
 * @route GET /api/vendedor/propiedades/:id
 * @description obtiene el detalle de una propiedad de la inmobiliaria del vendedor.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.get('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getSellerPropertyById);

/**
 * @route POST /api/vendedor/propiedades
 * @description crea una nueva propiedad (estado inicial: BORRADOR).
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.post('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPropertySchema), createProperty);

/**
 * @route PUT /api/vendedor/propiedades/:id
 * @description actualiza los datos de una propiedad del vendedor.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.put('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updatePropertySchema), updateProperty);

/**
 * @route PATCH /api/vendedor/propiedades/:id/estado
 * @description cambia el estado de una propiedad siguiendo la máquina de estados.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.patch('/:id/estado', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(changePropertyStatusSchema), changePropertyStatus);

/**
 * @route DELETE /api/vendedor/propiedades/:id
 * @description da de baja una propiedad (cambia a CANCELADA) del vendedor.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.delete('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteProperty);

/**
 * @route GET /api/vendedor/propiedades/:id/fotos
 * @description obtiene las fotos de una propiedad del vendedor.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.get('/:id/fotos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getPhotos);

/**
 * @route POST /api/vendedor/propiedades/:id/fotos
 * @description agrega una nueva foto a la propiedad del vendedor.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.post('/:id/fotos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(photoSchema), addPhoto);

/**
 * @route PATCH /api/vendedor/propiedades/:id/fotos/:photoId
 * @description edita una foto (orden y esPortada).
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.patch('/:id/fotos/:photoId', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(photoUpdateSchema), updatePhoto);

/**
 * @route DELETE /api/vendedor/propiedades/:id/fotos/:photoId
 * @description elimina una foto de la propiedad del vendedor.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
privateRouter.delete('/:id/fotos/:photoId', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deletePhoto);

export default privateRouter;