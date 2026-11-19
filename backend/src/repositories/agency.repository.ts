/**
 * acceso a datos de inmobiliarias y de sus telefonos y correos de contacto.
 */
import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Agency } from "../entities/agency.entity";
import { AgencyPhone } from "../entities/agency-phone.entity";
import { AgencyEmail } from "../entities/agency-email.entity";
import { PaginatedResult } from "./property.repository";

// =================================================================================
// endpoints: catálogo público de inmobiliarias
// =================================================================================


class AgencyRepository {
  /**
   * @returns el repositorio de typeorm de inmobiliarias. se pide en cada uso porque la conexion todavia no existe cuando se importa el archivo
   */
  private get repository(): Repository<Agency> {
    return AppDataSource.getRepository(Agency);
  }

  /**
   * @returns el repositorio de typeorm de telefonos
   */
  private get phoneRepository(): Repository<AgencyPhone> {
    return AppDataSource.getRepository(AgencyPhone);
  }
  
  /**
   * @returns el repositorio de typeorm de correos
   */
  private get emailRepository(): Repository<AgencyEmail> {
    return AppDataSource.getRepository(AgencyEmail);
  }

  // métodos públicos
 
  /**
   * busca una inmobiliaria con sus datos de contacto.
   * del vendedor solo trae el id (para notificarlo), asi el perfil publico nunca
   * expone su email ni el resto de sus datos.
   *
   * @param id id de la inmobiliaria
   * @returns la inmobiliaria con telefonos, correos y seller { id }, o null si no existe
   */
  findById(id: number): Promise<Agency | null> {
    // del vendedor solo se trae el id (para notificarlo). su email y demas datos
    // no se seleccionan, asi el perfil publico nunca los expone.
    return this.repository.createQueryBuilder('agency')
      .leftJoin('agency.seller', 'seller')
      .addSelect(['seller.id'])
      .leftJoinAndSelect('agency.telefonos', 'telefonos')
      .leftJoinAndSelect('agency.correos', 'correos')
      .where('agency.id = :id', { id })
      .getOne();
  }

  /**
   * listado de inmobiliarias con sus datos de contacto, ordenado por nombre.
   *
   * @param nombreFantasia texto a buscar dentro del nombre, sin distinguir mayusculas (opcional)
   * @param page numero de pagina (por defecto 1)
   * @param limit cantidad por pagina (por defecto 10)
   * @returns un resultado paginado { data, total, page, limit, totalPages }
   */
  async findPaginated(nombreFantasia?: string, page: number = 1, limit: number = 10): Promise<PaginatedResult<Agency>> {
    const query = this.repository.createQueryBuilder('agency')
      .leftJoinAndSelect('agency.telefonos', 'telefonos')
      .leftJoinAndSelect('agency.correos', 'correos');

    if (nombreFantasia) {
      query.andWhere('agency.nombreFantasia ILIKE :nombre', { nombre: `%${nombreFantasia}%` });
    }

    query.orderBy('agency.nombreFantasia', 'ASC');
    const [data, total] = await query.skip((page - 1) * limit).take(limit).getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // métodos privados

  /**
   * indica si otra inmobiliaria ya usa un nombre de fantasia.
   * la comparacion no distingue mayusculas.
   *
   * @param nombreFantasia nombre a verificar
   * @param exceptId id de la inmobiliaria que se esta editando, para no compararla consigo misma
   * @returns true si el nombre ya esta en uso, false si esta libre
   */
  async existsNombreFantasia(nombreFantasia: string, exceptId: number): Promise<boolean> {
    const count = await this.repository.createQueryBuilder('agency')
      .where('LOWER(agency.nombreFantasia) = LOWER(:nombre)', { nombre: nombreFantasia })
      .andWhere('agency.id != :exceptId', { exceptId })
      .getCount();
    return count > 0;
  }

  /**
   * busca la inmobiliaria de un vendedor.
   *
   * @param sellerId id del vendedor
   * @returns la inmobiliaria (sin relaciones), o null si el vendedor no tiene
   */
  findBySellerId(sellerId: number): Promise<Agency | null> {
    return this.repository.findOne({ where: { seller: { id: sellerId } } });
  }

  /**
   * telefonos de una inmobiliaria.
   *
   * @param agencyId id de la inmobiliaria
   * @returns la lista de telefonos
   */
  findPhonesByAgencyId(agencyId: number): Promise<AgencyPhone[]> {
    return this.phoneRepository.find({ where: { agency: { id: agencyId } } });
  }

  /**
   * correos de una inmobiliaria.
   *
   * @param agencyId id de la inmobiliaria
   * @returns la lista de correos
   */
  findEmailsByAgencyId(agencyId: number): Promise<AgencyEmail[]> {
    return this.emailRepository.find({ where: { agency: { id: agencyId } } });
  }

  /**
   * actualiza los campos indicados de una inmobiliaria.
   *
   * @param id id de la inmobiliaria
   * @param data campos a modificar
   * @returns el resultado de la actualizacion de typeorm
   */
  update(id: number, data: Partial<Agency>): Promise<import('typeorm').UpdateResult> {
    return this.repository.update(id, data);
  }

  /**
   * borra una inmobiliaria. por las claves foraneas en cascada, la base borra
   * tambien sus propiedades, reseñas, telefonos y correos.
   *
   * @param id id de la inmobiliaria
   * @returns el resultado del borrado de typeorm
   */
  deleteAgency(id: number): Promise<import('typeorm').DeleteResult> {
    return this.repository.delete(id);
  }

  /**
   * guarda un telefono nuevo.
   *
   * @param phone telefono, tipo y la inmobiliaria a la que pertenece
   * @returns el telefono guardado, con su id
   */
  createPhone(phone: Partial<AgencyPhone>): Promise<AgencyPhone> {
    return this.phoneRepository.save(phone);
  }

  /**
   * borra un telefono.
   *
   * @param id id del telefono
   * @returns el resultado del borrado de typeorm
   */
  deletePhone(id: number): Promise<import('typeorm').DeleteResult> {
    return this.phoneRepository.delete(id);
  }

  /**
   * busca un telefono con su inmobiliaria, para verificar a quien pertenece.
   *
   * @param id id del telefono
   * @returns el telefono con su inmobiliaria, o null si no existe
   */
  findPhoneById(id: number): Promise<AgencyPhone | null> {
    return this.phoneRepository.findOne({ where: { id }, relations: ['agency'] });
  }

  /**
   * guarda un correo nuevo.
   *
   * @param email correo, tipo y la inmobiliaria a la que pertenece
   * @returns el correo guardado, con su id
   */
  createEmail(email: Partial<AgencyEmail>): Promise<AgencyEmail> {
    return this.emailRepository.save(email);
  }

  /**
   * borra un correo.
   *
   * @param id id del correo
   * @returns el resultado del borrado de typeorm
   */
  deleteEmail(id: number): Promise<import('typeorm').DeleteResult> {
    return this.emailRepository.delete(id);
  }

  /**
   * busca un correo con su inmobiliaria, para verificar a quien pertenece.
   *
   * @param id id del correo
   * @returns el correo con su inmobiliaria, o null si no existe
   */
  findEmailById(id: number): Promise<AgencyEmail | null> {
    return this.emailRepository.findOne({ where: { id }, relations: ['agency'] });
  }
}

export const agencyRepository = new AgencyRepository();
