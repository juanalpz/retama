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
