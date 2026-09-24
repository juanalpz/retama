/** 
 * @fileoverview repositorio de consultas sql para la tabla visitas.
 */

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Visit } from "../entities/visit.entity";
import { VisitDTO } from "../schemas/visit.schema";
import { Property } from "../entities/property.entity";

class VisitRepository {
  private get repository(): Repository<Visit> {
    return AppDataSource.getRepository(Visit);
  }

  /**
   * crea y guarda un nuevo registro de visita propuesta para una propiedad.
   * 
   * @param {VisitDTO & { property: Property }} data - datos de la visita y relacion a la propiedad
   * @returns {Promise<Visit>} la visita recien creada
   * 
   * @example
   * visitrepository.create({ nombrevisitante: 'maria', fechapropuesta: '2026-12-01', property: propEntity })
   */
  create(data: VisitDTO & { property: Property }): Promise<Visit> {
    const visitData = {
      ...data,
      fechaPropuesta: data.fechaPropuesta ? new Date(data.fechaPropuesta) : null,
    };
    const visit = this.repository.create(visitData);
    return this.repository.save(visit);
  }
}

export const visitRepository = new VisitRepository();
