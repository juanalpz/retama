/** 
 * @fileoverview servicio para la gestion de propiedades del catalogo.
 */

import { propertyRepository, PropertyFilters, PaginatedResult } from "../repositories/property.repository";
import { Property } from "../entities/property.entity";
import * as agencyServicePrivate from "./agency.service";
import { VALID_TRANSITIONS } from "../schemas/property.schema";
import { activityService } from "./activity.service";

class PropertyService {
  /**
   * obtiene una propiedad por su id.
   * 
   * @param {number} id - id de la propiedad
   * @returns {Promise<Property | null>} propiedad encontrada
   * 
   * @example
   * propertyservice.getbyid(5)
   */
  getById(id: number): Promise<Property | null> {
    return propertyRepository.findById(id);
  }

  /**
   * obtiene una lista filtrada y paginada de propiedades.
   * 
   * @param {PropertyFilters} filters - filtros aplicables
   * @returns {Promise<PaginatedResult<Property>>} propiedades paginadas
   * 
   * @example
   * propertyservice.getall({ operacion: 'alquiler' })
   */
  getAll(filters: PropertyFilters): Promise<PaginatedResult<Property>> {
    return propertyRepository.findFiltered(filters);
  }

  /**
   * crea una nueva propiedad.
   * 
   * @param {number} sellerId - id del vendedor logueado
   * @param {any} data - datos validados de la propiedad a crear
   * @returns {Promise<Property | null>} propiedad creada
   */
  async createProperty(sellerId: number, data: any): Promise<Property | null> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return null;

    const tipoPropiedadMap: Record<string, number> = {
      'CASA': 1,
      'DEPARTAMENTO': 2,
      'TERRENO': 3,
      'COMERCIAL': 4
    };

    const propertyData: Partial<Property> = {
      agency: { id: agency.id } as any,
      titulo: data.titulo,
      descripcion: data.descripcion,
      idTipoPropiedad: tipoPropiedadMap[data.tipoPropiedad] || null,
      operacion: data.operacion,
      precio: data.precio,
      moneda: data.moneda,
      direccionLinea1: data.direccionLinea1,
      barrioZona: data.barrioZona,
      superficieCubiertaM2: data.superficieCubiertaM2,
      superficieTotalM2: data.superficieTotalM2,
      ambientes: data.ambientes,
      dormitorios: data.dormitorios,
      banios: data.banios,
      estado: "BORRADOR"
    };

    const newProperty = await propertyRepository.createProperty(propertyData);

    if (data.tags && data.tags.length > 0) {
      const tagsExist = await propertyRepository.findTagsByIds(data.tags);
      if (tagsExist.length > 0) {
        const propertyTagsToCreate = tagsExist.map(tag => ({
          property: newProperty,
          tag: tag
        }));
        await propertyRepository.createPropertyTags(propertyTagsToCreate);
      }
    }

