/**
 * @fileoverview repositorio de consultas para la tabla actividades.
 * maneja el feed de notificaciones in-app del vendedor.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Activity } from "../entities/activity.entity";
import { Seller } from "../entities/seller.entity";

// =================================================================================
// ENDPOINTS: FEED DE ACTIVIDAD Y NOTIFICACIONES (Dashboard Vendedor)
// =================================================================================


export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ActivityRepository {
  private get repository(): Repository<Activity> {
    return AppDataSource.getRepository(Activity);
  }

  /**
   * crea una nueva notificación de actividad.
   */
  async create(data: {
    seller: Seller | { id: number };
    tipo: string;
    referenciaId: number;
    referenciaTipo: string;
    mensaje?: string;
  }): Promise<Activity> {
    const activity = this.repository.create({
      seller: data.seller as Seller,
      tipo: data.tipo,
      referenciaId: data.referenciaId,
      referenciaTipo: data.referenciaTipo,
      mensaje: data.mensaje || null,
      leido: false
    });
    return this.repository.save(activity);
  }

  /**
   * obtiene el feed paginado de un vendedor, ordenado del más reciente al más antiguo.
   * permite filtrar por tipo de actividad y/o estado de lectura.
   */
  async findPaginatedBySellerId(
    sellerId: number,
    tipo?: string,
    leido?: boolean,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Activity>> {
    const qb = this.repository.createQueryBuilder("a")
      .where("a.vendedor_id = :sellerId", { sellerId });

    if (tipo) {
      qb.andWhere("a.tipo = :tipo", { tipo });
    }

    if (leido !== undefined) {
      qb.andWhere("a.leido = :leido", { leido });
    }

    qb.orderBy("a.fecha_creacion", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * obtiene el conteo de notificaciones sin leer de un vendedor.
   */
  async countUnreadBySellerId(sellerId: number): Promise<number> {
    return this.repository.count({
      where: { seller: { id: sellerId }, leido: false }
    });
  }

  /**
   * busca una actividad por id.
   */
  async findById(activityId: number): Promise<Activity | null> {
    return this.repository.findOne({
      where: { id: activityId },
      relations: ['seller']
    });
  }

  /**
   * marca una notificación como leída.
   */
  async markAsRead(activityId: number): Promise<void> {
    await this.repository.update(activityId, { leido: true });
  }

  /**
   * marca todas las notificaciones de un vendedor como leídas.
   */
  async markAllAsRead(sellerId: number): Promise<number> {
    const result = await this.repository.update(
      { seller: { id: sellerId }, leido: false },
      { leido: true }
    );
    return result.affected || 0;
  }
}

export const activityRepository = new ActivityRepository();
