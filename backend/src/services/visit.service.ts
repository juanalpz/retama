/** 
 * @fileoverview servicio para la logica de negocio de turnos de visitas.
 */

import { visitRepository } from "../repositories/visit.repository";
import { propertyRepository } from "../repositories/property.repository";
import { Visit } from "../entities/visit.entity";
import { VisitDTO } from "../schemas/visit.schema";

class VisitService {
  /**
   * crea una visita validando primero la existencia de la propiedad solicitada.
   * 
   * @async
   * @param {number} propertyId - id de la propiedad a visitar
   * @param {VisitDTO} data - datos del visitante y fecha futura
   * @returns {Promise<Visit | null>} turno creado o null si la propiedad no existe
   * 
   * @example
   * visitservice.create(5, { nombrevisitante: 'laura', apellidovisitante: 'gomez' })
   */
  async create(propertyId: number, data: VisitDTO): Promise<Visit | null> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) {
      return null;
    }
    return visitRepository.create({ ...data, property });
  }
}

export const visitService = new VisitService();
