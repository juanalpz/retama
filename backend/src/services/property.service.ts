/**
 * @fileoverview Servicio de ABM y Ciclo de Vida de Propiedades.
 * Maneja la lógica de negocio para crear, editar, listar, cambiar el estado
 * y eliminar propiedades de una inmobiliaria. Implementa las reglas de negocio
 * del dominio: validación de transiciones de estado, restricciones con visitas
 * confirmadas, y asociación de tags (amenities).
 */

import { agencyRepository } from '../repositories/agency.repository';
import { propertyRepository } from '../repositories/property.repository';
import { VALID_TRANSITIONS } from '../schemas/property.schema';

// ==========================================
// 3. ABM Y CICLO DE VIDA DE PROPIEDADES
// ==========================================

// ----------------------------------------------------------------------------------------------------

/**
 * Mapea el string del tipo de propiedad a su ID numérico almacenado en la base de datos.
 * Convención interna: CASA=1, DEPARTAMENTO=2, TERRENO=3, COMERCIAL=4.
 */
const tipoToPropiedadId: Record<string, number> = {
  CASA: 1,
  DEPARTAMENTO: 2,
  TERRENO: 3,
  COMERCIAL: 4,
};

/**
 * Mapeo inverso: de ID numérico al string legible del tipo de propiedad.
 */
const propiedadIdToTipo: Record<number, string> = {
  1: 'CASA',
  2: 'DEPARTAMENTO',
  3: 'TERRENO',
  4: 'COMERCIAL',
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.1] Crea una nueva propiedad en estado BORRADOR asociada a la inmobiliaria del vendedor.
 * Valida que la inmobiliaria del vendedor exista, resuelve el tipo de propiedad a su ID numérico,
 * y opcionalmente asocia tags (amenities) a la propiedad.
 *
 * @async
 * @param {number} sellerId - Identificador único del vendedor autenticado.
 * @param {any} data - Datos de la propiedad provenientes del body ya validados por Zod.
 * @returns {Promise<Object | null>} La propiedad creada con sus tags, o `null` si la inmobiliaria no existe.
 *
 * @example
 * const property = await createProperty(1, { titulo: "Depto 2 amb", operacion: "ALQUILER", ... });
 */
export const createProperty = async (sellerId: number, data: any) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;

  const { tags, tipoPropiedad, ...propertyData } = data;

  // Crear la propiedad en estado BORRADOR
  const newProperty = await propertyRepository.create({
    ...propertyData,
    idTipoPropiedad: tipoPropiedad ? tipoToPropiedadId[tipoPropiedad] : null,
    agency,
    estado: 'BORRADOR'
  });

  // Registrar el estado inicial en el historial
  await propertyRepository.createStatusLog({
    property: newProperty,
    estadoViejo: '',
    estadoNuevo: 'BORRADOR'
  });

  // Asociar tags si se proporcionaron
  let associatedTags: any[] = [];
  if (tags && tags.length > 0) {
    const foundTags = await propertyRepository.findTagsByIds(tags);
    if (foundTags.length > 0) {
      const propertyTags = foundTags.map(tag => ({
        property: newProperty,
        tag
      }));
      await propertyRepository.createPropertyTags(propertyTags);
      associatedTags = foundTags.map(t => ({ id: t.id, tag: t.tag }));
    }
  }

  return {
    id: newProperty.id,
    titulo: newProperty.titulo,
    descripcion: newProperty.descripcion,
    tipoPropiedad: newProperty.idTipoPropiedad ? propiedadIdToTipo[newProperty.idTipoPropiedad] : null,
    operacion: newProperty.operacion,
    precio: newProperty.precio,
    moneda: newProperty.moneda,
    direccionLinea1: newProperty.direccionLinea1,
    barrioZona: newProperty.barrioZona,
    superficieCubiertaM2: newProperty.superficieCubiertaM2,
    superficieTotalM2: newProperty.superficieTotalM2,
    ambientes: newProperty.ambientes,
    dormitorios: newProperty.dormitorios,
    banios: newProperty.banios,
    estado: newProperty.estado,
    tags: associatedTags,
    createdAt: newProperty.createdAt,
    updatedAt: newProperty.updatedAt
  };
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.2] Recupera todas las propiedades de la inmobiliaria del vendedor autenticado.
 * Incluye para cada propiedad sus fotos y tags asociados.
 *
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @returns {Promise<Object[] | null>} Lista de propiedades con sus relaciones, o `null` si la inmobiliaria no existe.
 *
 * @example
 * const properties = await getPropertiesBySellerId(1);
 */
