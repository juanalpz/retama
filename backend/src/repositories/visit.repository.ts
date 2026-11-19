/**
 * acceso a datos de las solicitudes de visita.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Visit } from "../entities/visit.entity";
import { VisitDTO } from "../schemas/visit.schema";
import { Property } from "../entities/property.entity";
import { PaginatedResult } from "./property.repository";

class VisitRepository {
  /**
   * @returns el repositorio de typeorm de visitas. se pide en cada uso porque la conexion todavia no existe cuando se importa el archivo
   */
  private get repository(): Repository<Visit> {
    return AppDataSource.getRepository(Visit);
  }

  /**
   * busca una visita con su propiedad y su inmobiliaria.
   * del vendedor solo trae el id, que alcanza para verificar a quien pertenece.
   *
   * @param id id de la visita
   * @returns la visita con property, property.agency y seller { id }, o null si no existe
   */
  findByIdWithRelations(id: number): Promise<Visit | null> {
    // se trae la propiedad y su inmobiliaria; del vendedor solo el id,
    // que alcanza para verificar que el recurso le pertenece.
    return this.repository.createQueryBuilder('visit')
      .leftJoinAndSelect('visit.property', 'property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoin('agency.seller', 'seller')
      .addSelect(['seller.id'])
      .where('visit.id = :id', { id })
      .getOne();
  }

  /**
   * guarda el nuevo estado de una visita.
   *
   * @param id id de la visita
   * @param estado estado a guardar
   * @returns nada
   */
  async updateEstado(id: number, estado: string): Promise<void> {
    await this.repository.update(id, { estado });
  }

  /**
   * visitas de las propiedades de un vendedor, cada una con su propiedad.
   *
   * @param sellerId id del vendedor
   * @param propertyId id de una propiedad para filtrar (opcional)
   * @param estado estado por el que filtrar (opcional)
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 10)
   * @returns un resultado paginado de visitas, la mas reciente primero
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
   * guarda una visita nueva. convierte la fecha propuesta de texto a fecha.
   *
   * @param data datos del interesado, fecha propuesta y la propiedad a visitar
   * @returns la visita guardada, en estado PENDIENTE
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
