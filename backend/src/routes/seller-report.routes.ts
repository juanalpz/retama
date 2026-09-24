/**
 * @fileoverview Rutas de Reportes del Dashboard del Vendedor.
 * Proporciona endpoints para métricas y análisis estadístico del rendimiento
 * de la inmobiliaria en la plataforma.
 */

import { Router } from "express";
import { sellerReportController } from "../controllers/seller-report.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

// =================================================================================
// ENDPOINTS: REPORTES Y ANALÍTICAS (Dashboard Vendedor)
// =================================================================================

export const sellerReportRouter = Router();

// Middleware de auth global para todas las rutas de este router
sellerReportRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/reportes
 * @description Obtiene el reporte general con métricas agregadas del vendedor.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerReportRouter.get("/reportes", sellerReportController.getDashboardReport);
