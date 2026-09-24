/** 
 * @fileoverview repositorio de consultas sql para la tabla inmobiliarias.
 * contiene endpoints publicos (catalogo) y privados (dashboard vendedor).
 */
import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Agency } from "../entities/agency.entity";
import { AgencyPhone } from "../entities/agency-phone.entity";
import { AgencyEmail } from "../entities/agency-email.entity";
import { PaginatedResult } from "./property.repository";

// =================================================================================
// ENDPOINTS: CATÁLOGO PÚBLICO DE INMOBILIARIAS
// =================================================================================


class AgencyRepository {
  private get repository(): Repository<Agency> {
    return AppDataSource.getRepository(Agency);
  }

  private get phoneRepository(): Repository<AgencyPhone> {
    return AppDataSource.getRepository(AgencyPhone);
  }
  
  private get emailRepository(): Repository<AgencyEmail> {
    return AppDataSource.getRepository(AgencyEmail);
  }

  // Métodos públicos
 
  /**
   * busca una inmobiliaria por su id junto con sus telefonos y correos de contacto.
   * 
   * @param {number} id - id de la inmobiliaria
   * @returns {Promise<Agency | null>} entidad encontrada o null
   * 
   * @example
   * agencyrepository.findbyid(1)
   */
  findById(id: number): Promise<Agency | null> {
    return this.repository.findOne({ where: { id }, relations: ['seller', 'telefonos', 'correos'] });
  }

  /**
   * lista agencias con paginacion y busqueda por nombre.
   * 
   * @async
   * @param {string | undefined} nombreFantasia - busqueda parcial por nombre (opcional)
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Agency>>} agencias paginadas
   */
  async findPaginated(nombreFantasia?: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<Agency>> {
    const query = this.repository.createQueryBuilder('agency')
      .leftJoinAndSelect('agency.telefonos', 'telefonos')
      .leftJoinAndSelect('agency.correos', 'correos');

    if (nombreFantasia) {
      query.andWhere('agency.nombreFantasia ILIKE :nombre', { nombre: `%${nombreFantasia}%` });
    }

    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Métodos privados

  findBySellerId(sellerId: number): Promise<Agency | null> {
    return this.repository.findOne({ where: { seller: { id: sellerId } } });
  }

  findPhonesByAgencyId(agencyId: number): Promise<AgencyPhone[]> {
    return this.phoneRepository.find({ where: { agency: { id: agencyId } } });
  }

  findEmailsByAgencyId(agencyId: number): Promise<AgencyEmail[]> {
    return this.emailRepository.find({ where: { agency: { id: agencyId } } });
  }

  update(id: number, data: Partial<Agency>): Promise<import('typeorm').UpdateResult> {
    return this.repository.update(id, data);
  }

  deleteAgency(id: number): Promise<import('typeorm').DeleteResult> {
    return this.repository.delete(id);
  }

  createPhone(phone: Partial<AgencyPhone>): Promise<AgencyPhone> {
    return this.phoneRepository.save(phone);
  }

  deletePhone(id: number): Promise<import('typeorm').DeleteResult> {
    return this.phoneRepository.delete(id);
  }

  findPhoneById(id: number): Promise<AgencyPhone | null> {
    return this.phoneRepository.findOne({ where: { id }, relations: ['agency'] });
  }

  createEmail(email: Partial<AgencyEmail>): Promise<AgencyEmail> {
    return this.emailRepository.save(email);
  }

  deleteEmail(id: number): Promise<import('typeorm').DeleteResult> {
    return this.emailRepository.delete(id);
  }

  findEmailById(id: number): Promise<AgencyEmail | null> {
    return this.emailRepository.findOne({ where: { id }, relations: ['agency'] });
  }
}

export const agencyRepository = new AgencyRepository();
