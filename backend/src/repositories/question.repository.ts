/**
 * acceso a datos de las consultas sobre propiedades.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { PropertyQuestion } from "../entities/property-question.entity";
import { QuestionDTO } from "../schemas/question.schema";
import { Property } from "../entities/property.entity";
import { PaginatedResult } from "./property.repository";

class QuestionRepository {
  /**
   * @returns el repositorio de typeorm de consultas. se pide en cada uso porque la conexion todavia no existe cuando se importa el archivo
   */
  private get repository(): Repository<PropertyQuestion> {
    return AppDataSource.getRepository(PropertyQuestion);
  }

  /**
   * busca una consulta con su propiedad y su inmobiliaria.
   * del vendedor solo trae el id, que alcanza para verificar a quien pertenece.
   *
   * @param id id de la consulta
   * @returns la consulta con property, property.agency y seller { id }, o null si no existe
   */
  findByIdWithRelations(id: number): Promise<PropertyQuestion | null> {
    // se trae la propiedad y su inmobiliaria; del vendedor solo el id,
    // que alcanza para verificar que el recurso le pertenece.
    return this.repository.createQueryBuilder('question')
      .leftJoinAndSelect('question.property', 'property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoin('agency.seller', 'seller')
      .addSelect(['seller.id'])
      .where('question.id = :id', { id })
      .getOne();
  }

  /**
   * guarda la respuesta del vendedor en una consulta.
   *
   * @param id id de la consulta
   * @param respuesta texto de la respuesta
   * @returns nada
   */
  async updateRespuesta(id: number, respuesta: string): Promise<void> {
    await this.repository.update(id, { respuestaVendedor: respuesta });
  }

  /**
   * consultas de las propiedades de un vendedor, cada una con su propiedad.
   *
   * @param sellerId id del vendedor
   * @param propertyId id de una propiedad para filtrar (opcional)
   * @param sinResponder true para traer solo las que no tienen respuesta (opcional)
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 10)
   * @returns un resultado paginado de consultas, la mas reciente primero
   */
  async findPaginatedBySeller(sellerId: number, propertyId?: number, sinResponder?: boolean, page: number = 1, limit: number = 10): Promise<PaginatedResult<PropertyQuestion>> {
    const qb = this.repository.createQueryBuilder('question')
      .leftJoinAndSelect('question.property', 'property')
      .leftJoin('property.agency', 'agency')
      .leftJoin('agency.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId });

    if (propertyId) {
      qb.andWhere('property.id = :propertyId', { propertyId });
    }

    if (sinResponder) {
      qb.andWhere('question.respuestaVendedor IS NULL');
    }

    const [data, total] = await qb
      .orderBy('question.fechaCreacion', 'DESC')
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
   * guarda una consulta nueva.
   *
   * @param data nombre de quien pregunta, pregunta y la propiedad a la que pertenece
   * @returns la consulta guardada, con su id y su fecha
   */
  create(data: QuestionDTO & { property: Property }): Promise<PropertyQuestion> {
    const question = this.repository.create(data);
    return this.repository.save(question);
  }

  /**
   * consultas de una propiedad, para su detalle publico.
   *
   * @param propertyId id de la propiedad
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 10)
   * @returns un resultado paginado de consultas, la mas reciente primero
   */
  async findPaginatedByPropertyId(propertyId: number, page: number = 1, limit: number = 10): Promise<PaginatedResult<PropertyQuestion>> {
    const [data, total] = await this.repository.findAndCount({
      where: { property: { id: propertyId } },
      order: { fechaCreacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const questionRepository = new QuestionRepository();
