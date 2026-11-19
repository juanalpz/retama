/**
 * reglas de negocio de las inmobiliarias.
 * la clase AgencyService atiende el catalogo publico y las reseñas; las funciones
 * exportadas mas abajo atienden el perfil de la inmobiliaria del vendedor.
 */
import { agencyRepository } from "../repositories/agency.repository";
import { propertyRepository, PaginatedResult } from "../repositories/property.repository";
import { reviewRepository } from "../repositories/review.repository";
import { Agency } from "../entities/agency.entity";
import { Property } from "../entities/property.entity";
import { Review } from "../entities/review.entity";
import { ReviewDTO } from "../schemas/review.schema";
import { activityService } from "./activity.service";
import { ServiceResult, fail } from "../utils/result.utils";

// =================================================================================
// endpoints: catálogo público de inmobiliarias
// =================================================================================

// servicio público (catálogo)

class AgencyService {
  /**
   * perfil publico de una inmobiliaria. le saca el vendedor y le agrega la
   * calificacion promedio y la cantidad de reseñas.
   *
   * @param id id de la inmobiliaria
   * @returns la inmobiliaria con telefonos, correos, calificacionPromedio y cantidadResenias, o null si no existe
   */
  async getById(id: number) {
    const agency = await agencyRepository.findById(id);
    if (!agency) return null;

    // el vendedor no forma parte del perfil publico
    const { seller, ...publicAgency } = agency;

    // se agrega el promedio y la cantidad de reseñas para la cabecera del sitio del vendedor
    const rating = await reviewRepository.getRatingSummary(id);

    return {
      ...publicAgency,
      calificacionPromedio: rating.promedio,
      cantidadResenias: rating.cantidad,
    };
  }

  /**
   * listado publico de inmobiliarias, cada una con su calificacion promedio y su cantidad de reseñas.
   *
   * @param nombreFantasia texto a buscar dentro del nombre de fantasia (opcional)
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado { data, total, page, limit, totalPages }; cada inmobiliaria trae telefonos, correos, calificacionPromedio y cantidadResenias
   */
  async getAll(nombreFantasia: string | undefined, page: number, limit: number): Promise<PaginatedResult<Agency & { calificacionPromedio: number | null; cantidadResenias: number }>> {
    const result = await agencyRepository.findPaginated(nombreFantasia, page, limit);

    // a cada inmobiliaria de la pagina se le agrega su calificacion, para mostrarla en el listado
    const data = await Promise.all(
      result.data.map(async (agency) => {
        const rating = await reviewRepository.getRatingSummary(agency.id);
        return { ...agency, calificacionPromedio: rating.promedio, cantidadResenias: rating.cantidad };
      }),
    );

    return { ...result, data };
  }

  /**
   * propiedades publicadas de una inmobiliaria.
   *
   * @param agencyId id de la inmobiliaria
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado de propiedades, o null si la inmobiliaria no existe
   */
  async getProperties(agencyId: number, page: number, limit: number): Promise<PaginatedResult<Property> | null> {
    // null si la inmobiliaria no existe, para que el controlador responda 404
    const agency = await agencyRepository.findById(agencyId);
    if (!agency) return null;
    return propertyRepository.findByAgencyId(agencyId, page, limit);
  }

  /**
   * crea una reseña sobre una inmobiliaria y le avisa al vendedor en su feed de actividad.
   *
   * @param agencyId id de la inmobiliaria
   * @param data datos ya validados: nombreSolicitante, resenia, calificacion
   * @returns la reseña creada (sin la inmobiliaria anidada), o null si la inmobiliaria no existe
   */
  async createReview(agencyId: number, data: ReviewDTO): Promise<Review | null> {
    // necesitamos cargar el seller para poder notificarlo
    const agency = await agencyRepository.findById(agencyId);
    if (!agency) return null;
    
    const created = await reviewRepository.create({ ...data, agency });
    // en la respuesta no hace falta devolver la inmobiliaria completa
    const { agency: _omit, ...review } = created as any;

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
   * reseñas de una inmobiliaria, la mas reciente primero.
   *
   * @param agencyId id de la inmobiliaria
   * @param page numero de pagina
   * @param limit cantidad por pagina
   * @returns un resultado paginado de reseñas, o null si la inmobiliaria no existe
   */
  async getReviews(agencyId: number, page: number, limit: number): Promise<PaginatedResult<Review> | null> {
    const agency = await agencyRepository.findById(agencyId);
    if (!agency) return null;
    return reviewRepository.findPaginatedByAgencyId(agencyId, page, limit);
  }
}
export const agencyService = new AgencyService();


// servicio privado (dashboard)

/**
 * busca la inmobiliaria de un vendedor con sus datos de contacto.
 * la usan casi todas las operaciones privadas para saber sobre que inmobiliaria trabajar.
 *
 * @param sellerId id del vendedor autenticado
 * @returns un objeto con los datos de la inmobiliaria, telefonos y correos, o null si el vendedor no tiene inmobiliaria
 */
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

/**
 * edita los datos de la inmobiliaria del vendedor. solo toca los campos permitidos
 * y verifica que el nombre de fantasia no lo use otra inmobiliaria.
 *
 * @param sellerId id del vendedor autenticado
 * @param updateData campos a modificar: nombreFantasia, descripcion, logoUrl, direccionLinea1, direccionLinea2
 * @returns { success: true, inmobiliaria }, o un error 404 si no tiene inmobiliaria o 409 si el nombre ya esta en uso
 */
export const updateAgencyProfileBySellerId = async (sellerId: number, updateData: Partial<Agency>): Promise<ServiceResult<{ inmobiliaria: any }>> => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return fail(404, 'Inmobiliaria no encontrada');

