/**
 * controlador del feed de actividad del vendedor.
 */

import { NextFunction, Response } from "express";
import { parsePagination } from "../utils/pagination.utils";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { activityService } from "../services/activity.service";
import { toId } from "../utils/id.utils";

// =================================================================================
// endpoints: feed de actividad y notificaciones (dashboard vendedor)
// =================================================================================

class ActivityController {
  /**
   * GET /api/vendedor/actividad
   * lista la actividad del vendedor, la mas reciente primero.
   *
   * @param req req.user y query: tipo, leido (true o false), page, limit
   * @param res respuesta http
   * @param next pasa los errores inesperados al manejador central
   * @returns 200 con { success, data, total, page, limit, totalPages }
   */
  async getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

      const { page, limit } = parsePagination(req.query, 20);
      const tipo = req.query.tipo as string | undefined;
      const leidoParam = req.query.leido as string | undefined;

      let leido: boolean | undefined;
      if (leidoParam === 'true') leido = true;
      if (leidoParam === 'false') leido = false;

      const result = await activityService.getFeed(sellerId, tipo, leido, page, limit);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
      return next(error);
    }
  }

  /**
   * GET /api/vendedor/actividad/sin-leer
   * cuenta la actividad sin leer. el front lo usa para el contador de la navegacion.
   *
   * @param req req.user (vendedor del token)
   * @param res respuesta http
   * @param next pasa los errores inesperados al manejador central
   * @returns 200 con { success, sinLeer }
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

      const count = await activityService.getUnreadCount(sellerId);
      return res.status(200).json({ success: true, sinLeer: count });
    } catch (error) {
      // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
      return next(error);
    }
  }

  /**
   * PATCH /api/vendedor/actividad/:id/leer
   * marca una actividad como leida.
   *
   * @param req req.user y params: id de la actividad
   * @param res respuesta http
   * @param next pasa los errores inesperados al manejador central
   * @returns 200 con { success, message }, 400 si el id no es un numero, 403 si es de otro vendedor, o 404 si no existe
   */
  async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

      const activityId = toId(req.params.id);
      if (isNaN(activityId)) return res.status(400).json({ error: 'ID invalido' });

      const result = await activityService.markAsRead(activityId, sellerId);
      if (!result.success) {
        return res.status(result.status).json({ error: result.message });
      }

      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
      return next(error);
    }
  }

  /**
   * PATCH /api/vendedor/actividad/leer-todas
   * marca como leida toda la actividad pendiente del vendedor.
   *
   * @param req req.user (vendedor del token)
   * @param res respuesta http
   * @param next pasa los errores inesperados al manejador central
   * @returns 200 con { success, message, marcadas }
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ error: 'No se pudo identificar al usuario desde el token' });

      const result = await activityService.markAllAsRead(sellerId);
      return res.status(200).json({ success: true, message: result.message, marcadas: result.count });
    } catch (error) {
      // un error inesperado lo resuelve el manejador central (responde 500 sin detalles)
      return next(error);
    }
  }
}

export const activityController = new ActivityController();
