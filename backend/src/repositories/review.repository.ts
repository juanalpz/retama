/** 
 * @fileoverview repositorio de consultas sql para la tabla resenas.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Review } from "../entities/review.entity";
import { ReviewDTO } from "../schemas/review.schema";
import { Agency } from "../entities/agency.entity";
import { PaginatedResult } from "./property.repository";

class ReviewRepository {
  private get repository(): Repository<Review> {
    return AppDataSource.getRepository(Review);
  }

  /**
   * crea y guarda una nueva reseña/calificacion asociada a una inmobiliaria.
   * 
   * @param {ReviewDTO & { agency: Agency }} data - datos de la reseña y la relacion con la agencia
   * @returns {Promise<Review>} la reseña guardada
   * 
   * @example
   * reviewrepository.create({ calificacion: 5, comentario: 'muy bueno', agency: agencyEntity })
   */
  create(data: ReviewDTO & { agency: Agency }): Promise<Review> {
    const review = this.repository.create(data);
    return this.repository.save(review);
  }

  /**
   * busca todas las reseñas de una inmobiliaria dada.
   * 
   * @param {number} agencyId - id de la inmobiliaria
   * @returns {Promise<Review[]>} lista de reseñas
   * 
   * @example
   * reviewrepository.findbyagencyid(1)
   */
  findByAgencyId(agencyId: number): Promise<Review[]> {
    return this.repository.find({ where: { agency: { id: agencyId } } });
  }

  /**
   * busca las reseñas de una inmobiliaria de forma paginada y ordenadas por fecha.
   * 
   * @async
   * @param {number} agencyId - id de la inmobiliaria
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Review>>} reseñas paginadas
   * 
   * @example
   * reviewrepository.findpaginatedbyagencyid(1, 1, 10)
   */
  async findPaginatedByAgencyId(agencyId: number, page: number = 1, limit: number = 10): Promise<PaginatedResult<Review>> {
    const [data, total] = await this.repository.findAndCount({
      where: { agency: { id: agencyId } },
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

export const reviewRepository = new ReviewRepository();