export const getPropertiesBySellerId = async (sellerId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;

  const properties = await propertyRepository.findByAgencyId(agency.id);

  // Hidratar cada propiedad con sus fotos y tags
  const result = await Promise.all(
    properties.map(async (property) => {
      const [photos, propertyTags] = await Promise.all([
        propertyRepository.findPhotosByPropertyId(property.id),
        propertyRepository.findTagsByPropertyId(property.id)
      ]);

      return {
        id: property.id,
        titulo: property.titulo,
        descripcion: property.descripcion,
        tipoPropiedad: property.idTipoPropiedad ? propiedadIdToTipo[property.idTipoPropiedad] : null,
        operacion: property.operacion,
        precio: property.precio,
        moneda: property.moneda,
        direccionLinea1: property.direccionLinea1,
        barrioZona: property.barrioZona,
        superficieCubiertaM2: property.superficieCubiertaM2,
        superficieTotalM2: property.superficieTotalM2,
        ambientes: property.ambientes,
        dormitorios: property.dormitorios,
        banios: property.banios,
        estado: property.estado,
        fotos: photos.map(f => ({ id: f.id, url: f.url, orden: f.orden, esPortada: f.esPortada })),
        tags: propertyTags.map(pt => ({ id: pt.tag.id, tag: pt.tag.tag })),
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      };
    })
  );

  return result;
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.3] Obtiene el detalle completo de una propiedad específica del vendedor.
 * Incluye fotos, tags e historial de cambios de estado.
 * Valida que la propiedad pertenezca a la inmobiliaria del vendedor autenticado.
 *
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {number} propertyId - Identificador único de la propiedad.
 * @returns {Promise<{found: boolean, owned?: boolean, property?: Object}>} Resultado con flags de estado.
 *
 * @example
 * const result = await getPropertyDetail(1, 5);
 */
export const getPropertyDetail = async (sellerId: number, propertyId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return { found: false };

  const property = await propertyRepository.findByIdWithAgency(propertyId);
  if (!property) return { found: false };

  // Verificar que la propiedad pertenezca a la inmobiliaria del vendedor
  if (property.agency.id !== agency.id) {
    return { found: true, owned: false };
  }

  const [photos, propertyTags, statusHistory] = await Promise.all([
    propertyRepository.findPhotosByPropertyId(property.id),
    propertyRepository.findTagsByPropertyId(property.id),
    propertyRepository.findStatusHistoryByPropertyId(property.id)
  ]);

  return {
    found: true,
    owned: true,
    property: {
      id: property.id,
      titulo: property.titulo,
      descripcion: property.descripcion,
      tipoPropiedad: property.idTipoPropiedad ? propiedadIdToTipo[property.idTipoPropiedad] : null,
      operacion: property.operacion,
      precio: property.precio,
      moneda: property.moneda,
      direccionLinea1: property.direccionLinea1,
      barrioZona: property.barrioZona,
      superficieCubiertaM2: property.superficieCubiertaM2,
      superficieTotalM2: property.superficieTotalM2,
      ambientes: property.ambientes,
      dormitorios: property.dormitorios,
      banios: property.banios,
      estado: property.estado,
      fotos: photos.map(f => ({ id: f.id, url: f.url, orden: f.orden, esPortada: f.esPortada })),
      tags: propertyTags.map(pt => ({ id: pt.tag.id, tag: pt.tag.tag })),
      historialEstados: statusHistory.map(h => ({
        id: h.id,
        estadoViejo: h.estadoViejo,
        estadoNuevo: h.estadoNuevo,
        fechaCambio: h.fechaCambio
      })),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    }
  };
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.4] Edita los datos de una propiedad existente del vendedor.
 * 
 * Reglas de negocio aplicadas:
 * - La propiedad no puede estar en estado terminal (VENDIDA, ALQUILADA, CANCELADA).
 * - Si la propiedad tiene visitas CONFIRMADA pendientes, no se permite la edición.
 * - Si se envían tags, se reemplazan todos los existentes por los nuevos.
 *
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {number} propertyId - Identificador único de la propiedad a editar.
 * @param {any} data - Datos a actualizar, ya validados por Zod.
 * @returns {Promise<{success: boolean, message?: string, property?: Object}>} Resultado de la operación.
 *
 * @example
 * const result = await updateProperty(1, 5, { precio: 500, moneda: "USD" });
 */
