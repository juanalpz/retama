/** 
 * @fileoverview servicio para la gestion de inmobiliarias y su perfil publico.
 */

import { agencyRepository } from "../repositories/agency.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { reviewRepository } from "../repositories/review.repository";
import { Agency } from "../entities/agency.entity";
import { Property } from "../entities/property.entity";
import { Review } from "../entities/review.entity";
import { ReviewDTO } from "../schemas/review.schema";

class AgencyService {
  /**
   * obtiene una inmobiliaria por su id.
   * 
   * @param {number} id - id de la inmobiliaria
   * @returns {Promise<Agency | null>} agencia encontrada
   * 
   * @example
   * agencyservice.getbyid(1)
   */
  getById(id: number): Promise<Agency | null> {
    return agencyRepository.findById(id);
  }

  /**
   * obtiene la lista de inmobiliarias filtrada y paginada.
   * 
   * @param {string | undefined} nombreFantasia - busqueda parcial por nombre
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Agency>>} agencias paginadas
   */
  getAll(nombreFantasia: string | undefined, page: number, limit: number): Promise<PaginatedResult<Agency>> {
    return agencyRepository.findPaginated(nombreFantasia, page, limit);
  }

  /**
   * obtiene las propiedades de una inmobiliaria especifica.
   * 
   * @param {number} agencyId - id de la inmobiliaria
   * @param {number} page - numero de pagina
   * @param {number} limit - tamaño de pagina
   * @returns {Promise<PaginatedResult<Property>>} catalogo de la inmobiliaria
   * 
   * @example
   * agencyservice.getproperties(1, 1, 10)
   */
  getProperties(agencyId: number, page: number, limit: number): Promise<PaginatedResult<Property>> {
    return propertyRepository.findByAgencyId(agencyId, page, limit);
  }

  /**
   * crea una reseña verificando primero que la inmobiliaria exista.
   * 
   * @async
   * @param {number} agencyId - id de la inmobiliaria a calificar
   * @param {ReviewDTO} data - datos de la reseña validada
   * @returns {Promise<Review | null>} reseña creada o null si no existe la inmobiliaria
   * 
   * @example
   * agencyservice.createreview(1, { calificacion: 5, nombreautor: 'ana', emailautor: 'a@a.com' })
   */
  async createReview(agencyId: number, data: ReviewDTO): Promise<Review | null> {
    const agency = await agencyRepository.findById(agencyId);
    if (!agency) {
      return null;
    }
    return reviewRepository.create({ ...data, agency });
  }

  /**
   * obtiene las reseñas de una inmobiliaria de manera paginada.
   * 
   * @async
   * @param {number} agencyId - id de la inmobiliaria
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de reseñas
   * @returns {Promise<PaginatedResult<Review> | null>} reseñas o null si la inmobiliaria no existe
   * 
   * @example
   * agencyservice.getreviews(1, 1, 10)
   */
  async getReviews(agencyId: number, page: number, limit: number): Promise<PaginatedResult<Review> | null> {
    const agency = await agencyRepository.findById(agencyId);
    if (!agency) {
      return null; // La agencia no existe
    }
    return reviewRepository.findPaginatedByAgencyId(agencyId, page, limit);
  }
}

export const agencyService = new AgencyService();
