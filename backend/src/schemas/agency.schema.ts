import { z } from 'zod';

// ==========================================
// 2. ENDPOINTS GESTIÓN DE INMOBILIARIA
// ==========================================

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.2] Esquema de validación para actualizar el perfil de la inmobiliaria.
 * Define las reglas que deben cumplir los datos enviados en el cuerpo de la petición.
 * 
 * @type {z.ZodObject<any>}
 * 
 * @example
 * { "nombreFantasia": "Inmobiliaria Nueva", "direccionLinea1": "Calle Falsa 123" }
 */
export const updateAgencySchema = z.object({
  nombreFantasia: z.string().min(2, 'El nombre de fantasía debe tener al menos 2 caracteres').max(150, 'El nombre de fantasía no puede exceder los 150 caracteres').optional(),
  descripcion: z.string().optional(),
  logoUrl: z.string().url('La URL del logo debe ser válida').optional().or(z.literal('')),
  direccionLinea1: z.string().max(200, 'La dirección no puede exceder los 200 caracteres').optional(),
}).strict();

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.3] Esquema de validación para crear un nuevo teléfono.
 * Define las reglas para los campos al agregar un contacto telefónico.
 * 
 * @type {z.ZodObject<any>}
 * 
 * @example
 * { "telefono": "11-4567-8901", "tipoTelefono": "WhatsApp" }
 */
export const createPhoneSchema = z.object({
  telefono: z.string().min(5, 'El teléfono es muy corto').max(50, 'El teléfono es muy largo'),
  tipoTelefono: z.string().max(30, 'El tipo no puede exceder los 30 caracteres').optional()
}).strict();

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 2.5] Esquema de validación para crear un nuevo correo electrónico.
 * Define las reglas para los campos al agregar un correo a la inmobiliaria.
 * 
 * @type {z.ZodObject<any>}
 * 
 * @example
 * { "correo": "ventas@inmobiliaria.com", "tipoCorreo": "Ventas" }
 */
export const createEmailSchema = z.object({
  correo: z.string().email('Debe ser un correo electrónico válido').max(150, 'El correo no puede exceder los 150 caracteres'),
  tipoCorreo: z.string().max(30, 'El tipo no puede exceder los 30 caracteres').optional()
}).strict();
