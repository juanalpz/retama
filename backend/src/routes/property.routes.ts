import { Router } from "express";
import { propertyController } from "../controllers/property.controller";

export const propertyRouter = Router();

propertyRouter.get("/", propertyController.listAll);
propertyRouter.get("/:id", propertyController.getById);
propertyRouter.get("/:id/questions", propertyController.getQuestions);
propertyRouter.post("/:id/questions", propertyController.createQuestion);
propertyRouter.post("/:id/visits", propertyController.createVisit);

// ==========================================
// 2. ENDPOINTS GESTIÓN DE PROPIEDADES (Grupo B)
// ==========================================
import { createProperty, getSellerProperties, getSellerPropertyById, updateProperty, changePropertyStatus, deleteProperty } from "../controllers/property.controller";
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { createPropertySchema, updatePropertySchema, changePropertyStatusSchema } from '../schemas/property.schema';

const privateRouter = Router();

privateRouter.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getSellerProperties);
privateRouter.get('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getSellerPropertyById);
privateRouter.post('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPropertySchema), createProperty);
privateRouter.put('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updatePropertySchema), updateProperty);
privateRouter.patch('/:id/estado', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(changePropertyStatusSchema), changePropertyStatus);
privateRouter.delete('/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteProperty);

export default privateRouter;