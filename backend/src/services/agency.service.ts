/** 
 * @fileoverview servicio para la gestion de inmobiliarias y su perfil publico y privado.
 */
import { agencyRepository } from "../repositories/agency.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { reviewRepository } from "../repositories/review.repository";
import { Agency } from "../entities/agency.entity";
import { Property } from "../entities/property.entity";
import { Review } from "../entities/review.entity";
import { ReviewDTO } from "../schemas/review.schema";
import { activityService } from "./activity.service";

// =================================================================================
// ENDPOINTS: CATÁLOGO PÚBLICO DE INMOBILIARIAS
// =================================================================================

// Servicio público (Catálogo)

class AgencyService {
  /**
   * obtiene una inmobiliaria por su id.
   * 
   * @param {number} id - id de la inmobiliaria
   * @returns {Promise<Agency | null>} agencia encontrada
   * 
   * @example
   * agencyservice.getbyid(1)
   */
  getById(id: number): Promise<Agency | null> {
    return agencyRepository.findById(id);
  }

  /**
   * obtiene la lista de inmobiliarias filtrada y paginada.
   * 
   * @param {string | undefined} nombreFantasia - busqueda parcial por nombre
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de resultados
   * @returns {Promise<PaginatedResult<Agency>>} agencias paginadas
   */
  getAll(nombreFantasia: string | undefined, page: number, limit: number): Promise<PaginatedResult<Agency>> {
    return agencyRepository.findPaginated(nombreFantasia, page, limit);
  }

  /**
   * obtiene las propiedades de una inmobiliaria especifica.
   * 
   * @param {number} agencyId - id de la inmobiliaria
   * @param {number} page - numero de pagina
   * @param {number} limit - tamaño de pagina
   * @returns {Promise<PaginatedResult<Property>>} catalogo de la inmobiliaria
   * 
   * @example
   * agencyservice.getproperties(1, 1, 10)
   */
  getProperties(agencyId: number, page: number, limit: number): Promise<PaginatedResult<Property>> {
    return propertyRepository.findByAgencyId(agencyId, page, limit);
  }

  /**
   * crea una reseña verificando primero que la inmobiliaria exista.
   * 
   * @async
   * @param {number} agencyId - id de la inmobiliaria a calificar
   * @param {ReviewDTO} data - datos de la reseña validada
   * @returns {Promise<Review | null>} reseña creada o null si no existe la inmobiliaria
   * 
   * @example
   * agencyservice.createreview(1, { calificacion: 5, nombreautor: 'ana', emailautor: 'a@a.com' })
   */
  async createReview(agencyId: number, data: ReviewDTO): Promise<Review | null> {
    // Necesitamos cargar el seller para poder notificarlo
    const agency = await agencyRepository.findById(agencyId);
    if (!agency) return null;
    
    const review = await reviewRepository.create({ ...data, agency });

    if (agency.seller) {
      await activityService.notify(
        agency.seller.id,
        "RESENIA",
        review.id,
        "resenia",
        `Nueva reseña de ${data.nombreSolicitante} (${data.calificacion} estrellas)`
      );
    }

    return review;
  }

  /**
   * obtiene las reseñas de una inmobiliaria de manera paginada.
   * 
   * @async
   * @param {number} agencyId - id de la inmobiliaria
   * @param {number} page - numero de pagina
   * @param {number} limit - limite de reseñas
   * @returns {Promise<PaginatedResult<Review> | null>} reseñas o null si la inmobiliaria no existe
   * 
   * @example
   * agencyservice.getreviews(1, 1, 10)
   */
  async getReviews(agencyId: number, page: number, limit: number): Promise<PaginatedResult<Review> | null> {
    const agency = await agencyRepository.findById(agencyId);
    if (!agency) return null;
    return reviewRepository.findPaginatedByAgencyId(agencyId, page, limit);
  }
}
export const agencyService = new AgencyService();


// Servicio privado (Dashboard)

export const getAgencyProfileBySellerId = async (sellerId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;
  const [telefonos, correos] = await Promise.all([
    agencyRepository.findPhonesByAgencyId(agency.id),
    agencyRepository.findEmailsByAgencyId(agency.id)
  ]);
  return {
    id: agency.id, nombreFantasia: agency.nombreFantasia, descripcion: agency.descripcion,
    logoUrl: agency.logoUrl, direccionLinea1: agency.direccionLinea1, direccionLinea2: agency.direccionLinea2,
    createdAt: agency.createdAt,
    telefonos: telefonos.map(t => ({ id: t.id, telefono: t.telefono, tipoTelefono: t.tipoTelefono })),
    correos: correos.map(c => ({ id: c.id, correo: c.correo, tipoCorreo: c.tipoCorreo }))
  };
};

export const updateAgencyProfileBySellerId = async (sellerId: number, updateData: Partial<Agency>) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;
  const allowedFields = ['nombreFantasia', 'descripcion', 'logoUrl', 'direccionLinea1', 'direccionLinea2'];
  const dataToUpdate: any = {};
  for (const key of allowedFields) {
    if (updateData[key as keyof Agency] !== undefined) dataToUpdate[key] = updateData[key as keyof Agency];
  }
  if (Object.keys(dataToUpdate).length > 0) await agencyRepository.update(agency.id, dataToUpdate);
  return getAgencyProfileBySellerId(sellerId);
};

export const addPhoneToAgency = async (sellerId: number, telefono: string, tipoTelefono?: string) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;
  const newPhone = await agencyRepository.createPhone({ telefono, tipoTelefono, agency });
  return { id: newPhone.id, telefono: newPhone.telefono, tipoTelefono: newPhone.tipoTelefono };
};

export const removePhoneFromAgency = async (sellerId: number, phoneId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return false;
  const phone = await agencyRepository.findPhoneById(phoneId);
  if (!phone || phone.agency.id !== agency.id) return false;
  await agencyRepository.deletePhone(phoneId);
  return true;
};

export const addEmailToAgency = async (sellerId: number, correo: string, tipoCorreo?: string) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;
  const newEmail = await agencyRepository.createEmail({ correo, tipoCorreo, agency });
  return { id: newEmail.id, correo: newEmail.correo, tipoCorreo: newEmail.tipoCorreo };
};

export const removeEmailFromAgency = async (sellerId: number, emailId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return false;
  const email = await agencyRepository.findEmailById(emailId);
  if (!email || email.agency.id !== agency.id) return false;
  await agencyRepository.deleteEmail(emailId);
  return true;
};

export const deleteAgencyBySellerId = async (sellerId: number): Promise<{success: boolean, message?: string}> => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return { success: false, message: 'Inmobiliaria no encontrada' };
  const hasActiveProperties = await propertyRepository.hasActivePropertiesByAgency(agency.id);
  if (hasActiveProperties) return { success: false, message: 'No se puede eliminar la inmobiliaria porque tiene propiedades Publicadas o Reservadas' };
  await agencyRepository.deleteAgency(agency.id);
  return { success: true };
};
