/** 
 * @fileoverview repositorio de consultas sql para la tabla propiedades.
 * maneja lecturas completas y busquedas con filtros complejos.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";

export interface PropertyFilters {
  titulo?: string;
  tipo?: string;
  operacion?: string;
  minPrice?: number;
  maxPrice?: number;
  barrioZona?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class PropertyRepository {
  private get repository(): Repository<Property> {
    return AppDataSource.getRepository(Property);
  }

  /**
   * busca una propiedad por id incluyendo sus relaciones (fotos, tags e inmobiliaria).
   * 
   * @param {number} id - identificador unico de la propiedad
   * @returns {Promise<Property | null>} promesa con la entidad property o null si no existe
   * 
   * @example
   * propertyrepository.findbyid(5)
   */
  findById(id: number): Promise<Property | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['agency', 'agency.telefonos', 'agency.correos', 'fotos', 'tags', 'tags.tag'],
    });
  }

  /**
   * busca propiedades basandose en filtros dinamicos usando un querybuilder.
   * solo devuelve propiedades en estado 'publicada'.
   * 
   * @async
   * @param {PropertyFilters} filters - objeto con filtros (tipo, operacion, precios, zona, paginacion)
   * @returns {Promise<PaginatedResult<Property>>} promesa con resultados paginados
   * 
   * @example
   * propertyrepository.findfiltered({ operacion: 'venta', minprice: 50000 })
   */
  async findFiltered(filters: PropertyFilters): Promise<PaginatedResult<Property>> {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const query = this.repository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('property.fotos', 'fotos')
      .where('property.estado = :estado', { estado: 'PUBLICADA' });

    if (filters.titulo) {
      // Usamos ILIKE para que la busqueda sea case-insensitive en PostgreSQL
      query.andWhere('property.titulo ILIKE :titulo', { titulo: `%${filters.titulo}%` });
    }

    // Handle filters (some might need proper JOINs depending on the db schema, but here we keep it simple based on entity)
    if (filters.operacion) {
      query.andWhere('property.operacion = :operacion', { operacion: filters.operacion });
    }
    if (filters.minPrice) {
      query.andWhere('property.precio >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice) {
      query.andWhere('property.precio <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters.barrioZona) {
      query.andWhere('property.barrioZona LIKE :barrioZona', { barrioZona: `%${filters.barrioZona}%` });
    }
    // For tipo prop, if "tipo" means idTipoPropiedad
    if (filters.tipo) {
      query.andWhere('property.idTipoPropiedad = :tipo', { tipo: Number(filters.tipo) });
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

  /**
   * busca propiedades que pertenecen a una inmobiliaria especifica (catalogo exclusivo).
   * solo devuelve propiedades publicadas.
   * 
   * @async
   * @param {number} agencyId - id de la inmobiliaria
   * @param {number} page - numero de pagina (default 1)
   * @param {number} limit - cantidad por pagina (default 12)
   * @returns {Promise<PaginatedResult<Property>>} promesa con resultados paginados
   * 
   * @example
   * propertyrepository.findbyagencyid(1, 1, 12)
   */
  async findByAgencyId(agencyId: number, page: number = 1, limit: number = 12): Promise<PaginatedResult<Property>> {
    const query = this.repository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('property.fotos', 'fotos')
      .where('property.estado = :estado', { estado: 'PUBLICADA' })
      .andWhere('agency.id = :agencyId', { agencyId });

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

export const propertyRepository = new PropertyRepository();