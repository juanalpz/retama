/** 
 * @fileoverview repositorio de consultas sql para la tabla comentarios.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Comment } from "../entities/comment.entity";
import { CommentDTO } from "../schemas/comment.schema";
import { Property } from "../entities/property.entity";
import { PaginatedResult } from "./property.repository";

class CommentRepository {
  private get repository(): Repository<Comment> {
    return AppDataSource.getRepository(Comment);
  }

  /**
   * busca un comentario por su id, incluyendo su propiedad y agencia (para validar permisos)
   * 
   * @param {number} id - id del comentario
   * @returns {Promise<Comment | null>} comentario encontrado
   */
  findByIdWithRelations(id: number): Promise<Comment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['property', 'property.agency', 'property.agency.seller']
    });
  }

  /**
   * actualiza la respuesta del vendedor en un comentario
   * 
   * @param {number} id - id del comentario
   * @param {string} respuesta - texto de la respuesta
   * @returns {Promise<void>}
   */
  async updateRespuesta(id: number, respuesta: string): Promise<void> {
    await this.repository.update(id, { respuestaVendedor: respuesta });
  }

  /**
   * busca los comentarios de un vendedor (agencia) aplicando filtros
   * 
   * @async
   * @param {number} sellerId - id del vendedor logueado
   * @param {number | undefined} propertyId - id de propiedad opcional
   * @param {boolean} sinResponder - filtrar solo pendientes
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Comment>>} comentarios paginados
   */
  async findPaginatedBySeller(sellerId: number, propertyId?: number, sinResponder?: boolean, page: number = 1, limit: number = 10): Promise<PaginatedResult<Comment>> {
    const qb = this.repository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.property', 'property')
      .leftJoin('property.agency', 'agency')
      .leftJoin('agency.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId });

    if (propertyId) {
      qb.andWhere('property.id = :propertyId', { propertyId });
    }

    if (sinResponder) {
      qb.andWhere('comment.respuestaVendedor IS NULL');
    }

    const [data, total] = await qb
      .orderBy('comment.fechaCreacion', 'DESC')
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
   * crea y guarda un nuevo comentario o consulta asociado a una propiedad.
   * 
   * @param {CommentDTO & { property: Property }} data - datos del comentario y relacion a la propiedad
   * @returns {Promise<Comment>} el comentario recien creado
   * 
   * @example
   * commentrepository.create({ nombre: 'juan', ..., property: propEntity })
   */
  create(data: CommentDTO & { property: Property }): Promise<Comment> {
    const comment = this.repository.create(data);
    return this.repository.save(comment);
  }

  /**
   * busca todos los comentarios asociados a una propiedad en particular.
   * 
   * @param {number} propertyId - id de la propiedad
   * @returns {Promise<Comment[]>} lista de comentarios encontrados
   * 
   * @example
   * commentrepository.findbypropertyid(5)
   */
  findByPropertyId(propertyId: number): Promise<Comment[]> {
    return this.repository.find({ where: { property: { id: propertyId } } });
  }

  /**
   * busca los comentarios de una propiedad de forma paginada.
   * 
   * @async
   * @param {number} propertyId - id de la propiedad
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Comment>>} comentarios paginados
   * 
   * @example
   * commentrepository.findpaginatedbypropertyid(5, 1, 10)
   */
  async findPaginatedByPropertyId(propertyId: number, page: number = 1, limit: number = 10): Promise<PaginatedResult<Comment>> {
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

export const commentRepository = new CommentRepository();
