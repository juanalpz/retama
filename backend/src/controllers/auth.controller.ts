/** 
 * @fileoverview Controlador de Autenticación y Gestión de Usuarios/Inmobiliarias.
 * Maneja el registro unificado de vendedores con su inmobiliaria asociada,
 * la verificación de credenciales en el inicio de sesión y la emisión de tokens JWT.
 */

import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.utils';
import { Seller } from '../entities/seller.entity';
import { Agency } from '../entities/agency.entity';

/**
 * Registra un nuevo usuario vendedor y crea automáticamente su perfil de Inmobiliaria asociado.
 * 
 * 1. Verifica la unicidad del email del usuario y del nombre de fantasía de la inmobiliaria.
 * 2. Hashea la contraseña con bcrypt por seguridad (Security by Design / OWASP A02).
 * 3. Crea el registro en la tabla 'sellers' y su correspondiente 'agencies'.
 * 4. Retorna el token JWT de sesión junto con los datos públicos creados.
 * 
 * @async
 * @param {Request} req - Petición HTTP de Express conteniendo los datos validados del cuerpo 
 * ('nombre', 'apellido', 'email', 'password', 'nombreFantasia', 'descripcion')
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 201 Created con token JWT o HTTP 400/500 en caso de conflicto/error.
 * 
 * @example
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { nombre, apellido, email, password, nombreFantasia, descripcion } = req.body;

        const sellerRepo = AppDataSource.getRepository(Seller);
        const agencyRepo = AppDataSource.getRepository(Agency);

        // 1. Validar si el email ya se encuentra registrado en la DB.
        const usuarioExistente = await sellerRepo.findOneBy({ email });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya se encuentra registrado'
            });
        }

        // 2. Validar que el nombre de fantasía de la inmobiliaria sea único en el sistema
        const inmobiliariaExistente = await agencyRepo.findOneBy({ name: nombreFantasia });

        if (inmobiliariaExistente) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de fantasía de la inmobiliaria ya está en uso'
            });
        }

        // 3. Hashear la contraseña usando la utilidad con bcrypt.
        const passwordHash = await hashPassword(password);

        // 4. Guardar en PostgreSQL: Creamos el Seller y su Agency
        const fullName = `${nombre} ${apellido}`;
        const nuevoUsuario = sellerRepo.create({
            fullName,
            email,
            passwordHash
        });
        await sellerRepo.save(nuevoUsuario);

        const nuevaInmobiliaria = agencyRepo.create({
            name: nombreFantasia,
            description: descripcion || `Inmobiliaria de ${fullName}`,
            contactEmail: email,
            contactPhone: 'No provisto', // default value
            seller: nuevoUsuario
        });
        await agencyRepo.save(nuevaInmobiliaria);

        // 5. Emitir el token JWT para el nuevo vendedor.
        const token = generateToken({
            id: nuevoUsuario.id,
            role: 'VENDEDOR' // fixed role as Seller entity doesn't have role
        });

        // 6. Retornar respuesta exitosa 201 Created sin exponer la contraseña hasheada
        return res.status(201).json({
            success: true,
            message: 'Vendedor e Inmobiliaria registrados con éxito :D',
            token,
            usuario: {
                id: nuevoUsuario.id,
                nombre,
                apellido,
                email: nuevoUsuario.email,
                rol: 'VENDEDOR',
                inmobiliaria: nuevaInmobiliaria
            }
        });
    } catch (error) {
        console.error('Error en el register controller: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar el registro'
        });
    }
};

/**
 * Autentica un usuario vendedor mediante sus credenciales (email y contraseña).
 * 
 * 1. Busca el usuario en PostgreSQL por correo electrónico.
 * 2. Compara la contraseña en texto plano recibida contra el hash almacenado utilizando bcrypt.
 * 3. Genera y firma un token de acceso JWT si las credenciales son válidas.
 * 
 * @async
 * @param {Request} req - Petición HTTP de Express conteniendo 'email' y 'password'.
 * @param {Response} res - Respuesta HTTP de Express.
 * @returns {Promise<Response>} Respuesta HTTP 200 OK con el token o HTTP 401 Unauthorized si falla.
 * 
 * @example
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        const sellerRepo = AppDataSource.getRepository(Seller);
        const agencyRepo = AppDataSource.getRepository(Agency);

        // 1. Buscar al usuario en la base de datos
        const usuario = await sellerRepo.findOneBy({ email });

        // 2. Si el usuario no existe, retornar 401 Unauthorized
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // 3. Comparar la clave ingresada contra el hash encriptado
        const esPasswordValido = await comparePassword(password, usuario.passwordHash);

        if (!esPasswordValido) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Obtener la inmobiliaria
        const inmobiliaria = await agencyRepo.findOne({ 
            where: { seller: { id: usuario.id } } 
        });

        // 4. Generar el token de acceso JWT.
        const token = generateToken({
            id: usuario.id,
            role: 'VENDEDOR'
        });

        // 5. Devolver respuesta OK con el token y datos del vendedor/inmobiliaria.
        return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                fullName: usuario.fullName,
                email: usuario.email,
                rol: 'VENDEDOR',
                inmobiliaria
            }
        });
    } catch (error) {
        console.error('Error en login controller: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al procesar el inicio de sesión'
        });
    }
};