  // el nombre de fantasia es unico en toda la plataforma (sin distinguir mayusculas)
  if (updateData.nombreFantasia !== undefined) {
    const enUso = await agencyRepository.existsNombreFantasia(updateData.nombreFantasia, agency.id);
    if (enUso) return fail(409, 'El nombre de fantasía ya está en uso por otra inmobiliaria');
  }
  const allowedFields = ['nombreFantasia', 'descripcion', 'logoUrl', 'direccionLinea1', 'direccionLinea2'];
  const dataToUpdate: any = {};
  for (const key of allowedFields) {
    if (updateData[key as keyof Agency] !== undefined) dataToUpdate[key] = updateData[key as keyof Agency];
  }
  if (Object.keys(dataToUpdate).length > 0) await agencyRepository.update(agency.id, dataToUpdate);
  return { success: true, inmobiliaria: await getAgencyProfileBySellerId(sellerId) };
};

/**
 * agrega un telefono de contacto a la inmobiliaria del vendedor.
 *
 * @param sellerId id del vendedor autenticado
 * @param telefono numero de telefono
 * @param tipoTelefono etiqueta del telefono, por ejemplo "WhatsApp" (opcional)
 * @returns el telefono creado { id, telefono, tipoTelefono }, o null si el vendedor no tiene inmobiliaria
 */
export const addPhoneToAgency = async (sellerId: number, telefono: string, tipoTelefono?: string) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;
  const newPhone = await agencyRepository.createPhone({ telefono, tipoTelefono, agency });
  return { id: newPhone.id, telefono: newPhone.telefono, tipoTelefono: newPhone.tipoTelefono };
};

/**
 * elimina un telefono, verificando antes que sea de la inmobiliaria del vendedor.
 *
 * @param sellerId id del vendedor autenticado
 * @param phoneId id del telefono
 * @returns true si se elimino, false si no existe o es de otra inmobiliaria
 */
export const removePhoneFromAgency = async (sellerId: number, phoneId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return false;
  const phone = await agencyRepository.findPhoneById(phoneId);
  if (!phone || phone.agency.id !== agency.id) return false;
  await agencyRepository.deletePhone(phoneId);
  return true;
};

/**
 * agrega un correo de contacto a la inmobiliaria del vendedor.
 *
 * @param sellerId id del vendedor autenticado
 * @param correo direccion de correo
 * @param tipoCorreo etiqueta del correo, por ejemplo "Ventas" (opcional)
 * @returns el correo creado { id, correo, tipoCorreo }, o null si el vendedor no tiene inmobiliaria
 */
export const addEmailToAgency = async (sellerId: number, correo: string, tipoCorreo?: string) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;
  const newEmail = await agencyRepository.createEmail({ correo, tipoCorreo, agency });
  return { id: newEmail.id, correo: newEmail.correo, tipoCorreo: newEmail.tipoCorreo };
};

/**
 * elimina un correo, verificando antes que sea de la inmobiliaria del vendedor.
 *
 * @param sellerId id del vendedor autenticado
 * @param emailId id del correo
 * @returns true si se elimino, false si no existe o es de otra inmobiliaria
 */
export const removeEmailFromAgency = async (sellerId: number, emailId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return false;
  const email = await agencyRepository.findEmailById(emailId);
  if (!email || email.agency.id !== agency.id) return false;
  await agencyRepository.deleteEmail(emailId);
  return true;
};

/**
 * elimina la inmobiliaria del vendedor. la base borra en cascada sus propiedades,
 * fotos, consultas, visitas, reseñas y datos de contacto.
 * regla de negocio: no se puede eliminar mientras tenga propiedades publicadas o reservadas.
 *
 * @param sellerId id del vendedor autenticado
 * @returns { success: true }, o un error 404 si no tiene inmobiliaria o 409 si tiene propiedades activas
 */
export const deleteAgencyBySellerId = async (sellerId: number): Promise<ServiceResult> => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return fail(404, 'Inmobiliaria no encontrada');
  // regla de negocio: no se puede eliminar mientras tenga propiedades publicadas o reservadas
  const hasActiveProperties = await propertyRepository.hasActivePropertiesByAgency(agency.id);
  if (hasActiveProperties) return fail(409, 'No se puede eliminar la inmobiliaria porque tiene propiedades publicadas o reservadas');
  await agencyRepository.deleteAgency(agency.id);
  return { success: true };
};
