/** 
 * @fileoverview repositorio de consultas sql para la tabla visitas.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Visit } from "../entities/visit.entity";
import { VisitDTO } from "../schemas/visit.schema";
import { Property } from "../entities/property.entity";
import { PaginatedResult } from "./property.repository";

class VisitRepository {
  private get repository(): Repository<Visit> {
    return AppDataSource.getRepository(Visit);
  }

  /**
   * busca una visita por su id, incluyendo su propiedad y agencia (para validar permisos)
   * 
   * @param {number} id - id de la visita
   * @returns {Promise<Visit | null>} visita encontrada
   */
  findByIdWithRelations(id: number): Promise<Visit | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['property', 'property.agency', 'property.agency.seller']
    });
  }

  /**
   * actualiza el estado de una visita
   * 
   * @param {number} id - id de la visita
   * @param {string} estado - nuevo estado (Confirmada, Cancelada, Realizada, etc)
   * @returns {Promise<void>}
   */
  async updateEstado(id: number, estado: string): Promise<void> {
    await this.repository.update(id, { estado });
  }

  /**
   * busca las visitas de un vendedor (agencia) aplicando filtros
   * 
   * @async
   * @param {number} sellerId - id del vendedor logueado
   * @param {number | undefined} propertyId - id de propiedad opcional
   * @param {string | undefined} estado - filtrar por estado (PENDIENTE, CONFIRMADA, etc)
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Visit>>} visitas paginadas
   */
  async findPaginatedBySeller(sellerId: number, propertyId?: number, estado?: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<Visit>> {
    const qb = this.repository.createQueryBuilder('visit')
      .leftJoinAndSelect('visit.property', 'property')
      .leftJoin('property.agency', 'agency')
      .leftJoin('agency.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId });

    if (propertyId) {
      qb.andWhere('property.id = :propertyId', { propertyId });
    }

    if (estado) {
      qb.andWhere('visit.estado = :estado', { estado });
    }

    const [data, total] = await qb
      .orderBy('visit.fechaCreacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * crea y guarda un nuevo registro de visita propuesta para una propiedad.
   * 
   * @param {VisitDTO & { property: Property }} data - datos de la visita y relacion a la propiedad
   * @returns {Promise<Visit>} la visita recien creada
   * 
   * @example
   * visitrepository.create({ nombrevisitante: 'maria', fechapropuesta: '2026-12-01', property: propEntity })
   */
  create(data: VisitDTO & { property: Property }): Promise<Visit> {
    const visitData = {
      ...data,
      fechaPropuesta: data.fechaPropuesta ? new Date(data.fechaPropuesta) : null,
    };
    const visit = this.repository.create(visitData);
    return this.repository.save(visit);
  }
}

export const visitRepository = new VisitRepository();
