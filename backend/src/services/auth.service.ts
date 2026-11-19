/**
 * logica de registro, login y recuperacion de sesion del vendedor.
 */

import { AppDataSource } from '../config/data-source';
import { Seller } from '../entities/seller.entity';
import { Agency } from '../entities/agency.entity';
import { AgencyPhone } from '../entities/agency-phone.entity';
import { AgencyEmail } from '../entities/agency-email.entity';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.utils';
import { ServiceResult, fail } from '../utils/result.utils';

export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  nombreFantasia: string;
  descripcion?: string;
}

/**
 * arma los datos del vendedor que se devuelven al front. nunca incluye la contraseña.
 *
 * @param seller vendedor leido de la base
 * @param agency su inmobiliaria, o null si no tiene
 * @returns un objeto con id, nombre, apellido, email, rol, createdAt e inmobiliaria
 */
const toPublicUser = (seller: Seller, agency: Agency | null) => ({
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
});

/**
 * registra un vendedor y crea su inmobiliaria en el mismo paso.
 * todo se guarda dentro de una transaccion: si falla la inmobiliaria no queda
 * un vendedor suelto. el email del vendedor queda como correo de contacto de la
 * inmobiliaria y, si informo un telefono, tambien queda como telefono de contacto.
 *
 * @param data datos ya validados: nombre, apellido, email, password, nombreFantasia, y opcionales telefono y descripcion
 * @returns { success: true, token, usuario } si salio bien, o { success: false, status: 409, message, field } si el email o el nombre de fantasia ya existen (field dice cual)
 */
export const registerSeller = async (data: RegisterData): Promise<ServiceResult<{ token: string; usuario: ReturnType<typeof toPublicUser> }> | { success: false; status: number; message: string; field: string }> => {
  const email = data.email.toLowerCase();

  const emailEnUso = await AppDataSource.getRepository(Seller).findOneBy({ email });
  if (emailEnUso) {
    return { ...fail(409, 'El correo electrónico ya se encuentra registrado'), field: 'email' };
  }

  // la comparacion no distingue mayusculas: "Del Mar" y "del mar" son el mismo nombre
  const nombreEnUso = await AppDataSource.getRepository(Agency)
    .createQueryBuilder('agency')
    .where('LOWER(agency.nombreFantasia) = LOWER(:nombre)', { nombre: data.nombreFantasia })
    .getOne();
  if (nombreEnUso) {
    return { ...fail(409, 'El nombre de fantasía de la inmobiliaria ya está en uso'), field: 'nombreFantasia' };
  }

  const passwordHash = await hashPassword(data.password);

  const { seller, agency } = await AppDataSource.transaction(async (manager) => {
    const seller = await manager.save(manager.create(Seller, {
      nombre: data.nombre,
      apellido: data.apellido,
      email,
      passwordHash,
      rol: 'VENDEDOR'
    }));

    const agency = await manager.save(manager.create(Agency, {
      nombreFantasia: data.nombreFantasia,
      descripcion: data.descripcion || `Inmobiliaria de ${data.nombre} ${data.apellido}`,
      seller
    }));

    await manager.save(manager.create(AgencyEmail, { agency, correo: email, tipoCorreo: 'Principal' }));

    if (data.telefono) {
      await manager.save(manager.create(AgencyPhone, { agency, telefono: data.telefono, tipoTelefono: 'Principal' }));
    }

    return { seller, agency };
  });

  const token = generateToken({ id: seller.id, role: seller.rol });

  return { success: true, token, usuario: toPublicUser(seller, agency) };
};

/**
 * valida email y contraseña y genera el token de sesion.
 * si el email no existe o la contraseña no coincide responde lo mismo, para no
 * revelar que emails estan registrados.
 *
 * @param emailIngresado email tal como lo escribio el usuario (se pasa a minuscula)
 * @param password contraseña en texto plano
 * @returns { success: true, token, usuario }, o { success: false, status: 401, message } si las credenciales no son validas
 */
export const loginSeller = async (emailIngresado: string, password: string): Promise<ServiceResult<{ token: string; usuario: ReturnType<typeof toPublicUser> }>> => {
  const email = emailIngresado.toLowerCase();

  // el hash esta marcado como select: false en la entidad, aca se pide a proposito
  const seller = await AppDataSource.getRepository(Seller)
    .createQueryBuilder('seller')
    .addSelect('seller.passwordHash')
    .where('seller.email = :email', { email })
    .getOne();

  if (!seller || !(await comparePassword(password, seller.passwordHash))) {
    return fail(401, 'Credenciales inválidas');
  }

  const agency = await AppDataSource.getRepository(Agency).findOne({
    where: { seller: { id: seller.id } }
  });

  const token = generateToken({ id: seller.id, role: seller.rol });

  return { success: true, token, usuario: toPublicUser(seller, agency) };
};

/**
 * busca el vendedor del token con su inmobiliaria, para restaurar la sesion.
 *
 * @param sellerId id del vendedor que venia en el token
 * @returns los datos publicos del vendedor con su inmobiliaria, o null si ya no existe
 */
export const getAuthenticatedProfile = async (sellerId: number) => {
  const seller = await AppDataSource.getRepository(Seller).findOneBy({ id: sellerId });
  if (!seller) return null;

  const agency = await AppDataSource.getRepository(Agency).findOne({
    where: { seller: { id: seller.id } }
  });

  return toPublicUser(seller, agency);
};
