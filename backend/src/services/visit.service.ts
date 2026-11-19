/**
 * reglas de negocio de las solicitudes de visita.
 */

import { visitRepository } from "../repositories/visit.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { Visit } from "../entities/visit.entity";
import { VisitDTO, VISIT_TRANSITIONS } from "../schemas/visit.schema";
import { activityService } from "./activity.service";
import { ServiceResult, fail } from "../utils/result.utils";

class VisitService {
  /**
   * visitas recibidas por el vendedor, de todas sus propiedades o de una sola.
   *
   * @param sellerId id del vendedor autenticado
   * @param propertyId id de una propiedad para filtrar (opcional)
   * @param estado estado por el que filtrar (opcional)
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado de visitas, la mas reciente primero
   */
  async getVisitsBySeller(sellerId: number, propertyId?: number, estado?: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<Visit>> {
    return visitRepository.findPaginatedBySeller(sellerId, propertyId, estado, page, limit);
  }

  /**
   * cambia el estado de una visita siguiendo su maquina de estados:
   *   pendiente  -> confirmada, rechazada, cancelada
   *   confirmada -> realizada, cancelada, rechazada
   * realizada, cancelada y rechazada son finales.
   *
   * @param visitId id de la visita
   * @param sellerId id del vendedor autenticado
   * @param estado estado al que se quiere pasar
   * @returns { success: true, visit }, o un error 404 si no existe, 403 si es de otro vendedor, o 400 si la transicion no es valida
   */
  async updateVisitState(visitId: number, sellerId: number, estado: string): Promise<ServiceResult<{ visit: Visit }>> {
    const visit = await visitRepository.findByIdWithRelations(visitId);

    if (!visit) return fail(404, 'Solicitud de visita no encontrada');

    if (visit.property.agency.seller.id !== sellerId) {
      return fail(403, 'La visita no pertenece a una propiedad de tu inmobiliaria');
    }

    const permitidas = VISIT_TRANSITIONS[visit.estado];
    if (!permitidas) {
      return fail(400, `Una visita en estado ${visit.estado} no admite más cambios`);
    }
    if (!permitidas.includes(estado)) {
      return fail(400, `Transición no permitida: ${visit.estado} → ${estado}. Transiciones válidas: ${permitidas.join(', ')}`);
    }

    await visitRepository.updateEstado(visitId, estado);

    const updated = await visitRepository.findByIdWithRelations(visitId);
    return { success: true, visit: this.toPublic(updated!) };
  }

  /**
   * crea una solicitud de visita y le avisa al vendedor en su feed de actividad.
   * solo se puede pedir visita a una propiedad publicada.
   *
   * @param propertyId id de la propiedad
   * @param data datos ya validados: nombreVisitante, telefonoVisitante, fechaPropuesta, y opcionales apellidoVisitante y mensajeAsociado
   * @returns { success: true, visit }, o un error 404 si la propiedad no existe o 409 si no esta publicada
   */
  async create(propertyId: number, data: VisitDTO): Promise<ServiceResult<{ visit: Visit }>> {
    const property = await propertyRepository.findById(propertyId);
    if (!property || property.estado === 'BORRADOR') {
      return fail(404, 'Propiedad no encontrada');
    }

    if (property.estado !== 'PUBLICADA') {
      return fail(409, 'Solo se pueden pedir visitas a propiedades publicadas');
    }

    const visit = await visitRepository.create({ ...data, property });

    if (property.agency && property.agency.seller) {
      const nombre = [data.nombreVisitante, data.apellidoVisitante].filter(Boolean).join(' ');
      await activityService.notify(
        property.agency.seller.id,
        "SOLICITUD_VISITA",
        visit.id,
        "visita",
        `Nueva solicitud de visita de ${nombre} en la propiedad: ${property.titulo}`
      );
    }

    return { success: true, visit: this.toPublic(visit) };
  }

  /**
   * recorta la propiedad anidada en una visita para la respuesta: deja solo su
   * id y su titulo, sin arrastrar la inmobiliaria ni el vendedor.
   *
   * @param visit visita con su propiedad cargada
   * @returns la misma visita con property reducida a { id, titulo }
   */
  private toPublic(visit: Visit): Visit {
    const { property, ...rest } = visit as any;
    return {
      ...rest,
      property: property ? { id: property.id, titulo: property.titulo } : undefined,
    } as Visit;
  }
}

export const visitService = new VisitService();
