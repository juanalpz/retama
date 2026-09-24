/**
 * @fileoverview servicio de actividad/notificaciones in-app.
 * gestiona el feed del vendedor y expone un método estático `notify`
 * para generar notificaciones desde cualquier punto del backend.
 */

import { activityRepository } from "../repositories/activity.repository";
import { Activity } from "../entities/activity.entity";

// =================================================================================
// ENDPOINTS: FEED DE ACTIVIDAD Y NOTIFICACIONES (Dashboard Vendedor)
// =================================================================================

class ActivityService {
  /**
   * genera una notificación de actividad para un vendedor.
   * se invoca internamente desde otros servicios cuando ocurre un evento relevante.
   *
   * @param sellerId - id del vendedor destinatario
   * @param tipo - tipo de actividad (COMENTARIO, SOLICITUD_VISITA, RESENIA, CAMBIO_ESTADO)
   * @param referenciaId - id del recurso referenciado (propiedad, visita, reseña, etc.)
   * @param referenciaTipo - tipo del recurso referenciado ('propiedad', 'visita', 'resenia', 'pregunta')
   * @param mensaje - mensaje descriptivo de la notificación
   */
  async notify(
    sellerId: number,
    tipo: string,
    referenciaId: number,
    referenciaTipo: string,
    mensaje: string
  ): Promise<Activity> {
    return activityRepository.create({
      seller: { id: sellerId },
      tipo,
      referenciaId,
      referenciaTipo,
      mensaje
    });
  }

  /**
   * obtiene el feed paginado de actividad del vendedor.
   * soporta filtro por tipo y por estado de lectura.
   */
  async getFeed(sellerId: number, tipo?: string, leido?: boolean, page: number = 1, limit: number = 20) {
    return activityRepository.findPaginatedBySellerId(sellerId, tipo, leido, page, limit);
  }

  /**
   * obtiene el conteo de notificaciones sin leer (para el badge).
   */
  async getUnreadCount(sellerId: number): Promise<number> {
    return activityRepository.countUnreadBySellerId(sellerId);
  }

  /**
   * marca una notificación individual como leída.
   * verifica que pertenezca al vendedor antes de marcarla.
   */
  async markAsRead(activityId: number, sellerId: number): Promise<{ success: boolean; message: string }> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      return { success: false, message: 'Notificación no encontrada' };
    }
    if (activity.seller.id !== sellerId) {
      return { success: false, message: 'No tenés permiso para modificar esta notificación' };
    }
    if (activity.leido) {
      return { success: true, message: 'La notificación ya estaba marcada como leída' };
    }
    await activityRepository.markAsRead(activityId);
    return { success: true, message: 'Notificación marcada como leída' };
  }

  /**
   * marca TODAS las notificaciones del vendedor como leídas.
   */
  async markAllAsRead(sellerId: number): Promise<{ success: boolean; message: string; count: number }> {
    const count = await activityRepository.markAllAsRead(sellerId);
    return { success: true, message: `${count} notificaciones marcadas como leídas`, count };
  }
}

export const activityService = new ActivityService();
