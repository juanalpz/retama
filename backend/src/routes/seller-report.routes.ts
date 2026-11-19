/**
 * rutas del dashboard de reportes del vendedor (/api/vendedor/reportes).
 * hay una ruta por indicador, para que el front pueda cargarlos por separado,
 * y una que devuelve los tres juntos. todas exigen token.
 */

import { Router } from "express";
import { sellerReportController } from "../controllers/seller-report.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

// =================================================================================
// endpoints: reportes y analíticas (dashboard vendedor)
// =================================================================================

export const sellerReportRouter = Router();

// middleware de auth global para todas las rutas de este router
sellerReportRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/reportes
 * @description obtiene los tres indicadores del vendedor en una sola respuesta.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerReportRouter.get("/reportes", sellerReportController.getDashboardReport);

/**
 * @route GET /api/vendedor/reportes/por-estado
 * @description cantidad de propiedades por estado actual.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerReportRouter.get("/reportes/por-estado", sellerReportController.getStatusSummary);

/**
 * @route GET /api/vendedor/reportes/mensual
 * @description publicaciones nuevas y ventas/alquileres concretados por mes.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerReportRouter.get("/reportes/mensual", sellerReportController.getMonthlyEvolution);

/**
 * @route GET /api/vendedor/reportes/tiempo-en-mercado
 * @description tiempo promedio en mercado, en días.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerReportRouter.get("/reportes/tiempo-en-mercado", sellerReportController.getAverageTimeOnMarket);
