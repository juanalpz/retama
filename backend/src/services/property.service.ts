/**
 * reglas de negocio de las propiedades: catalogo publico, abm del vendedor,
 * ciclo de vida (maquina de estados) y galeria de fotos.
 */

import { propertyRepository, PropertyFilters, PaginatedResult } from "../repositories/property.repository";
import { Property } from "../entities/property.entity";
import { PropertyPhoto } from "../entities/property-photo.entity";
import { Tag } from "../entities/tag.entity";
import * as agencyServicePrivate from "./agency.service";
import { VALID_TRANSITIONS } from "../schemas/property.schema";
import { activityService } from "./activity.service";
import { tipoToId } from "../utils/property-type.utils";
import { ServiceResult, fail } from "../utils/result.utils";

// estados en los que ya no se pueden editar los datos principales
const ESTADOS_FINALES = ['VENDIDA', 'ALQUILADA', 'CANCELADA'];

class PropertyService {
  // ------------------------------------------------------------------
  // catalogo publico
  // ------------------------------------------------------------------

  /**
   * detalle publico de una propiedad.
   * un borrador todavia no fue publicado, asi que para el publico no existe.
   * el resto de los estados si se muestra: el enunciado pide que una propiedad
   * vendida, alquilada o cancelada siga admitiendo consultas.
   *
   * @param id id de la propiedad
   * @returns la propiedad con fotos, tags e inmobiliaria, o null si no existe o es un borrador
   */
  async getById(id: number): Promise<Property | null> {
    const property = await propertyRepository.findById(id);
    if (!property || property.estado === 'BORRADOR') return null;
    return property;
  }

  /**
   * listado publico con filtros, orden y paginado. solo devuelve propiedades publicadas.
   *
   * @param filters filtros, orden y paginado ya leidos de la url (ver PropertyFilters)
   * @returns un resultado paginado { data, total, page, limit, totalPages }
   */
  getAll(filters: PropertyFilters): Promise<PaginatedResult<Property>> {
    return propertyRepository.findFiltered(filters);
  }

  /**
   * lista los tags (amenities) para armar los filtros y el formulario de propiedad.
   *
   * @returns todos los tags, ordenados por nombre
   */
  getTags(): Promise<Tag[]> {
    return propertyRepository.findAllTags();
  }

  // ------------------------------------------------------------------
  // abm del vendedor
  // ------------------------------------------------------------------

  /**
   * crea una propiedad para la inmobiliaria del vendedor. siempre arranca en borrador.
   * si el tipo es terreno no guarda superficie cubierta, ambientes, dormitorios ni baños.
   *
   * @param sellerId id del vendedor autenticado
   * @param data datos de la propiedad ya validados por createPropertySchema
   * @returns la propiedad creada con sus relaciones, o null si el vendedor no tiene inmobiliaria
   */
  async createProperty(sellerId: number, data: any): Promise<Property | null> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return null;

    const esTerreno = data.tipoPropiedad === 'TERRENO';

    const propertyData: Partial<Property> = {
      agency: { id: agency.id } as any,
      titulo: data.titulo,
      descripcion: data.descripcion,
      idTipoPropiedad: tipoToId(data.tipoPropiedad),
      operacion: data.operacion,
      precio: data.precio,
      moneda: data.moneda,
      direccionLinea1: data.direccionLinea1,
      barrioZona: data.barrioZona,
      superficieTotalM2: data.superficieTotalM2,
      // superficie cubierta, ambientes, dormitorios y baños no aplican a un terreno
      superficieCubiertaM2: esTerreno ? null : data.superficieCubiertaM2 ?? null,
      ambientes: esTerreno ? null : data.ambientes ?? null,
      dormitorios: esTerreno ? null : data.dormitorios ?? null,
      banios: esTerreno ? null : data.banios ?? null,
      antiguedad: data.antiguedad ?? null,
      estado: "BORRADOR"
    };

    const newProperty = await propertyRepository.createProperty(propertyData);

    await this.replaceTags(newProperty, data.tags);

