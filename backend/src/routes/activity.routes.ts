/**
 * rutas del feed de actividad del vendedor (/api/vendedor/actividad).
 * todas exigen token.
 */

import { Router } from "express";
import { activityController } from "../controllers/activity.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

// =================================================================================
// endpoints: feed de actividad y notificaciones (dashboard vendedor)
// =================================================================================

export const activityRouter = Router();

// middleware de auth global para todas las rutas de este router
activityRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/actividad
 * @description listar el feed de actividad del vendedor (más reciente primero).
 *              filtros: ?tipo=COMENTARIO&leido=false&page=1&limit=20
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
activityRouter.get("/", activityController.getFeed);

/**
 * @route GET /api/vendedor/actividad/sin-leer
 * @description obtener el conteo de notificaciones sin leer.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
activityRouter.get("/sin-leer", activityController.getUnreadCount);

/**
 * @route PATCH /api/vendedor/actividad/leer-todas
 * @description marcar todas las notificaciones como leídas.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 * @note esta ruta va ANTES de /:id/leer para evitar conflicto de ruta con "leer-todas" como :id
 */
activityRouter.patch("/leer-todas", activityController.markAllAsRead);

/**
 * @route PATCH /api/vendedor/actividad/:id/leer
 * @description marcar una notificación individual como leída.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
activityRouter.patch("/:id/leer", activityController.markAsRead);
