import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Agency } from "../entities/agency.entity";
import { AgencyPhone } from "../entities/agency-phone.entity";
import { AgencyEmail } from "../entities/agency-email.entity";

// ==========================================
// 2. ENDPOINTS GESTIÓN DE INMOBILIARIA
// ==========================================

// ----------------------------------------------------------------------------------------------------

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
  
  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoints 2.1 - 2.7] Busca la inmobiliaria asociada al vendedor.
   * Helper principal utilizado por todos los endpoints para validar la existencia de la agencia.
   * 
   * @async
   * @param {number} sellerId - Identificador único del vendedor.
   * @returns {Promise<Agency | null>} La inmobiliaria encontrada, o null si no existe.
   * 
   * @example
   * const agency = await agencyRepository.findBySellerId(req.user.id);
   */
  findBySellerId(sellerId: number): Promise<Agency | null> {
    return this.repository.findOne({
      where: { seller: { id: sellerId } }
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.1] Recupera todos los teléfonos asociados a una inmobiliaria.
   * Se utiliza para hidratar el perfil con los contactos al solicitar los datos de la agencia.
   * 
   * @async
   * @param {number} agencyId - Identificador único de la inmobiliaria.
   * @returns {Promise<AgencyPhone[]>} Lista de teléfonos asociados.
   * 
   * @example
   * const phones = await agencyRepository.findPhonesByAgencyId(agency.id);
   */
  findPhonesByAgencyId(agencyId: number): Promise<AgencyPhone[]> {
    return this.phoneRepository.find({
      where: { agency: { id: agencyId } }
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.1] Recupera todos los correos asociados a una inmobiliaria.
   * Se utiliza para hidratar el perfil con los contactos al solicitar los datos de la agencia.
   * 
   * @async
   * @param {number} agencyId - Identificador único de la inmobiliaria.
   * @returns {Promise<AgencyEmail[]>} Lista de correos asociados.
   * 
   * @example
   * const emails = await agencyRepository.findEmailsByAgencyId(agency.id);
   */
  findEmailsByAgencyId(agencyId: number): Promise<AgencyEmail[]> {
    return this.emailRepository.find({
      where: { agency: { id: agencyId } }
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.2] Actualiza los datos principales de la inmobiliaria.
   * Mutación pura sobre la base de datos con los campos permitidos.
   * 
   * @async
   * @param {number} id - Identificador único de la inmobiliaria.
   * @param {Partial<Agency>} data - Objeto con los campos a actualizar.
   * @returns {Promise<import('typeorm').UpdateResult>} Resultado de la operación de actualización en TypeORM.
   * 
   * @example
   * await agencyRepository.update(agency.id, { descripcion: "Nueva bio" });
   */
  update(id: number, data: Partial<Agency>): Promise<import('typeorm').UpdateResult> {
    return this.repository.update(id, data);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.7] Elimina físicamente una inmobiliaria de la base de datos por su ID.
   * Previamente se debe validar (en el servicio) que no posea propiedades 'Publicada' o 'Reservada'.
   * 
   * @async
   * @param {number} id - Identificador único de la inmobiliaria a eliminar.
   * @returns {Promise<import('typeorm').DeleteResult>} Resultado de la eliminación en TypeORM.
   * 
   * @example
   * await agencyRepository.deleteAgency(agency.id);
   */
  deleteAgency(id: number): Promise<import('typeorm').DeleteResult> {
    return this.repository.delete(id);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.3] Guarda un nuevo teléfono en la base de datos.
   * Asocia físicamente el número a la entidad de la inmobiliaria.
   * 
   * @async
   * @param {Partial<AgencyPhone>} phone - Objeto de teléfono a persistir.
   * @returns {Promise<AgencyPhone>} La entidad de teléfono guardada.
   * 
   * @example
   * const newPhone = await agencyRepository.createPhone({ telefono: "123", agency });
   */
  createPhone(phone: Partial<AgencyPhone>): Promise<AgencyPhone> {
    return this.phoneRepository.save(phone);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.4] Elimina físicamente un teléfono de la base de datos.
   * Se invoca tras validar que el teléfono pertenece a la agencia del vendedor.
   * 
   * @async
   * @param {number} id - Identificador único del teléfono.
   * @returns {Promise<import('typeorm').DeleteResult>} Resultado de la eliminación.
   * 
   * @example
   * await agencyRepository.deletePhone(phoneId);
   */
  deletePhone(id: number): Promise<import('typeorm').DeleteResult> {
    return this.phoneRepository.delete(id);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.4] Busca un teléfono y obtiene también su agencia asociada.
   * Helper utilizado para verificar la existencia de un teléfono y a qué agencia pertenece.
   * 
   * @async
   * @param {number} id - Identificador único del teléfono.
   * @returns {Promise<AgencyPhone | null>} El teléfono con la relación a su agencia cargada, o null.
   * 
   * @example
   * const phone = await agencyRepository.findPhoneById(phoneId);
   */
  findPhoneById(id: number): Promise<AgencyPhone | null> {
    return this.phoneRepository.findOne({
      where: { id },
      relations: ['agency'] // Necesario para verificar a quién pertenece el teléfono
    });
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.5] Guarda un nuevo correo en la base de datos.
   * Asocia físicamente el correo a la entidad de la inmobiliaria.
   * 
   * @async
   * @param {Partial<AgencyEmail>} email - Objeto de correo a persistir.
   * @returns {Promise<AgencyEmail>} La entidad de correo guardada.
   * 
   * @example
   * const newEmail = await agencyRepository.createEmail({ correo: "info@x.com", agency });
   */
  createEmail(email: Partial<AgencyEmail>): Promise<AgencyEmail> {
    return this.emailRepository.save(email);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.6] Elimina físicamente un correo de la base de datos.
   * Se invoca tras validar que el correo pertenece a la agencia del vendedor.
   * 
   * @async
   * @param {number} id - Identificador único del correo.
   * @returns {Promise<import('typeorm').DeleteResult>} Resultado de la eliminación.
   * 
   * @example
   * await agencyRepository.deleteEmail(emailId);
   */
  deleteEmail(id: number): Promise<import('typeorm').DeleteResult> {
    return this.emailRepository.delete(id);
  }

  // ----------------------------------------------------------------------------------------------------

  /**
   * [Endpoint 2.6] Busca un correo y obtiene también su agencia asociada.
   * Helper utilizado para verificar la existencia de un correo y a qué agencia pertenece.
   * 
   * @async
   * @param {number} id - Identificador único del correo.
   * @returns {Promise<AgencyEmail | null>} El correo con la relación a su agencia cargada, o null.
   * 
   * @example
   * const email = await agencyRepository.findEmailById(emailId);
   */
  findEmailById(id: number): Promise<AgencyEmail | null> {
    return this.emailRepository.findOne({
      where: { id },
      relations: ['agency'] // Necesario para verificar a quién pertenece el correo
    });
  }
}

export const agencyRepository = new AgencyRepository();
