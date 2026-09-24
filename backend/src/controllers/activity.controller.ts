/**
 * @fileoverview controlador del feed de actividad / notificaciones del vendedor.
 */

import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { activityService } from "../services/activity.service";

class ActivityController {
  /**
   * 8.1 GET /api/vendedor/actividad
   * Listar el feed de actividad del vendedor (ordenado del más reciente al más antiguo).
   * Devuelve tipo de evento, referencia y si está leído/no leído.
   * Soporta filtros opcionales: ?tipo=COMENTARIO&leido=false&page=1&limit=20
   */
  async getFeed(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const tipo = req.query.tipo as string | undefined;
      const leidoParam = req.query.leido as string | undefined;

      let leido: boolean | undefined;
      if (leidoParam === 'true') leido = true;
      if (leidoParam === 'false') leido = false;

      const result = await activityService.getFeed(sellerId, tipo, leido, page, limit);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }

  /**
   * 8.2 GET /api/vendedor/actividad/sin-leer
   * Obtener el conteo de notificaciones sin leer (para el badge 🔔 en la nav).
   */
  async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

      const count = await activityService.getUnreadCount(sellerId);
      return res.status(200).json({ success: true, sinLeer: count });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }

  /**
   * 8.3 PATCH /api/vendedor/actividad/:id/leer
   * Marcar una notificación como leída.
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

      const activityId = Number(req.params.id);
      if (isNaN(activityId)) return res.status(400).json({ success: false, message: 'ID invalido' });

      const result = await activityService.markAsRead(activityId, sellerId);
      if (!result.success) {
        const status = result.message.includes('no encontrada') ? 404 : 403;
        return res.status(status).json({ success: false, message: result.message });
      }

      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }

  /**
   * 8.4 PATCH /api/vendedor/actividad/leer-todas
   * Marcar todas las notificaciones como leídas.
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const sellerId = Number(req.user?.id);
      if (!sellerId) return res.status(401).json({ success: false, message: 'Token invalido' });

      const result = await activityService.markAllAsRead(sellerId);
      return res.status(200).json({ success: true, message: result.message, marcadas: result.count });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
}

export const activityController = new ActivityController();
