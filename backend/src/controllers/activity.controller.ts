/**
 * @fileoverview Controlador del Feed de Actividad y Notificaciones (Dashboard Vendedor).
 * Permite al vendedor visualizar eventos recientes y notificaciones in-app
 * (nuevas consultas, solicitudes de visitas, nuevas reseñas o cambios de estado)
 * y gestionar el estado de lectura (badge/campanita).
 */

import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { activityService } from "../services/activity.service";

// =================================================================================
// ENDPOINTS: FEED DE ACTIVIDAD Y NOTIFICACIONES (Dashboard Vendedor)
// =================================================================================

class ActivityController {
  /**
   * Lista el feed de actividad del vendedor, ordenado del más reciente al más antiguo.
   * 
   * Devuelve las notificaciones generadas en el sistema para el usuario autenticado.
   * Permite filtrar por tipo de evento ('COMENTARIO', 'SOLICITUD_VISITA', 'CAMBIO_ESTADO',
   * 'RESENIA') y por estado de lectura, con paginación integrada.
   * 
   * @async
   * @param {AuthenticatedRequest} req - Petición HTTP con query params opcionales
   *   ('tipo', 'leido', 'page', 'limit').
   * @param {Response} res - Respuesta HTTP de Express.
   * @returns {Promise<Response>} Respuesta HTTP 200 con el feed de actividad paginado o HTTP 401/500.
   * 
   * @example
   * GET /api/vendedor/actividad?tipo=COMENTARIO&leido=false&page=1&limit=20
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
   * Obtiene el conteo total de notificaciones no leídas para el vendedor autenticado.
   * 
   * Diseñado específicamente para actualizar dinámicamente el badge numérico
   * de la "campanita" de notificaciones en la interfaz de usuario (barra de navegación).
   * 
   * @async
   * @param {AuthenticatedRequest} req - Petición HTTP extendida con los datos del usuario del token.
   * @param {Response} res - Respuesta HTTP de Express.
   * @returns {Promise<Response>} Respuesta HTTP 200 con el número de notificaciones no leídas o HTTP 401/500.
   * 
   * @example
   * GET /api/vendedor/actividad/sin-leer
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
   * Marca una notificación individual como leída.
   * 
   * Verifica que la notificación exista y pertenezca al vendedor que realiza la petición
   * antes de modificar su estado.
   * 
   * @async
   * @param {AuthenticatedRequest} req - Petición HTTP con 'id' de la actividad en params.
   * @param {Response} res - Respuesta HTTP de Express.
   * @returns {Promise<Response>} Respuesta HTTP 200 de éxito o HTTP 400/401/403/404/500.
   * 
   * @example
   * PATCH /api/vendedor/actividad/45/leer
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
   * Marca absolutamente todas las notificaciones pendientes del vendedor como leídas en una sola acción.
   * 
   * Útil para implementar la función de "Marcar todo como leído" en la interfaz.
   * 
   * @async
   * @param {AuthenticatedRequest} req - Petición HTTP extendida con los datos del usuario del token.
   * @param {Response} res - Respuesta HTTP de Express.
   * @returns {Promise<Response>} Respuesta HTTP 200 con la cantidad de notificaciones que fueron marcadas, o HTTP 401/500.
   * 
   * @example
   * PATCH /api/vendedor/actividad/leer-todas
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
