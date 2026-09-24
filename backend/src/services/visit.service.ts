/** 
 * @fileoverview servicio para la logica de negocio de turnos de visitas.
 */

import { visitRepository } from "../repositories/visit.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { Visit } from "../entities/visit.entity";
import { VisitDTO } from "../schemas/visit.schema";
import { activityService } from "./activity.service";

class VisitService {
  /**
   * obtiene las visitas de las propiedades de un vendedor con filtros
   * 
   * @async
   * @param {number} sellerId - id del vendedor
   * @param {number | undefined} propertyId - id de la propiedad
   * @param {string | undefined} estado - estado de la visita
   * @param {number} page - pagina
   * @param {number} limit - limite
   * @returns {Promise<PaginatedResult<Visit>>}
   */
  async getVisitsBySeller(sellerId: number, propertyId?: number, estado?: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<Visit>> {
    return visitRepository.findPaginatedBySeller(sellerId, propertyId, estado, page, limit);
  }

  /**
   * cambia el estado de una visita si pertenece al vendedor
   * 
   * @async
   * @param {number} visitId - id de la visita
   * @param {number} sellerId - id del vendedor logueado
   * @param {string} estado - estado nuevo
   * @returns {Promise<Visit | null | false>} retorna la visita, null si no existe, o false si no pertenece al vendedor
   */
  async updateVisitState(visitId: number, sellerId: number, estado: string): Promise<Visit | null | false> {
    const visit = await visitRepository.findByIdWithRelations(visitId);
    
    if (!visit) return null; // No existe
    if (visit.property.agency.seller.id !== sellerId) return false; // Pertenece a otra agencia

    await visitRepository.updateEstado(visitId, estado);
    return visitRepository.findByIdWithRelations(visitId);
  }
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
    const visit = await visitRepository.create({ ...data, property });

    // Generar notificación
    if (property.agency && property.agency.seller) {
      await activityService.notify(
        property.agency.seller.id,
        "SOLICITUD_VISITA",
        visit.id,
        "visita",
        `Nueva solicitud de visita de ${data.nombreVisitante} ${data.apellidoVisitante} en la propiedad: ${property.titulo}`
      );
    }

    return visit;
  }
}

export const visitService = new VisitService();
