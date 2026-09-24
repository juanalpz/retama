/**
 * @fileoverview Repositorio de Propiedades.
 * Encapsula todas las operaciones de acceso a datos (queries) para la entidad Property
 * y sus relaciones: fotos (PropertyPhoto), tags (PropertyTag) e historial de estados
 * (PropertyStatusHistory). También gestiona las consultas de visitas confirmadas para
 * validaciones de reglas de negocio.
 */

import { Repository, In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";
import { PropertyPhoto } from "../entities/property-photo.entity";
import { PropertyTag } from "../entities/property-tag.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";
import { Tag } from "../entities/tag.entity";
import { Visit } from "../entities/visit.entity";

// ==========================================
// 3. ABM Y CICLO DE VIDA DE PROPIEDADES
// ==========================================

class PropertyRepository {
  private get repository(): Repository<Property> {
    return AppDataSource.getRepository(Property);
  }

  private get photoRepository(): Repository<PropertyPhoto> {
    return AppDataSource.getRepository(PropertyPhoto);
  }

  private get tagRepository(): Repository<Tag> {
    return AppDataSource.getRepository(Tag);
  }

  private get propertyTagRepository(): Repository<PropertyTag> {
    return AppDataSource.getRepository(PropertyTag);
  }

  private get statusHistoryRepository(): Repository<PropertyStatusHistory> {
    return AppDataSource.getRepository(PropertyStatusHistory);
  }

  private get visitRepository(): Repository<Visit> {
    return AppDataSource.getRepository(Visit);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.1] Persiste una nueva propiedad en la base de datos.
   * Se espera recibir un objeto parcial con al menos los campos obligatorios ya resueltos
   * por el servicio (titulo, operacion, precio, moneda, agency).
   *
   * @async
   * @param {Partial<Property>} data - Datos de la propiedad a crear.
   * @returns {Promise<Property>} La propiedad recién creada.
   *
   * @example
   * const property = await propertyRepository.create({ titulo: "Depto 2 amb", agency, ... });
   */
  create(data: Partial<Property>): Promise<Property> {
    return this.repository.save(data);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.2] Recupera todas las propiedades de una inmobiliaria, incluyendo sus fotos y tags.
   * Utilizado para el listado "Mis propiedades" del panel del vendedor.
   *
   * @async
   * @param {number} agencyId - Identificador de la inmobiliaria.
   * @returns {Promise<Property[]>} Lista de propiedades con relaciones cargadas.
   *
   * @example
   * const properties = await propertyRepository.findByAgencyId(agency.id);
   */
  findByAgencyId(agencyId: number): Promise<Property[]> {
    return this.repository.find({
      where: { agency: { id: agencyId } },
      order: { createdAt: 'DESC' }
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.3] Busca una propiedad por su ID cargando la relación con la inmobiliaria.
   * Utilizado para obtener el detalle completo de la propiedad y para las validaciones
   * de pertenencia al vendedor en las operaciones de edición, cambio de estado y eliminación.
   *
   * @async
   * @param {number} id - Identificador único de la propiedad.
   * @returns {Promise<Property | null>} La propiedad con su agencia cargada, o null.
   *
   * @example
   * const property = await propertyRepository.findByIdWithAgency(propertyId);
   */
  findByIdWithAgency(id: number): Promise<Property | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['agency']
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.3] Busca una propiedad por su ID sin cargar relaciones.
   * Versión liviana para cuando solo se necesitan los datos planos de la propiedad.
   *
   * @async
   * @param {number} id - Identificador único de la propiedad.
   * @returns {Promise<Property | null>} La propiedad encontrada, o null.
   *
   * @example
   * const property = await propertyRepository.findById(propertyId);
   */
  findById(id: number): Promise<Property | null> {
    return this.repository.findOneBy({ id });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.4] Actualiza los campos de una propiedad existente.
   * Mutación pura sobre la base de datos. Solo los campos incluidos en `data` se actualizan.
   *
   * @async
   * @param {number} id - Identificador de la propiedad.
   * @param {Partial<Property>} data - Campos a actualizar.
   * @returns {Promise<import('typeorm').UpdateResult>} Resultado de la operación.
   *
   * @example
   * await propertyRepository.update(property.id, { precio: 500 });
   */
  update(id: number, data: Partial<Property>): Promise<import('typeorm').UpdateResult> {
    return this.repository.update(id, data);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 3.6] Elimina físicamente una propiedad de la base de datos.
   * Las entidades relacionadas (fotos, tags, historial, comentarios, visitas) se eliminan
   * en cascada gracias a la configuración `onDelete: CASCADE` de las entidades.
   *
   * @async
   * @param {number} id - Identificador de la propiedad a eliminar.
   * @returns {Promise<import('typeorm').DeleteResult>} Resultado de la eliminación.
   *
   * @example
   * await propertyRepository.deleteProperty(property.id);
   */
  deleteProperty(id: number): Promise<import('typeorm').DeleteResult> {
    return this.repository.delete(id);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * Verifica si la inmobiliaria tiene propiedades en estado 'Publicada' o 'Reservada'.
   * Utilizado como regla de negocio previo a la eliminación de la inmobiliaria (Endpoint 2.7).
   *
   * @async
   * @param {number} agencyId - Identificador de la inmobiliaria.
   * @returns {Promise<boolean>} `true` si existen propiedades activas.
   *
   * @example
   * const hasActive = await propertyRepository.hasActivePropertiesByAgency(agency.id);
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