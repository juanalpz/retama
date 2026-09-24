/**
 * @fileoverview Rutas de Visitas del Dashboard del Vendedor.
 * Permite al vendedor gestionar y cambiar el estado de las solicitudes de visita.
 */

import { Router } from "express";
import { sellerVisitController } from "../controllers/seller-visit.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

export const sellerVisitRouter = Router();

// Middleware de auth global para todas las rutas de este router
sellerVisitRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/visitas
 * @description Lista todas las solicitudes de visita de la inmobiliaria. Permite filtro ?estado=PENDIENTE.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerVisitRouter.get("/visitas", sellerVisitController.getVisits);

/**
 * @route GET /api/vendedor/propiedades/:id/visitas
 * @description Lista las solicitudes de visita de una propiedad específica de la inmobiliaria.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerVisitRouter.get("/propiedades/:id/visitas", sellerVisitController.getPropertyVisits);

/**
 * @route PUT /api/vendedor/visitas/:id/estado
 * @description Permite al vendedor actualizar el estado de una visita (ej. CONFIRMADA, RECHAZADA, etc).
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerVisitRouter.put("/visitas/:id/estado", sellerVisitController.updateVisitStatus);
