/**
 * acceso a datos de propiedades, fotos, tags e historial de estados.
 * aca viven las consultas a la base; las reglas de negocio estan en property.service.ts.
 * tambien define los tipos PropertyFilters y PaginatedResult que usa el resto de las capas.
 */

import { Repository, In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";
import { PropertyPhoto } from "../entities/property-photo.entity";
import { PropertyTag } from "../entities/property-tag.entity";
import { Tag } from "../entities/tag.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";
import { Visit } from "../entities/visit.entity";
import { parseTipoFilter } from "../utils/property-type.utils";

// =================================================================================
// endpoints: catálogo público de propiedades
// =================================================================================

export interface PropertyFilters {
  q?: string;
  titulo?: string;
  tipo?: string;
  operacion?: string;
  minPrice?: number;
  maxPrice?: number;
  barrioZona?: string;
  ambientes?: number;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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
  /**
   * @returns el repositorio de typeorm de propiedades. se pide en cada uso porque la conexion todavia no existe cuando se importa el archivo
   */
  private get repository(): Repository<Property> {
    return AppDataSource.getRepository(Property);
  }

  /**
   * guarda una propiedad nueva.
   *
   * @param propertyData datos de la propiedad, con su inmobiliaria
   * @returns la propiedad guardada, con su id
   */
  createProperty(propertyData: Partial<Property>): Promise<Property> {
    const property = this.repository.create(propertyData);
    return this.repository.save(property);
  }

  /**
   * actualiza los campos indicados de una propiedad.
   *
   * @param id id de la propiedad
   * @param propertyData campos a modificar
   * @returns la propiedad actualizada con sus relaciones, o null si no existe
   */
  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | null> {
    await this.repository.update(id, propertyData);
    return this.findById(id);
  }

  /**
   * @returns el repositorio de typeorm de fotos
   */
  private get photoRepository(): Repository<PropertyPhoto> {
    return AppDataSource.getRepository(PropertyPhoto);
  }

  /**
   * @returns el repositorio de typeorm de la relacion propiedad-tag
   */
  private get propertyTagRepository(): Repository<PropertyTag> {
    return AppDataSource.getRepository(PropertyTag);
  }

  /**
   * @returns el repositorio de typeorm de tags
   */
  private get tagRepository(): Repository<Tag> {
    return AppDataSource.getRepository(Tag);
  }

  /**
   * @returns el repositorio de typeorm del historial de estados
   */
  private get statusHistoryRepository(): Repository<PropertyStatusHistory> {
    return AppDataSource.getRepository(PropertyStatusHistory);
  }

  /**
   * @returns el repositorio de typeorm de visitas
   */
  private get visitRepository(): Repository<Visit> {
    return AppDataSource.getRepository(Visit);
  }

  /**
   * busca una propiedad con todo lo que hace falta para mostrar su detalle.
   * del vendedor solo trae el id (para saber a quien notificar), asi su email
   * y demas datos no salen en ninguna respuesta.
   *
   * @param id id de la propiedad
   * @returns la propiedad con inmobiliaria (telefonos y correos), fotos ordenadas y tags, o null si no existe
   */
  findById(id: number): Promise<Property | null> {
    // del vendedor solo se trae el id (hace falta para saber a quien notificar).
    // el resto de sus datos (email, etc) no se selecciona para que no salga en la respuesta.
    return this.repository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoin('agency.seller', 'seller')
      .addSelect(['seller.id'])
      .leftJoinAndSelect('agency.telefonos', 'telefonos')
      .leftJoinAndSelect('agency.correos', 'correos')
      .leftJoinAndSelect('property.fotos', 'fotos')
      .leftJoinAndSelect('property.tags', 'tags')
      .leftJoinAndSelect('tags.tag', 'tag')
      .where('property.id = :id', { id })
      // las fotos salen ordenadas como las acomodo el vendedor en la galeria
      .orderBy('fotos.orden', 'ASC')
      .addOrderBy('fotos.id', 'ASC')
      .getOne();
  }

  /**
   * lista todos los tags (amenities).
   *
   * @returns los tags ordenados alfabeticamente
   */
  findAllTags(): Promise<Tag[]> {
    return this.tagRepository.find({ order: { tag: 'ASC' } });
  }
  /**
   * listado publico: busca propiedades publicadas aplicando los filtros que lleguen,
   * todos combinables. arma la consulta con un querybuilder.
   *
   * @param filters q (texto libre), titulo, tipo, operacion, minPrice, maxPrice, barrioZona, ambientes, tags, sortBy, sortOrder, page, limit
   * @returns un resultado paginado { data, total, page, limit, totalPages } con fotos, tags e inmobiliaria de cada propiedad
   */
  async findFiltered(filters: PropertyFilters): Promise<PaginatedResult<Property>> {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const query = this.repository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('property.fotos', 'fotos')
      .leftJoinAndSelect('property.tags', 'tags')
      .leftJoinAndSelect('tags.tag', 'tag')
      .where('property.estado = :estado', { estado: 'PUBLICADA' });

    // texto libre: busca en titulo y descripcion. ilike no distingue mayusculas en postgres
    if (filters.q) {
      query.andWhere('(property.titulo ILIKE :q OR property.descripcion ILIKE :q)', { q: `%${filters.q}%` });
    }

    // filtro solo por titulo (se mantiene por compatibilidad)
    if (filters.titulo) {
      query.andWhere('property.titulo ILIKE :titulo', { titulo: `%${filters.titulo}%` });
    }

    if (filters.operacion) {
      query.andWhere('property.operacion = :operacion', { operacion: filters.operacion.toUpperCase() });
    }

    if (filters.minPrice !== undefined) {
      query.andWhere('property.precio >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      query.andWhere('property.precio <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.barrioZona) {
      query.andWhere('property.barrioZona ILIKE :barrioZona', { barrioZona: `%${filters.barrioZona}%` });
    }

    // el tipo puede llegar como nombre (CASA) o como numero (1)
    if (filters.tipo) {
      const tipoId = parseTipoFilter(filters.tipo);
      if (tipoId === null) {
        // si el tipo pedido no existe no hay nada para mostrar
        query.andWhere('1 = 0');
      } else {
        query.andWhere('property.idTipoPropiedad = :tipo', { tipo: tipoId });
      }
    }

    if (filters.ambientes !== undefined) {
      query.andWhere('property.ambientes = :ambientes', { ambientes: filters.ambientes });
    }

    // amenities: la propiedad tiene que tener todos los tags pedidos.
    // cada tag puede venir como id o como nombre.
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach((tag, index) => {
        const porId = /^\d+$/.test(tag);
        const condicion = porId ? `t.id_tag = :tag${index}` : `LOWER(t.tag) = LOWER(:tag${index})`;
        query.andWhere(`EXISTS (
          SELECT 1 FROM propiedades_tags pt
          INNER JOIN tags t ON pt.id_tag = t.id_tag
          WHERE pt.id_propiedad = property.id_propiedad AND ${condicion}
        )`, { [`tag${index}`]: porId ? Number(tag) : tag });
      });
    }

    // orden: por precio, fecha de publicacion o superficie. por defecto, las mas nuevas primero
    const order = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    switch (filters.sortBy) {
      case 'precio':
        query.orderBy('property.precio', order);
        break;
      case 'superficie':
        query.orderBy('property.superficieTotalM2', order);
        break;
      case 'fecha':
        query.orderBy('property.createdAt', order);
        break;
      default:
        query.orderBy('property.createdAt', 'DESC');
    }
    // segundo criterio fijo para que el paginado sea estable cuando hay empates
    query.addOrderBy('property.id', 'DESC');

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
   * propiedades publicadas de una inmobiliaria, para su perfil publico.
   *
   * @param agencyId id de la inmobiliaria
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 12)
   * @returns un resultado paginado de propiedades, las mas nuevas primero
   */
  async findByAgencyId(agencyId: number, page: number = 1, limit: number = 12): Promise<PaginatedResult<Property>> {
    const query = this.repository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('property.fotos', 'fotos')
      .where('property.estado = :estado', { estado: 'PUBLICADA' })
      .andWhere('agency.id = :agencyId', { agencyId })
      // las mas nuevas primero
      .orderBy('property.createdAt', 'DESC')
      .addOrderBy('property.id', 'DESC');

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
   * propiedades de una inmobiliaria en cualquier estado, para el panel del vendedor.
   *
   * @param agencyId id de la inmobiliaria
   * @param estado estado por el que filtrar (opcional)
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 12)
   * @returns un resultado paginado de propiedades, las mas nuevas primero
   */
  async findAllByAgencyId(agencyId: number, estado?: string, page: number = 1, limit: number = 12): Promise<PaginatedResult<Property>> {
    const query = this.repository.createQueryBuilder('property')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('property.fotos', 'fotos')
      .where('agency.id = :agencyId', { agencyId });

    if (estado) {
      // opcionalmente se puede usar UPPER(estado) si fuera necesario, pero asumiendo mayúsculas exactas.
      query.andWhere('property.estado = :estado', { estado });
    }

    // opcional: ordenar por creación descendente para el dashboard
    query.orderBy('property.id', 'DESC');

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
   * indica si una inmobiliaria tiene propiedades publicadas o reservadas.
   * se usa para la regla que impide eliminar la inmobiliaria.
   *
   * @param agencyId id de la inmobiliaria
   * @returns true si tiene al menos una, false si no
   */
  async hasActivePropertiesByAgency(agencyId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: [
        { agency: { id: agencyId }, estado: 'PUBLICADA' },
        { agency: { id: agencyId }, estado: 'RESERVADA' }
      ]
    });
    return count > 0;
  }

  // ----------------------------------------------------------------------------------------------------
  // fotos
  // ----------------------------------------------------------------------------------------------------

  /**
   * fotos de una propiedad.
   *
   * @param propertyId id de la propiedad
   * @returns las fotos ordenadas por el campo orden
   */
  findPhotosByPropertyId(propertyId: number): Promise<PropertyPhoto[]> {
    return this.photoRepository.find({
      where: { property: { id: propertyId } },
      order: { orden: 'ASC' }
    });
  }

  /**
   * busca una foto con la propiedad a la que pertenece.
   *
   * @param photoId id de la foto
   * @returns la foto con su propiedad, o null si no existe
   */
  findPhotoById(photoId: number): Promise<PropertyPhoto | null> {
    return this.photoRepository.findOne({
      where: { id: photoId },
      relations: ['property']
    });
  }

  /**
   * guarda una foto nueva.
   *
   * @param data url, orden, esPortada y la propiedad a la que pertenece
   * @returns la foto guardada, con su id
   */
  createPhoto(data: Partial<PropertyPhoto> & { property: Property }): Promise<PropertyPhoto> {
    const photo = this.photoRepository.create(data);
    return this.photoRepository.save(photo);
  }

  /**
   * actualiza el orden o la portada de una foto.
   *
   * @param photoId id de la foto
   * @param data campos a modificar
   * @returns nada
   */
  async updatePhoto(photoId: number, data: Partial<PropertyPhoto>): Promise<void> {
    await this.photoRepository.update(photoId, data);
  }

  /**
   * borra una foto.
   *
   * @param photoId id de la foto
   * @returns nada
   */
  async deletePhoto(photoId: number): Promise<void> {
    await this.photoRepository.delete(photoId);
  }

  /**
   * cuenta las fotos de una propiedad.
   *
   * @param propertyId id de la propiedad
   * @returns la cantidad de fotos
   */
  countPhotosByPropertyId(propertyId: number): Promise<number> {
    return this.photoRepository.count({
      where: { property: { id: propertyId } }
    });
  }

  /**
   * desmarca la portada en todas las fotos de una propiedad.
   * se llama antes de marcar una nueva, para que siempre haya una sola.
   *
   * @param propertyId id de la propiedad
   * @returns nada
   */
  async clearCoverPhotos(propertyId: number): Promise<void> {
    await this.photoRepository.update(
      { property: { id: propertyId } },
      { esPortada: false }
    );
  }

  // ----------------------------------------------------------------------------------------------------
  // tags
  // ----------------------------------------------------------------------------------------------------

  // ----------------------------------------------------------------------------------------------------

  /**
   * busca los tags que existen entre una lista de ids.
   *
   * @param tagIds ids a buscar
   * @returns los tags encontrados (los ids que no existen simplemente no vuelven)
   */
  findTagsByIds(tagIds: number[]): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { id: In(tagIds) }
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * asocia tags a una propiedad, guardando todas las relaciones juntas.
   *
   * @param propertyTags relaciones a guardar, cada una con su propiedad y su tag
   * @returns las relaciones guardadas
   */
  createPropertyTags(propertyTags: Partial<PropertyTag>[]): Promise<PropertyTag[]> {
    return this.propertyTagRepository.save(propertyTags);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * quita todos los tags de una propiedad.
   *
   * @param propertyId id de la propiedad
   * @returns el resultado del borrado de typeorm (trae la cantidad de filas afectadas)
   */
  async deleteTagsByPropertyId(propertyId: number): Promise<import('typeorm').DeleteResult> {
    return this.propertyTagRepository.delete({ property: { id: propertyId } });
  }

  // ----------------------------------------------------------------------------------------------------
  // historial de estados
  // ----------------------------------------------------------------------------------------------------

  /**
   * agrega un registro al historial de estados. nunca modifica los anteriores.
   *
   * @param log propiedad, estado anterior y estado nuevo
   * @returns el registro guardado, con su fecha
   */
  createStatusLog(log: Partial<PropertyStatusHistory>): Promise<PropertyStatusHistory> {
    return this.statusHistoryRepository.save(log);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * historial de estados de una propiedad.
   *
   * @param propertyId id de la propiedad
   * @returns los cambios de estado en orden cronologico
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
   * indica si una propiedad tiene visitas en estado CONFIRMADA.
   * se usa para la regla que impide editarla o darla de baja.
   *
   * @param propertyId id de la propiedad
   * @returns true si tiene al menos una, false si no
   */
  async hasConfirmedVisits(propertyId: number): Promise<boolean> {
    const count = await this.visitRepository.count({
      where: { property: { id: propertyId }, estado: 'CONFIRMADA' }
    });
    return count > 0;
  }
}

export const propertyRepository = new PropertyRepository();