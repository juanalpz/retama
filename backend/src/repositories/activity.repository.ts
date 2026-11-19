/**
 * acceso a datos del feed de actividad del vendedor.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Activity } from "../entities/activity.entity";
import { Seller } from "../entities/seller.entity";
import { PaginatedResult } from "./property.repository";

// =================================================================================
// endpoints: feed de actividad y notificaciones (dashboard vendedor)
// =================================================================================

class ActivityRepository {
  /**
   * @returns el repositorio de typeorm de actividades. se pide en cada uso porque la conexion todavia no existe cuando se importa el archivo
   */
  private get repository(): Repository<Activity> {
    return AppDataSource.getRepository(Activity);
  }

  /**
   * guarda un evento nuevo en el feed. siempre arranca sin leer.
   *
   * @param data vendedor (o su id), tipo, referenciaId, referenciaTipo y mensaje (opcional)
   * @returns la actividad guardada, con su id y su fecha
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
   * feed de actividad de un vendedor.
   *
   * @param sellerId id del vendedor
   * @param tipo tipo de evento por el que filtrar (opcional)
   * @param leido true o false para filtrar por leidas o no leidas (opcional)
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 20)
   * @returns un resultado paginado de actividades, la mas reciente primero
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
   * cuenta la actividad sin leer de un vendedor.
   *
   * @param sellerId id del vendedor
   * @returns la cantidad de actividades sin leer
   */
  async countUnreadBySellerId(sellerId: number): Promise<number> {
    return this.repository.count({
      where: { seller: { id: sellerId }, leido: false }
    });
  }

  /**
   * busca una actividad con su vendedor, para verificar a quien pertenece.
   *
   * @param activityId id de la actividad
   * @returns la actividad con su vendedor, o null si no existe
   */
  async findById(activityId: number): Promise<Activity | null> {
    return this.repository.findOne({
      where: { id: activityId },
      relations: ['seller']
    });
  }

  /**
   * marca una actividad como leida.
   *
   * @param activityId id de la actividad
   * @returns nada
   */
  async markAsRead(activityId: number): Promise<void> {
    await this.repository.update(activityId, { leido: true });
  }

  /**
   * marca como leida toda la actividad pendiente de un vendedor.
   *
   * @param sellerId id del vendedor
   * @returns la cantidad de actividades que se marcaron
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
