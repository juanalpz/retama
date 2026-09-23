/**
 * @fileoverview Esquemas de validación con Zod para el módulo de Autenticación.
 * Garantiza la integridad de los datos de entrada antes de ser procesados en los controladores[cite: 2, 3].
 */

import { z } from 'zod';

/**
 * Esquema Zod de validación para el inicio de sesión (Login).
 * Sanitiza los datos de entrada para evitar inyecciones o formatos inválidos.
 */
export const loginSchema = z.object({
  email: z.string().email({ message: 'El formato de email no es válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

/**
 * Esquema Zod de validación para el registro unificado de Vendedor e Inmobiliaria.
 */
export const registerSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  apellido: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'El formato de correo electrónico no es válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  nombreFantasia: z.string().min(3, { message: 'El nombre de la inmobiliaria debe tener al menos 3 caracteres' }),
  descripcion: z.string().optional()
});