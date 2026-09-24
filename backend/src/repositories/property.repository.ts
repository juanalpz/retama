/** 
 * @fileoverview repositorio de consultas sql para la tabla propiedades.
 * maneja lecturas completas y busquedas con filtros complejos.
 */

import { Repository, In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";
import { PropertyPhoto } from "../entities/property-photo.entity";
import { PropertyTag } from "../entities/property-tag.entity";
import { Tag } from "../entities/tag.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";
import { Visit } from "../entities/visit.entity";

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

  private get photoRepository(): Repository<PropertyPhoto> {
    return AppDataSource.getRepository(PropertyPhoto);
  }

  private get propertyTagRepository(): Repository<PropertyTag> {
    return AppDataSource.getRepository(PropertyTag);
  }

  private get tagRepository(): Repository<Tag> {
    return AppDataSource.getRepository(Tag);
  }

  private get statusHistoryRepository(): Repository<PropertyStatusHistory> {
    return AppDataSource.getRepository(PropertyStatusHistory);
  }

  private get visitRepository(): Repository<Visit> {
    return AppDataSource.getRepository(Visit);
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

  /**
   * Verifica si la inmobiliaria tiene propiedades en estado 'Publicada' o 'Reservada'
   */
  async hasActivePropertiesByAgency(agencyId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: [
        { agency: { id: agencyId }, estado: 'PUBLICADA' },
        { agency: { id: agencyId }, estado: 'RESERVADA' },
        { agency: { id: agencyId }, estado: 'Publicada' },
        { agency: { id: agencyId }, estado: 'Reservada' }
      ]
    });
    return count > 0;
  }

  // ----------------------------------------------------------------------------------------------------
  // FOTOS
  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.3] Recupera todas las fotos de una propiedad, ordenadas por su campo `orden`.
   *
   * @async
   * @param {number} propertyId - Identificador de la propiedad.
   * @returns {Promise<PropertyPhoto[]>} Galería de fotos ordenada.
   *
   * @example
   * const photos = await propertyRepository.findPhotosByPropertyId(property.id);
   */
  findPhotosByPropertyId(propertyId: number): Promise<PropertyPhoto[]> {
    return this.photoRepository.find({
      where: { property: { id: propertyId } },
      order: { orden: 'ASC' }
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // TAGS
  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.3] Recupera los tags (amenities) asociados a una propiedad,
   * cargando la entidad Tag para obtener el nombre de cada uno.
   *
   * @async
   * @param {number} propertyId - Identificador de la propiedad.
   * @returns {Promise<PropertyTag[]>} Lista de relaciones propiedad-tag con el tag cargado.
   *
   * @example
   * const propertyTags = await propertyRepository.findTagsByPropertyId(property.id);
   */
  findTagsByPropertyId(propertyId: number): Promise<PropertyTag[]> {
    return this.propertyTagRepository.find({
      where: { property: { id: propertyId } },
      relations: ['tag']
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.1 / 3.4] Busca tags por sus IDs para validar que existan antes de asociarlos.
   *
   * @async
   * @param {number[]} tagIds - Lista de IDs de tags a buscar.
   * @returns {Promise<Tag[]>} Los tags encontrados.
   *
   * @example
   * const tags = await propertyRepository.findTagsByIds([1, 2, 3]);
   */
  findTagsByIds(tagIds: number[]): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { id: In(tagIds) }
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.1 / 3.4] Asocia múltiples tags a una propiedad de una sola vez.
   * Recibe un array de relaciones parciales PropertyTag para persistir en lote.
   *
   * @async
   * @param {Partial<PropertyTag>[]} propertyTags - Relaciones propiedad-tag a crear.
   * @returns {Promise<PropertyTag[]>} Las relaciones creadas.
   *
   * @example
   * await propertyRepository.createPropertyTags([{ property, tag }]);
   */
  createPropertyTags(propertyTags: Partial<PropertyTag>[]): Promise<PropertyTag[]> {
    return this.propertyTagRepository.save(propertyTags);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.4] Elimina todos los tags asociados a una propiedad.
   * Se invoca antes de reasignar los tags actualizados en una edición.
   *
   * @async
   * @param {number} propertyId - Identificador de la propiedad.
   * @returns {Promise<import('typeorm').DeleteResult>} Resultado de la eliminación.
   *
   * @example
   * await propertyRepository.deleteTagsByPropertyId(property.id);
   */
  async deleteTagsByPropertyId(propertyId: number): Promise<import('typeorm').DeleteResult> {
    return this.propertyTagRepository.delete({ property: { id: propertyId } });
  }

  // ----------------------------------------------------------------------------------------------------
  // HISTORIAL DE ESTADOS
  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.5] Registra un cambio de estado en el historial de la propiedad.
   * Cada transición genera un log inmutable con estado anterior, nuevo estado y timestamp.
   *
   * @async
   * @param {Partial<PropertyStatusHistory>} log - Datos del cambio de estado.
   * @returns {Promise<PropertyStatusHistory>} El registro de historial creado.
   *
   * @example
   * await propertyRepository.createStatusLog({ property, estadoViejo: "BORRADOR", estadoNuevo: "PUBLICADA" });
   */
  createStatusLog(log: Partial<PropertyStatusHistory>): Promise<PropertyStatusHistory> {
    return this.statusHistoryRepository.save(log);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.3] Recupera el historial completo de estados de una propiedad, ordenado cronológicamente.
   *
   * @async
   * @param {number} propertyId - Identificador de la propiedad.
   * @returns {Promise<PropertyStatusHistory[]>} Historial de transiciones de estado.
   *
   * @example
   * const history = await propertyRepository.findStatusHistoryByPropertyId(property.id);
   */
  findStatusHistoryByPropertyId(propertyId: number): Promise<PropertyStatusHistory[]> {
    return this.statusHistoryRepository.find({
      where: { property: { id: propertyId } },
      order: { fechaCambio: 'ASC' }
    });
  }

  // ----------------------------------------------------------------------------------------------------
  // VISITAS (helpers para reglas de negocio)
  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.4 / 3.6] Verifica si la propiedad tiene visitas en estado 'CONFIRMADA'.
   * Regla de negocio: una propiedad con visitas confirmadas pendientes no se puede
   * eliminar ni editar sus datos principales.
   *
   * @async
   * @param {number} propertyId - Identificador de la propiedad.
   * @returns {Promise<boolean>} `true` si existen visitas confirmadas pendientes.
   *
   * @example
   * const hasVisits = await propertyRepository.hasConfirmedVisits(property.id);
   */
  async hasConfirmedVisits(propertyId: number): Promise<boolean> {
    const count = await this.visitRepository.count({
      where: { property: { id: propertyId }, estado: 'CONFIRMADA' }
    });
    return count > 0;
  }
}

export const propertyRepository = new PropertyRepository();