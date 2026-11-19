/**
 * feed de actividad del vendedor.
 * el resto de los servicios llama a notify cada vez que pasa algo que el
 * vendedor tiene que saber.
 */

import { activityRepository } from "../repositories/activity.repository";
import { Activity } from "../entities/activity.entity";
import { ServiceResult, fail } from "../utils/result.utils";

// =================================================================================
// endpoints: feed de actividad y notificaciones (dashboard vendedor)
// =================================================================================

class ActivityService {
  /**
   * registra un evento en el feed de un vendedor. lo llaman los otros servicios
   * al crear una consulta, una visita o una reseña, y al cambiar el estado de una propiedad.
   *
   * @param sellerId id del vendedor al que se le avisa
   * @param tipo tipo de evento: COMENTARIO, SOLICITUD_VISITA, RESENIA o CAMBIO_ESTADO
   * @param referenciaId id del registro que origino el evento
   * @param referenciaTipo que es ese registro: pregunta, visita, resenia o propiedad
   * @param mensaje texto que se muestra en el feed
   * @returns la actividad creada, sin leer
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
   * feed de actividad de un vendedor, la mas reciente primero.
   *
   * @param sellerId id del vendedor autenticado
   * @param tipo tipo de evento por el que filtrar (opcional)
   * @param leido true o false para filtrar por leidas o no leidas (opcional)
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado { data, total, page, limit, totalPages }
   */
  async getFeed(sellerId: number, tipo?: string, leido?: boolean, page: number = 1, limit: number = 20) {
    return activityRepository.findPaginatedBySellerId(sellerId, tipo, leido, page, limit);
  }

  /**
   * cuenta la actividad sin leer de un vendedor.
   *
   * @param sellerId id del vendedor autenticado
   * @returns la cantidad de actividades sin leer
   */
  async getUnreadCount(sellerId: number): Promise<number> {
    return activityRepository.countUnreadBySellerId(sellerId);
  }

  /**
   * marca una actividad como leida, verificando que sea del vendedor.
   *
   * @param activityId id de la actividad
   * @param sellerId id del vendedor autenticado
   * @returns { success: true, message }, o un error 404 si no existe o 403 si es de otro vendedor
   */
  async markAsRead(activityId: number, sellerId: number): Promise<ServiceResult> {
    const activity = await activityRepository.findById(activityId);
    if (!activity) {
      return fail(404, 'Notificación no encontrada');
    }
    if (activity.seller.id !== sellerId) {
      return fail(403, 'No tenés permiso para modificar esta notificación');
    }
    if (activity.leido) {
      return { success: true, message: 'La notificación ya estaba marcada como leída' };
    }
    await activityRepository.markAsRead(activityId);
    return { success: true, message: 'Notificación marcada como leída' };
  }

  /**
   * marca como leida toda la actividad pendiente de un vendedor.
   *
   * @param sellerId id del vendedor autenticado
   * @returns { success: true, message, count }, donde count es la cantidad que se marco
   */
  async markAllAsRead(sellerId: number): Promise<{ success: boolean; message: string; count: number }> {
    const count = await activityRepository.markAllAsRead(sellerId);
    return { success: true, message: `${count} notificaciones marcadas como leídas`, count };
  }
}

export const activityService = new ActivityService();
