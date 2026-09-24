import { Router } from "express";
import { agencyController } from "../controllers/agency.controller";

import { getAgencyProfile, updateAgencyProfile, deleteAgencyProfile, addPhone, deletePhone, addEmail, deleteEmail } from '../controllers/agency.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validate.middleware';
import { updateAgencySchema, createPhoneSchema, createEmailSchema } from '../schemas/agency.schema';

// ==========================================
// 1. ENDPOINTS PÚBLICOS (Catálogo / Grupo A)
// ==========================================
export const agencyRouter = Router();

agencyRouter.get("/", agencyController.listAll);
agencyRouter.get("/:id", agencyController.getById);
agencyRouter.get("/:id/properties", agencyController.getProperties);
agencyRouter.get("/:id/reviews", agencyController.getReviews);
agencyRouter.post("/:id/reviews", agencyController.createReview);


// ==========================================
// 2. ENDPOINTS GESTIÓN DE INMOBILIARIA (Grupo B)
// ==========================================
const router = Router();

router.get('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), getAgencyProfile);
router.put('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(updateAgencySchema), updateAgencyProfile);
router.post('/telefonos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createPhoneSchema), addPhone);
router.delete('/telefonos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deletePhone);
router.post('/correos', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), validateSchema(createEmailSchema), addEmail);
router.delete('/correos/:id', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteEmail);
router.delete('/', authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'), deleteAgencyProfile);

export default router;
