/** 
 * @fileoverview servicio para la logica de negocio de comentarios y consultas.
 */

import { commentRepository } from "../repositories/comment.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { Comment } from "../entities/comment.entity";
import { CommentDTO } from "../schemas/comment.schema";

class CommentService {
  /**
   * crea un comentario validando primero la existencia de la propiedad.
   * 
   * @async
   * @param {number} propertyId - id de la propiedad consultada
   * @param {CommentDTO} data - datos del comentario validado
   * @returns {Promise<Comment | null>} comentario creado o null si la propiedad no existe
   * 
   * @example
   * commentservice.create(5, { nombre: 'pedro', email: 'p@p.com', comentario: 'hola' })
   */
  async create(propertyId: number, data: CommentDTO): Promise<Comment | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      return null;
    }
    return commentRepository.create({ ...data, property });
  }

  /**
   * obtiene los comentarios de una propiedad de manera paginada.
   * 
   * @async
   * @param {number} propertyId - id de la propiedad
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de comentarios
   * @returns {Promise<PaginatedResult<Comment> | null>} comentarios o null si la propiedad no existe
   * 
   * @example
   * commentservice.getbypropertyid(5, 1, 10)
   */
  async getByPropertyId(propertyId: number, page: number, limit: number): Promise<PaginatedResult<Comment> | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      return null; // La propiedad no existe
    }
    return commentRepository.findPaginatedByPropertyId(propertyId, page, limit);
  }
}

export const commentService = new CommentService();
