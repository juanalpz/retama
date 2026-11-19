/**
 * rutas de las solicitudes de visita recibidas por el vendedor (/api/vendedor/visitas).
 * todas exigen token.
 */

import { Router } from "express";
import { sellerVisitController } from "../controllers/seller-visit.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateSchema } from "../middlewares/validate.middleware";
import { visitStatusSchema } from "../schemas/visit.schema";

// =================================================================================
// endpoints: gestión de visitas (dashboard vendedor)
// =================================================================================

export const sellerVisitRouter = Router();

// middleware de auth global para todas las rutas de este router
sellerVisitRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/visitas
 * @description lista todas las solicitudes de visita de la inmobiliaria. permite filtro ?estado=PENDIENTE.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerVisitRouter.get("/visitas", sellerVisitController.getVisits);

/**
 * @route GET /api/vendedor/propiedades/:id/visitas
 * @description lista las solicitudes de visita de una propiedad específica de la inmobiliaria.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerVisitRouter.get("/propiedades/:id/visitas", sellerVisitController.getPropertyVisits);

/**
 * @route PUT /api/vendedor/visitas/:id/estado
 * @description permite al vendedor actualizar el estado de una visita (ej. PENDIENTE -> CONFIRMADA).
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerVisitRouter.put("/visitas/:id/estado", validateSchema(visitStatusSchema), sellerVisitController.updateVisitStatus);
