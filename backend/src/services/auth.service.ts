/**
 * @fileoverview Servicio de autenticación y manejo de perfiles.
 * Encapsula la lógica de acceso a datos relacionada con los perfiles de usuario y 
 * la información de sesión, separando esta responsabilidad de los controladores.
 */

import { AppDataSource } from '../config/data-source';
import { Seller } from '../entities/seller.entity';
import { Agency } from '../entities/agency.entity';

// =================================================================================
// ENDPOINTS: AUTENTICACIÓN
// =================================================================================

const sellerRepo = AppDataSource.getRepository(Seller);
const agencyRepo = AppDataSource.getRepository(Agency);

/**
 * Recupera de la base de datos el perfil completo de un vendedor utilizando su ID.
 * Incluye la información de la agencia inmobiliaria asociada y excluye 
 * información sensible como el hash de la contraseña.
 * 
 * @async
 * @param {number} sellerId - Identificador único del vendedor (extraído del payload del JWT).
 * @returns {Promise<Object | null>} Objeto con los datos públicos del vendedor y su inmobiliaria, o `null` si el usuario no existe.
 * 
 * @example
 * const profile = await getAuthenticatedProfile(user.id);
 */
export const getAuthenticatedProfile = async (sellerId: number) => {
  // 1. Buscar al vendedor por ID en la BD
  const seller = await sellerRepo.findOneBy({ id: sellerId });

  if (!seller) {
    return null; // Si no lo encuentra, tiramos null y el controlador maneja el error 404.
  }

  // 2. Buscar la agencia/inmobiliaria que le pertenece a este tipazo/a
  const agency = await agencyRepo.findOne({
    where: { seller: { id: seller.id } }
  });

  // 3. Retornar solo los datos públicos (¡cuidando de no exponer el passwordHash!)
  // Nota: Devolvemos 'rol' e 'inmobiliaria' para que sea idéntico a lo que devuelve el endpoint de login.
  return {
    id: seller.id,
    nombre: seller.nombre,
    apellido: seller.apellido,
    email: seller.email,
    rol: seller.rol,
    createdAt: seller.createdAt,
    inmobiliaria: agency ? {
      id: agency.id,
      nombreFantasia: agency.nombreFantasia,
      descripcion: agency.descripcion,
      logoUrl: agency.logoUrl,
      direccionLinea1: agency.direccionLinea1,
      direccionLinea2: agency.direccionLinea2,
    } : null
  };
};