    return propertyRepository.findById(newProperty.id);
  }

  /**
   * obtiene las propiedades de un vendedor.
   */
  async getSellerProperties(sellerId: number, estado: string | undefined, page: number, limit: number): Promise<PaginatedResult<Property> | null> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return null;
    return propertyRepository.findAllByAgencyId(agency.id, estado, page, limit);
  }

  /**
   * obtiene una propiedad de un vendedor por su id.
   */
  async getSellerPropertyById(sellerId: number, propertyId: number): Promise<Property | null> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return null;

    const property = await propertyRepository.findById(propertyId);
    if (!property || property.agency.id !== agency.id) return null;

    // Get historial de estados
    const historial = await propertyRepository.findStatusHistoryByPropertyId(propertyId);
    property.historialEstados = historial;

    return property;
  }

  /**
   * [Endpoint 3.4] actualiza una propiedad.
   */
  async updateProperty(sellerId: number, propertyId: number, data: any): Promise<{ success: boolean, message?: string, property?: Property }> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return { success: false, message: 'Inmobiliaria no encontrada' };

    const property = await propertyRepository.findById(propertyId);
    if (!property || property.agency.id !== agency.id) return { success: false, message: 'Propiedad no encontrada' };

    // Regla: No se puede editar si está en VENDIDA, ALQUILADA o CANCELADA
    const estadosProhibidos = ['VENDIDA', 'ALQUILADA', 'CANCELADA'];
    if (estadosProhibidos.includes(property.estado)) {
      return { success: false, message: `No se puede editar una propiedad en estado ${property.estado}` };
    }

    // Regla: No se puede editar si tiene visitas CONFIRMADA pendientes
    const hasConfirmedVisits = await propertyRepository.hasConfirmedVisits(propertyId);
    if (hasConfirmedVisits) {
      return { success: false, message: 'No se puede editar la propiedad porque tiene visitas CONFIRMADA pendientes' };
    }

    const tipoPropiedadMap: Record<string, number> = {
      'CASA': 1,
      'DEPARTAMENTO': 2,
      'TERRENO': 3,
      'COMERCIAL': 4
    };

    const updateData: Partial<Property> = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.tipoPropiedad !== undefined) updateData.idTipoPropiedad = tipoPropiedadMap[data.tipoPropiedad];
    if (data.operacion !== undefined) updateData.operacion = data.operacion;
    if (data.precio !== undefined) updateData.precio = data.precio;
    if (data.moneda !== undefined) updateData.moneda = data.moneda;
    if (data.direccionLinea1 !== undefined) updateData.direccionLinea1 = data.direccionLinea1;
    if (data.barrioZona !== undefined) updateData.barrioZona = data.barrioZona;
    if (data.superficieCubiertaM2 !== undefined) updateData.superficieCubiertaM2 = data.superficieCubiertaM2;
    if (data.superficieTotalM2 !== undefined) updateData.superficieTotalM2 = data.superficieTotalM2;
    if (data.ambientes !== undefined) updateData.ambientes = data.ambientes;
    if (data.dormitorios !== undefined) updateData.dormitorios = data.dormitorios;
    if (data.banios !== undefined) updateData.banios = data.banios;

    if (Object.keys(updateData).length > 0) {
      await propertyRepository.updateProperty(propertyId, updateData);
    }

    // Gestionar tags si se enviaron
    if (data.tags !== undefined) {
      await propertyRepository.deleteTagsByPropertyId(propertyId);
      if (data.tags.length > 0) {
        const tagsExist = await propertyRepository.findTagsByIds(data.tags);
        if (tagsExist.length > 0) {
          const propertyTagsToCreate = tagsExist.map(tag => ({
            property: property,
            tag: tag
          }));
          await propertyRepository.createPropertyTags(propertyTagsToCreate);
        }
      }
    }

    const updatedProperty = await propertyRepository.findById(propertyId);
    return { success: true, property: updatedProperty! };
  }

  /**
   * [Endpoint 3.5] cambia el estado de una propiedad según la máquina de estados.
   * Registra cada transición en propiedades_cambios_logs.
   *
   * Máquina de estados:
   *   BORRADOR  → PUBLICADA, CANCELADA
   *   PUBLICADA → RESERVADA, PAUSADA, CANCELADA
   *   PAUSADA   → PUBLICADA, CANCELADA
   *   RESERVADA → VENDIDA, ALQUILADA, CANCELADA
   *
   * VENDIDA, ALQUILADA, CANCELADA → (estados terminales, sin transiciones)
   */
  async changePropertyStatus(sellerId: number, propertyId: number, nuevoEstado: string): Promise<{ success: boolean, message?: string, property?: Property }> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return { success: false, message: 'Inmobiliaria no encontrada' };

    const property = await propertyRepository.findById(propertyId);
    if (!property || property.agency.id !== agency.id) return { success: false, message: 'Propiedad no encontrada' };

    const estadoActual = property.estado;

    // Verificar que el estado actual admita transiciones
    const transicionesPermitidas = VALID_TRANSITIONS[estadoActual];
    if (!transicionesPermitidas) {
      return { success: false, message: `La propiedad en estado ${estadoActual} no admite más transiciones` };
    }

    // Verificar que la transición solicitada sea válida
    if (!transicionesPermitidas.includes(nuevoEstado)) {
      return { success: false, message: `Transición no permitida: ${estadoActual} → ${nuevoEstado}. Transiciones válidas: ${transicionesPermitidas.join(', ')}` };
    }

    // Validación de fotos antes de publicar
    if (nuevoEstado === 'PUBLICADA') {
      const photos = await propertyRepository.findPhotosByPropertyId(propertyId);
      if (photos.length === 0) {
        return { success: false, message: 'La propiedad debe tener al menos una foto para ser PUBLICADA' };
      }
      
      const hasCover = photos.some(p => p.esPortada);
      if (!hasCover) {
        // Asignamos la primera foto como portada por defecto si no hay ninguna
        await propertyRepository.updatePhoto(photos[0].id, { esPortada: true });
      }
    }

    // Actualizar el estado de la propiedad
    await propertyRepository.updateProperty(propertyId, { estado: nuevoEstado } as Partial<Property>);

    // Registrar el cambio en propiedades_cambios_logs
    await propertyRepository.createStatusLog({
      property: { id: propertyId } as Property,
      estadoViejo: estadoActual,
      estadoNuevo: nuevoEstado
    });

    // Notificar al vendedor
    await activityService.notify(
      sellerId,
      "CAMBIO_ESTADO",
      propertyId,
      "propiedad",
      `El estado de la propiedad "${property.titulo}" cambió de ${estadoActual} a ${nuevoEstado}`
    );

    const updatedProperty = await propertyRepository.findById(propertyId);
    return { success: true, property: updatedProperty! };
  }

  /**
   * [Endpoint 3.6] da de baja una propiedad (la pasa a estado CANCELADA).
   * No se puede dar de baja si tiene visitas CONFIRMADA pendientes.
   */
  async deleteProperty(sellerId: number, propertyId: number): Promise<{ success: boolean, message?: string }> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return { success: false, message: 'Inmobiliaria no encontrada' };

    const property = await propertyRepository.findById(propertyId);
    if (!property || property.agency.id !== agency.id) return { success: false, message: 'Propiedad no encontrada' };

    // Si ya está CANCELADA, es idempotente
    if (property.estado === 'CANCELADA') {
      return { success: true, message: 'La propiedad ya se encontraba dada de baja' };
    }

    const hasConfirmedVisits = await propertyRepository.hasConfirmedVisits(propertyId);
    if (hasConfirmedVisits) {
      return { success: false, message: 'No se puede dar de baja la propiedad porque tiene visitas CONFIRMADA pendientes' };
    }

    // La baja equivale a pasarla a CANCELADA, registrando el log
    await propertyRepository.updateProperty(propertyId, { estado: 'CANCELADA' } as Partial<Property>);

    await propertyRepository.createStatusLog({
      property: { id: propertyId } as Property,
      estadoViejo: property.estado,
      estadoNuevo: 'CANCELADA'
    });

    return { success: true };
  }
  // ==========================================
  // FOTOS
  // ==========================================

  async getPhotos(sellerId: number, propertyId: number) {
    const property = await this.getSellerPropertyById(sellerId, propertyId);
    if (!property) return null;
    return propertyRepository.findPhotosByPropertyId(propertyId);
  }

  async addPhoto(sellerId: number, propertyId: number, data: any) {
    const property = await this.getSellerPropertyById(sellerId, propertyId);
    if (!property) return { success: false, message: 'Propiedad no encontrada' };

    if (data.esPortada) {
      await propertyRepository.clearCoverPhotos(propertyId);
    }

    const newPhoto = await propertyRepository.createPhoto({
      property: { id: propertyId } as Property,
      url: data.url,
      orden: data.orden,
      esPortada: data.esPortada
    });

    return { success: true, photo: newPhoto };
  }

  async updatePhoto(sellerId: number, propertyId: number, photoId: number, data: any) {
    const property = await this.getSellerPropertyById(sellerId, propertyId);
    if (!property) return { success: false, message: 'Propiedad no encontrada' };

    const photo = await propertyRepository.findPhotoById(photoId);
    if (!photo || photo.property.id !== propertyId) {
      return { success: false, message: 'Foto no encontrada' };
    }

    if (data.esPortada) {
      await propertyRepository.clearCoverPhotos(propertyId);
    }

    await propertyRepository.updatePhoto(photoId, data);
    return { success: true, message: 'Foto actualizada exitosamente' };
  }

  async deletePhoto(sellerId: number, propertyId: number, photoId: number) {
    const property = await this.getSellerPropertyById(sellerId, propertyId);
    if (!property) return { success: false, message: 'Propiedad no encontrada' };

    const photo = await propertyRepository.findPhotoById(photoId);
    if (!photo || photo.property.id !== propertyId) {
      return { success: false, message: 'Foto no encontrada' };
    }

    if (property.estado === 'PUBLICADA') {
      const count = await propertyRepository.countPhotosByPropertyId(propertyId);
      if (count <= 1) {
        return { success: false, message: 'No se puede eliminar la última foto porque la propiedad está PUBLICADA' };
      }
    }

    await propertyRepository.deletePhoto(photoId);
    return { success: true, message: 'Foto eliminada exitosamente' };
  }
}

export const propertyService = new PropertyService();