/**
 * @fileoverview Rutas del Feed de Actividad / Notificaciones del vendedor.
 * Permite al vendedor ver su feed de novedades in-app, contar notificaciones
 * sin leer, y marcar notificaciones como leídas (individual o masivamente).
 */

import { Router } from "express";
import { activityController } from "../controllers/activity.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

// =================================================================================
// ENDPOINTS: FEED DE ACTIVIDAD Y NOTIFICACIONES (Dashboard Vendedor)
// =================================================================================

export const activityRouter = Router();

// Middleware de auth global para todas las rutas de este router
activityRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/actividad
 * @description Listar el feed de actividad del vendedor (más reciente primero).
 *              Filtros: ?tipo=COMENTARIO&leido=false&page=1&limit=20
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
activityRouter.get("/", activityController.getFeed);

/**
 * @route GET /api/vendedor/actividad/sin-leer
 * @description Obtener el conteo de notificaciones sin leer.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
activityRouter.get("/sin-leer", activityController.getUnreadCount);

/**
 * @route PATCH /api/vendedor/actividad/leer-todas
 * @description Marcar todas las notificaciones como leídas.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 * @note Esta ruta va ANTES de /:id/leer para evitar conflicto de ruta con "leer-todas" como :id
 */
activityRouter.patch("/leer-todas", activityController.markAllAsRead);

/**
 * @route PATCH /api/vendedor/actividad/:id/leer
 * @description Marcar una notificación individual como leída.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
activityRouter.patch("/:id/leer", activityController.markAsRead);