export const updateProperty = async (sellerId: number, propertyId: number, data: any) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return { success: false, message: 'Inmobiliaria no encontrada' };

  const property = await propertyRepository.findByIdWithAgency(propertyId);
  if (!property) return { success: false, message: 'Propiedad no encontrada' };

  // Verificar pertenencia
  if (property.agency.id !== agency.id) {
    return { success: false, message: 'La propiedad no pertenece a tu inmobiliaria' };
  }

  // No se pueden editar propiedades en estados terminales
  const terminalStates = ['VENDIDA', 'ALQUILADA', 'CANCELADA'];
  if (terminalStates.includes(property.estado)) {
    return { success: false, message: `No se puede editar una propiedad en estado ${property.estado}` };
  }

  // Regla de negocio: no editar si tiene visitas confirmadas pendientes
  const hasVisits = await propertyRepository.hasConfirmedVisits(property.id);
  if (hasVisits) {
    return { success: false, message: 'No se puede editar la propiedad porque tiene visitas confirmadas pendientes' };
  }

  // Separar los tags del resto de los datos
  const { tags, tipoPropiedad, ...fieldsToUpdate } = data;

  // Resolver el tipo de propiedad a su ID numérico
  const dataToUpdate: any = { ...fieldsToUpdate };
  if (tipoPropiedad !== undefined) {
    dataToUpdate.idTipoPropiedad = tipoToPropiedadId[tipoPropiedad] ?? null;
  }

  // Actualizar campos permitidos
  if (Object.keys(dataToUpdate).length > 0) {
    await propertyRepository.update(property.id, dataToUpdate);
  }

  // Reemplazar tags si se proporcionaron
  if (tags !== undefined) {
    await propertyRepository.deleteTagsByPropertyId(property.id);

    if (tags.length > 0) {
      const foundTags = await propertyRepository.findTagsByIds(tags);
      if (foundTags.length > 0) {
        const propertyTags = foundTags.map(tag => ({
          property: { id: property.id } as any,
          tag
        }));
        await propertyRepository.createPropertyTags(propertyTags);
      }
    }
  }

  // Re-consultar y devolver la propiedad actualizada
  const result = await getPropertyDetail(sellerId, propertyId);
  return { success: true, property: result.property };
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.5] Cambia el estado de una propiedad siguiendo la máquina de estados del dominio.
 * 
 * Transiciones válidas:
 * ```
 * BORRADOR  → PUBLICADA, CANCELADA
 * PUBLICADA → RESERVADA, PAUSADA, CANCELADA
 * PAUSADA   → PUBLICADA, CANCELADA
 * RESERVADA → VENDIDA, ALQUILADA, CANCELADA
 * ```
 * 
 * Cada cambio de estado queda registrado en el historial (estado anterior, estado nuevo,
 * fecha y hora) para el reporte de "tiempo promedio en mercado" del dashboard.
 *
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {number} propertyId - Identificador de la propiedad.
 * @param {string} nuevoEstado - Estado destino solicitado.
 * @returns {Promise<{success: boolean, message?: string, property?: Object}>} Resultado de la operación.
 *
 * @example
 * const result = await changePropertyStatus(1, 5, "PUBLICADA");
 */
export const changePropertyStatus = async (sellerId: number, propertyId: number, nuevoEstado: string) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return { success: false, message: 'Inmobiliaria no encontrada' };

  const property = await propertyRepository.findByIdWithAgency(propertyId);
  if (!property) return { success: false, message: 'Propiedad no encontrada' };

  // Verificar pertenencia
  if (property.agency.id !== agency.id) {
    return { success: false, message: 'La propiedad no pertenece a tu inmobiliaria' };
  }

  // Validar que la transición sea permitida
  const estadoActual = property.estado;
  const transicionesPermitidas = VALID_TRANSITIONS[estadoActual];

  if (!transicionesPermitidas) {
    return { success: false, message: `El estado actual "${estadoActual}" no admite más transiciones` };
  }

  if (!transicionesPermitidas.includes(nuevoEstado)) {
    return {
      success: false,
      message: `No se puede pasar de "${estadoActual}" a "${nuevoEstado}". Transiciones permitidas: ${transicionesPermitidas.join(', ')}`
    };
  }

  // Registrar en el historial ANTES de actualizar
  await propertyRepository.createStatusLog({
    property,
    estadoViejo: estadoActual,
    estadoNuevo: nuevoEstado
  });

  // Actualizar el estado
  await propertyRepository.update(property.id, { estado: nuevoEstado });

  // Re-consultar y devolver la propiedad actualizada
  const result = await getPropertyDetail(sellerId, propertyId);
  return { success: true, property: result.property };
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.6] Elimina una propiedad del vendedor autenticado.
 * 
 * Reglas de negocio aplicadas:
 * - La propiedad debe pertenecer a la inmobiliaria del vendedor.
 * - No se puede eliminar si tiene visitas en estado 'CONFIRMADA' pendientes.
 *
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {number} propertyId - Identificador de la propiedad a eliminar.
 * @returns {Promise<{success: boolean, message?: string}>} Resultado de la operación.
 *
 * @example
 * const result = await deleteProperty(1, 5);
 */
export const deleteProperty = async (sellerId: number, propertyId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return { success: false, message: 'Inmobiliaria no encontrada' };

  const property = await propertyRepository.findByIdWithAgency(propertyId);
  if (!property) return { success: false, message: 'Propiedad no encontrada' };

  // Verificar pertenencia
  if (property.agency.id !== agency.id) {
    return { success: false, message: 'La propiedad no pertenece a tu inmobiliaria' };
  }

  // Regla de negocio: no eliminar si tiene visitas confirmadas pendientes
  const hasVisits = await propertyRepository.hasConfirmedVisits(property.id);
  if (hasVisits) {
    return { success: false, message: 'No se puede eliminar la propiedad porque tiene visitas confirmadas pendientes' };
  }

  await propertyRepository.deleteProperty(property.id);
  return { success: true };
};