    return propertyRepository.findById(newProperty.id);
  }

  /**
   * propiedades de la inmobiliaria del vendedor, en cualquier estado.
   *
   * @param sellerId id del vendedor autenticado
   * @param estado estado por el que filtrar (opcional)
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado de propiedades, o null si el vendedor no tiene inmobiliaria
   */
  async getSellerProperties(sellerId: number, estado: string | undefined, page: number, limit: number): Promise<PaginatedResult<Property> | null> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return null;
    return propertyRepository.findAllByAgencyId(agency.id, estado, page, limit);
  }

  /**
   * detalle de una propiedad propia, con su historial de estados en orden cronologico.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @returns la propiedad con historialEstados, o null si no existe o es de otra inmobiliaria
   */
  async getSellerPropertyById(sellerId: number, propertyId: number): Promise<Property | null> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return null;

    property.historialEstados = await propertyRepository.findStatusHistoryByPropertyId(propertyId);
    return property;
  }

  /**
   * edita una propiedad propia. solo modifica los campos que llegan.
   * reglas: no se edita si esta vendida, alquilada o cancelada, ni si tiene
   * visitas confirmadas pendientes. si llegan tags, reemplaza la lista completa.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @param data campos a modificar, ya validados por updatePropertySchema
   * @returns { success: true, property }, o un error 404 si no existe, 409 si no se puede editar, o 400 si queda sin superficie cubierta
   */
  async updateProperty(sellerId: number, propertyId: number, data: any): Promise<ServiceResult<{ property: Property }>> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return fail(404, 'Propiedad no encontrada');

    if (ESTADOS_FINALES.includes(property.estado)) {
      return fail(409, `No se puede editar una propiedad en estado ${property.estado}`);
    }

    const hasConfirmedVisits = await propertyRepository.hasConfirmedVisits(propertyId);
    if (hasConfirmedVisits) {
      return fail(409, 'No se puede editar la propiedad porque tiene visitas confirmadas pendientes');
    }

    const updateData: Partial<Property> = {};
    if (data.titulo !== undefined) updateData.titulo = data.titulo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.tipoPropiedad !== undefined) updateData.idTipoPropiedad = tipoToId(data.tipoPropiedad);
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
    if (data.antiguedad !== undefined) updateData.antiguedad = data.antiguedad;

    // se mira el tipo que va a quedar despues de la edicion
    const tipoFinal = updateData.idTipoPropiedad ?? property.idTipoPropiedad;
    if (tipoFinal === tipoToId('TERRENO')) {
      // un terreno no lleva superficie cubierta, ambientes, dormitorios ni baños
      updateData.superficieCubiertaM2 = null;
      updateData.ambientes = null;
      updateData.dormitorios = null;
      updateData.banios = null;
    } else {
      const cubiertaFinal = updateData.superficieCubiertaM2 !== undefined ? updateData.superficieCubiertaM2 : property.superficieCubiertaM2;
      if (cubiertaFinal === null && (data.tipoPropiedad !== undefined || data.superficieCubiertaM2 !== undefined)) {
        return fail(400, 'La superficie cubierta es obligatoria (salvo para terrenos)');
      }
    }

    if (Object.keys(updateData).length > 0) {
      await propertyRepository.updateProperty(propertyId, updateData);
    }

    // si llegaron tags se reemplaza la lista completa
    if (data.tags !== undefined) {
      await propertyRepository.deleteTagsByPropertyId(propertyId);
      await this.replaceTags(property, data.tags);
    }

    const updatedProperty = await propertyRepository.findById(propertyId);
    return { success: true, property: updatedProperty! };
  }

  /**
   * cambia el estado de una propiedad siguiendo la maquina de estados:
   *   borrador  -> publicada, cancelada
   *   publicada -> reservada, pausada, cancelada
   *   pausada   -> publicada, cancelada
   *   reservada -> vendida, alquilada, cancelada
   * vendida, alquilada y cancelada son finales.
   * cada cambio exitoso agrega una fila al historial y avisa al vendedor.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @param nuevoEstado estado al que se quiere pasar
   * @returns { success: true, property }, o un error 404 si no existe, 400 si la transicion no es valida, o 409 si falta una foto para publicar o hay visitas confirmadas al cancelar
   */
  async changePropertyStatus(sellerId: number, propertyId: number, nuevoEstado: string): Promise<ServiceResult<{ property: Property }>> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return fail(404, 'Propiedad no encontrada');

    const estadoActual = property.estado;

    const transicionesPermitidas = VALID_TRANSITIONS[estadoActual];
    if (!transicionesPermitidas) {
      return fail(400, `La propiedad en estado ${estadoActual} no admite más transiciones`);
    }

    if (!transicionesPermitidas.includes(nuevoEstado)) {
      return fail(400, `Transición no permitida: ${estadoActual} → ${nuevoEstado}. Transiciones válidas: ${transicionesPermitidas.join(', ')}`);
    }

    // el cierre tiene que coincidir con la operacion: una venta termina vendida
    // y un alquiler termina alquilada
    if (nuevoEstado === 'VENDIDA' && property.operacion !== 'VENTA') {
      return fail(400, 'Una propiedad en alquiler no se puede marcar como VENDIDA');
    }
    if (nuevoEstado === 'ALQUILADA' && property.operacion !== 'ALQUILER') {
      return fail(400, 'Una propiedad en venta no se puede marcar como ALQUILADA');
    }

    // una propiedad con visitas confirmadas pendientes no se puede dar de baja
    if (nuevoEstado === 'CANCELADA' && await propertyRepository.hasConfirmedVisits(propertyId)) {
      return fail(409, 'No se puede dar de baja la propiedad porque tiene visitas confirmadas pendientes');
    }

    // para publicar hace falta al menos una foto (el enunciado pide galeria con minimo una)
    if (nuevoEstado === 'PUBLICADA') {
      const photos = await propertyRepository.findPhotosByPropertyId(propertyId);
      if (photos.length === 0) {
        return fail(409, 'La propiedad debe tener al menos una foto para ser publicada');
      }
      // si ninguna foto esta marcada como portada se usa la primera
      if (!photos.some(p => p.esPortada)) {
        await propertyRepository.updatePhoto(photos[0].id, { esPortada: true });
      }
    }

    await this.applyStatusChange(sellerId, property, nuevoEstado);

    const updatedProperty = await propertyRepository.findById(propertyId);
    return { success: true, property: updatedProperty! };
  }

  /**
   * da de baja una propiedad: no se borra, pasa a cancelada.
   * solo se puede desde un estado activo (borrador, publicada, pausada o reservada)
   * y si no tiene visitas confirmadas pendientes.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @returns { success: true, message }, o un error 404 si no existe o 409 si no se puede dar de baja
   */
  async deleteProperty(sellerId: number, propertyId: number): Promise<ServiceResult> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return fail(404, 'Propiedad no encontrada');

    // si ya estaba cancelada no hay nada que hacer
    if (property.estado === 'CANCELADA') {
      return { success: true, message: 'La propiedad ya se encontraba dada de baja' };
    }

    // una operacion ya cerrada no se puede cancelar
    if (!VALID_TRANSITIONS[property.estado]) {
      return fail(409, `No se puede dar de baja una propiedad en estado ${property.estado}`);
    }

    const hasConfirmedVisits = await propertyRepository.hasConfirmedVisits(propertyId);
    if (hasConfirmedVisits) {
      return fail(409, 'No se puede dar de baja la propiedad porque tiene visitas confirmadas pendientes');
    }

    await this.applyStatusChange(sellerId, property, 'CANCELADA');
    return { success: true, message: 'Propiedad dada de baja exitosamente' };
  }

  // ------------------------------------------------------------------
  // fotos
  // ------------------------------------------------------------------

  /**
   * fotos de una propiedad propia, ordenadas por el campo orden.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @returns la lista de fotos, o null si la propiedad no existe o es de otra inmobiliaria
   */
  async getPhotos(sellerId: number, propertyId: number): Promise<PropertyPhoto[] | null> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return null;
    return propertyRepository.findPhotosByPropertyId(propertyId);
  }

  /**
   * agrega una foto a la galeria. la primera foto queda como portada aunque no se
   * pida, y si la nueva se marca como portada se desmarca la anterior: asi siempre
   * hay una sola portada.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @param data datos ya validados: url, orden, esPortada
   * @returns { success: true, photo }, o un error 404 si la propiedad no existe o es de otra inmobiliaria
   */
  async addPhoto(sellerId: number, propertyId: number, data: any): Promise<ServiceResult<{ photo: PropertyPhoto }>> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return fail(404, 'Propiedad no encontrada');

    const cantidad = await propertyRepository.countPhotosByPropertyId(propertyId);
    const esPortada = data.esPortada || cantidad === 0;

    if (esPortada) {
      await propertyRepository.clearCoverPhotos(propertyId);
    }

    const newPhoto = await propertyRepository.createPhoto({
      property: { id: propertyId } as Property,
      url: data.url,
      orden: data.orden,
      esPortada
    });

    // no hace falta devolver la propiedad anidada en la foto
    const { property: _omit, ...photo } = newPhoto as any;
    return { success: true, photo };
  }

  /**
   * cambia el orden de una foto o la marca como portada.
   * la portada no se puede desmarcar sola: hay que marcar otra foto como portada.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @param photoId id de la foto
   * @param data campos a modificar: orden, esPortada
   * @returns { success: true, message }, o un error 404 si la foto no existe, 400 si no llega ningun campo, o 409 si se intenta quitar la portada
   */
  async updatePhoto(sellerId: number, propertyId: number, photoId: number, data: any): Promise<ServiceResult> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return fail(404, 'Propiedad no encontrada');

    const photo = await propertyRepository.findPhotoById(photoId);
    if (!photo || photo.property.id !== propertyId) {
      return fail(404, 'Foto no encontrada');
    }

    if (Object.keys(data).length === 0) {
      return fail(400, 'Hay que enviar al menos un campo para editar (orden o esPortada)');
    }

    // la portada no se puede desmarcar sola: hay que marcar otra foto como portada
    if (data.esPortada === false && photo.esPortada) {
      return fail(409, 'Para cambiar la portada, marcá otra foto como portada');
    }

    if (data.esPortada) {
      await propertyRepository.clearCoverPhotos(propertyId);
    }

    await propertyRepository.updatePhoto(photoId, data);
    return { success: true, message: 'Foto actualizada exitosamente' };
  }

  /**
   * elimina una foto. una propiedad publicada no puede quedarse sin fotos.
   * si se borra la portada, la primera foto que queda pasa a ser la portada.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @param photoId id de la foto
   * @returns { success: true, message }, o un error 404 si la foto no existe o 409 si es la ultima foto de una propiedad publicada
   */
  async deletePhoto(sellerId: number, propertyId: number, photoId: number): Promise<ServiceResult> {
    const property = await this.findOwnProperty(sellerId, propertyId);
    if (!property) return fail(404, 'Propiedad no encontrada');

    const photo = await propertyRepository.findPhotoById(photoId);
    if (!photo || photo.property.id !== propertyId) {
      return fail(404, 'Foto no encontrada');
    }

    if (property.estado === 'PUBLICADA') {
      const count = await propertyRepository.countPhotosByPropertyId(propertyId);
      if (count <= 1) {
        return fail(409, 'No se puede eliminar la última foto porque la propiedad está publicada');
      }
    }

    await propertyRepository.deletePhoto(photoId);

    if (photo.esPortada) {
      const restantes = await propertyRepository.findPhotosByPropertyId(propertyId);
      if (restantes.length > 0) {
        await propertyRepository.updatePhoto(restantes[0].id, { esPortada: true });
      }
    }

    return { success: true, message: 'Foto eliminada exitosamente' };
  }

  // ------------------------------------------------------------------
  // helpers internos
  // ------------------------------------------------------------------

  /**
   * busca una propiedad y verifica que sea de la inmobiliaria del vendedor.
   * es el control de permisos de todo el abm: hacia afuera, una propiedad ajena
   * se responde igual que una inexistente (404).
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de la propiedad
   * @returns la propiedad, o null si no existe o es de otra inmobiliaria
   */
  private async findOwnProperty(sellerId: number, propertyId: number): Promise<Property | null> {
    const agency = await agencyServicePrivate.getAgencyProfileBySellerId(sellerId);
    if (!agency) return null;

    const property = await propertyRepository.findById(propertyId);
    if (!property || property.agency.id !== agency.id) return null;

    return property;
  }

  /**
   * asocia tags a una propiedad. los ids que no existen en la base se ignoran.
   *
   * @param property propiedad a la que se le agregan los tags
   * @param tagIds ids de los tags elegidos (opcional)
   * @returns nada
   */
  private async replaceTags(property: Property, tagIds?: number[]): Promise<void> {
    if (!tagIds || tagIds.length === 0) return;

    const tags = await propertyRepository.findTagsByIds(tagIds);
    if (tags.length === 0) return;

    await propertyRepository.createPropertyTags(tags.map(tag => ({ property, tag })));
  }

  /**
   * guarda el nuevo estado, deja el registro en el historial y avisa al vendedor.
   * no valida nada: se llama despues de comprobar que la transicion es valida.
   *
   * @param sellerId id del vendedor, para la notificacion
   * @param property propiedad con su estado actual
   * @param nuevoEstado estado que se le asigna
   * @returns nada
   */
  private async applyStatusChange(sellerId: number, property: Property, nuevoEstado: string): Promise<void> {
    const estadoViejo = property.estado;

    await propertyRepository.updateProperty(property.id, { estado: nuevoEstado } as Partial<Property>);

    await propertyRepository.createStatusLog({
      property: { id: property.id } as Property,
      estadoViejo,
      estadoNuevo: nuevoEstado
    });

    await activityService.notify(
      sellerId,
      "CAMBIO_ESTADO",
      property.id,
      "propiedad",
      `El estado de la propiedad "${property.titulo}" cambió de ${estadoViejo} a ${nuevoEstado}`
    );
  }
}

export const propertyService = new PropertyService();
