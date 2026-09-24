/** 
 * @fileoverview repositorio de consultas sql para la tabla inmobiliarias.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Agency } from "../entities/agency.entity";
import { PaginatedResult } from "./property.repository";

class AgencyRepository {
  private get repository(): Repository<Agency> {
    return AppDataSource.getRepository(Agency);
  }

  /**
   * busca una inmobiliaria por su id junto con sus telefonos y correos de contacto.
   * 
   * @param {number} id - id de la inmobiliaria
   * @returns {Promise<Agency | null>} entidad encontrada o null
   * 
   * @example
   * agencyrepository.findbyid(1)
   */
  findById(id: number): Promise<Agency | null> {
    return this.repository.findOne({ where: { id }, relations: ['telefonos', 'correos'] });
  }

  /**
   * lista agencias con paginacion y busqueda por nombre.
   * 
   * @async
   * @param {string | undefined} nombreFantasia - busqueda parcial por nombre (opcional)
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Agency>>} agencias paginadas
   */
  async findPaginated(nombreFantasia?: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<Agency>> {
    const query = this.repository.createQueryBuilder('agency')
      .leftJoinAndSelect('agency.telefonos', 'telefonos')
      .leftJoinAndSelect('agency.correos', 'correos');

    if (nombreFantasia) {
      query.andWhere('agency.nombreFantasia ILIKE :nombre', { nombre: `%${nombreFantasia}%` });
    }

    const [data, total] = await query
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
}

export const agencyRepository = new AgencyRepository();
