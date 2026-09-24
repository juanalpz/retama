/**
 * @fileoverview Rutas de Reportes del Dashboard del Vendedor.
 * Proporciona información agregada analítica para el vendedor.
 */

import { Router } from "express";
import { sellerReportController } from "../controllers/seller-report.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

export const sellerReportRouter = Router();

// Middleware de auth global para todas las rutas de este router
sellerReportRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/reportes
 * @description Obtiene métricas agregadas del vendedor (por estado, histórico, y tiempo en mercado)
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerReportRouter.get("/reportes", sellerReportController.getDashboardReport);
