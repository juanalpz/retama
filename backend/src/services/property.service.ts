/** 
 * @fileoverview servicio para la gestion de propiedades del catalogo.
 */

import { propertyRepository, PropertyFilters, PaginatedResult } from "../repositories/property.repository";
import { Property } from "../entities/property.entity";

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
}

export const propertyService = new PropertyService();