/**
 * @fileoverview Servicio de gestión de Inmobiliarias (Agencias).
 * Maneja la lógica de negocio y persistencia de datos para las inmobiliarias y su 
 * información de contacto asociada (teléfonos y correos).
 */

import { agencyRepository } from '../repositories/agency.repository';
import { propertyRepository } from '../repositories/property.repository';

// ==========================================
// 2. ENDPOINTS GESTIÓN DE INMOBILIARIA
// ==========================================

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.1 y 2.2] Recupera el perfil de una inmobiliaria junto con su información de contacto
 * (teléfonos y correos) basándose en el ID del vendedor asociado.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @returns {Promise<Object | null>} Objeto con los datos de la inmobiliaria y sus contactos, o `null` si no se encuentra.
 * 
 * @example
 * const profile = await getAgencyProfileBySellerId(1);
 */
export const getAgencyProfileBySellerId = async (sellerId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);

  if (!agency) {
    return null;
  }

  const [telefonos, correos] = await Promise.all([
    agencyRepository.findPhonesByAgencyId(agency.id),
    agencyRepository.findEmailsByAgencyId(agency.id)
  ]);

  return {
    id: agency.id,
    nombreFantasia: agency.nombreFantasia,
    descripcion: agency.descripcion,
    logoUrl: agency.logoUrl,
    direccionLinea1: agency.direccionLinea1,
    direccionLinea2: agency.direccionLinea2,
    createdAt: agency.createdAt,
    telefonos: telefonos.map(t => ({
      id: t.id,
      telefono: t.telefono,
      tipoTelefono: t.tipoTelefono
    })),
    correos: correos.map(c => ({
      id: c.id,
      correo: c.correo,
      tipoCorreo: c.tipoCorreo
    }))
  };
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.2] Actualiza el perfil principal de la inmobiliaria basándose en el ID del vendedor asociado.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {Partial<Agency>} updateData - Datos a actualizar de la inmobiliaria.
 * @returns {Promise<Object | null>} El perfil actualizado de la inmobiliaria, o `null` si no se encontró.
 * 
 * @example
 * const updated = await updateAgencyProfileBySellerId(1, { nombreFantasia: "Nuevo" });
 */
export const updateAgencyProfileBySellerId = async (sellerId: number, updateData: Partial<Agency>) => {
  const agency = await agencyRepository.findBySellerId(sellerId);

  if (!agency) {
    return null;
  }

  // Asegurarnos de que solo se actualizan los campos permitidos
  const allowedFields = ['nombreFantasia', 'descripcion', 'logoUrl', 'direccionLinea1', 'direccionLinea2'];
  const dataToUpdate: any = {};
  
  for (const key of allowedFields) {
    if (updateData[key as keyof Agency] !== undefined) {
      dataToUpdate[key] = updateData[key as keyof Agency];
    }
  }

  if (Object.keys(dataToUpdate).length > 0) {
    await agencyRepository.update(agency.id, dataToUpdate);
  }

  // Devolver el perfil actualizado re-consultando a la base de datos
  return getAgencyProfileBySellerId(sellerId);
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.3] Añade un nuevo número de teléfono a la inmobiliaria del vendedor.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {string} telefono - El número de teléfono a añadir.
 * @param {string} [tipoTelefono] - (Opcional) El tipo de teléfono (ej. WhatsApp, Fijo).
 * @returns {Promise<Object | null>} El teléfono creado, o `null` si no se encontró la inmobiliaria.
 * 
 * @example
 * const newPhone = await addPhoneToAgency(1, "11223344", "Móvil");
 */
export const addPhoneToAgency = async (sellerId: number, telefono: string, tipoTelefono?: string) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;

  const newPhone = await agencyRepository.createPhone({
    telefono,
    tipoTelefono,
    agency
  });

  return { id: newPhone.id, telefono: newPhone.telefono, tipoTelefono: newPhone.tipoTelefono };
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.4] Elimina un número de teléfono de la inmobiliaria, verificando primero que le pertenezca.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {number} phoneId - Identificador único del teléfono a eliminar.
 * @returns {Promise<boolean>} `true` si se eliminó correctamente, `false` si no se encontró o no le pertenece.
 * 
 * @example
 * const success = await removePhoneFromAgency(1, 5);
 */
export const removePhoneFromAgency = async (sellerId: number, phoneId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return false;

  const phone = await agencyRepository.findPhoneById(phoneId);
  
  // Verificamos que el teléfono exista y pertenezca a la inmobiliaria de este vendedor
  if (!phone || phone.agency.id !== agency.id) {
    return false;
  }

  await agencyRepository.deletePhone(phoneId);
  return true;
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.5] Añade un nuevo correo electrónico a la inmobiliaria del vendedor.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {string} correo - El correo electrónico a añadir.
 * @param {string} [tipoCorreo] - (Opcional) El tipo de correo (ej. Ventas, Soporte).
 * @returns {Promise<Object | null>} El correo creado, o `null` si no se encontró la inmobiliaria.
 * 
 * @example
 * const newEmail = await addEmailToAgency(1, "test@test.com", "Ventas");
 */
export const addEmailToAgency = async (sellerId: number, correo: string, tipoCorreo?: string) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return null;

  const newEmail = await agencyRepository.createEmail({
    correo,
    tipoCorreo,
    agency
  });

  return { id: newEmail.id, correo: newEmail.correo, tipoCorreo: newEmail.tipoCorreo };
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.6] Elimina un correo electrónico de la inmobiliaria, verificando primero que le pertenezca.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @param {number} emailId - Identificador único del correo a eliminar.
 * @returns {Promise<boolean>} `true` si se eliminó correctamente, `false` si no se encontró o no le pertenece.
 * 
 * @example
 * const success = await removeEmailFromAgency(1, 10);
 */
export const removeEmailFromAgency = async (sellerId: number, emailId: number) => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  if (!agency) return false;

  const email = await agencyRepository.findEmailById(emailId);
  
  // Verificamos que el correo exista y pertenezca a la inmobiliaria de este vendedor
  if (!email || email.agency.id !== agency.id) {
    return false;
  }

  await agencyRepository.deleteEmail(emailId);
  return true;
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.7] Elimina la inmobiliaria asociada a un vendedor.
 * Valida que la inmobiliaria no tenga propiedades en estado 'Publicada' o 'Reservada'.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor.
 * @returns {Promise<{success: boolean, message?: string}>} Resultado de la operación y mensaje de error si aplica.
 * 
 * @example
 * const result = await deleteAgencyBySellerId(1);
 */
export const deleteAgencyBySellerId = async (sellerId: number): Promise<{success: boolean, message?: string}> => {
  const agency = await agencyRepository.findBySellerId(sellerId);
  
  if (!agency) {
    return { success: false, message: 'Inmobiliaria no encontrada' };
  }

  // Validar regla de negocio: no se puede eliminar si hay propiedades Publicadas o Reservadas
  const hasActiveProperties = await propertyRepository.hasActivePropertiesByAgency(agency.id);
  if (hasActiveProperties) {
    return { success: false, message: 'No se puede eliminar la inmobiliaria porque tiene propiedades Publicadas o Reservadas' };
  }

  await agencyRepository.deleteAgency(agency.id);
  return { success: true };
};