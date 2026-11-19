/**
 * acceso a datos de las reseñas de inmobiliarias.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Review } from "../entities/review.entity";
import { ReviewDTO } from "../schemas/review.schema";
import { Agency } from "../entities/agency.entity";
import { PaginatedResult } from "./property.repository";

class ReviewRepository {
  /**
   * @returns el repositorio de typeorm de reseñas. se pide en cada uso porque la conexion todavia no existe cuando se importa el archivo
   */
  private get repository(): Repository<Review> {
    return AppDataSource.getRepository(Review);
  }

  /**
   * guarda una reseña nueva.
   *
   * @param data nombre de quien opina, contenido, calificacion y la inmobiliaria reseñada
   * @returns la reseña guardada, con su id y su fecha
   */
  create(data: ReviewDTO & { agency: Agency }): Promise<Review> {
    const review = this.repository.create(data);
    return this.repository.save(review);
  }

  /**
   * calcula la calificacion promedio y la cantidad de reseñas de una inmobiliaria.
   *
   * @param agencyId id de la inmobiliaria
   * @returns { promedio, cantidad }; el promedio tiene dos decimales y es null si todavia no hay reseñas
   */
  async getRatingSummary(agencyId: number): Promise<{ promedio: number | null; cantidad: number }> {
    const raw = await this.repository.createQueryBuilder('review')
      .select('AVG(review.calificacion)', 'promedio')
      .addSelect('COUNT(review.id)', 'cantidad')
      .where('review.agency = :agencyId', { agencyId })
      .getRawOne();
    const cantidad = Number(raw?.cantidad ?? 0);
    return {
      promedio: cantidad > 0 ? Number(Number(raw.promedio).toFixed(2)) : null,
      cantidad,
    };
  }

  /**
   * reseñas de una inmobiliaria, para su perfil publico.
   *
   * @param agencyId id de la inmobiliaria
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 10)
   * @returns un resultado paginado de reseñas, la mas reciente primero
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
