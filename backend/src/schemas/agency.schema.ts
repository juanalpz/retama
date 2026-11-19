/**
 * validaciones de la gestion de la inmobiliaria: edicion del perfil
 * y alta de telefonos y correos de contacto.
 */

import { z } from 'zod';

/**
 * edicion del perfil de la inmobiliaria (PUT /api/vendedor/inmobiliaria).
 * todos los campos son opcionales: se envian solo los que cambian.
 * no acepta campos que no esten en la lista.
 *
 * ejemplo: { "nombreFantasia": "Inmobiliaria Nueva", "direccionLinea1": "Calle falsa 123" }
 */
export const updateAgencySchema = z.object({
  nombreFantasia: z.string().trim().min(2, 'El nombre de fantasía debe tener al menos 2 caracteres').max(150, 'El nombre de fantasía no puede exceder los 150 caracteres').optional(),
  descripcion: z.string().optional(),
  logoUrl: z.string().url('La URL del logo debe ser válida').optional().or(z.literal('')),
  direccionLinea1: z.string().max(200, 'La dirección no puede exceder los 200 caracteres').optional(),
  direccionLinea2: z.string().max(200, 'La dirección no puede exceder los 200 caracteres').optional(),
}).strict();

/**
 * alta de un telefono de contacto (POST /api/vendedor/inmobiliaria/telefonos).
 *
 * ejemplo: { "telefono": "11-4567-8901", "tipoTelefono": "WhatsApp" }
 */
export const createPhoneSchema = z.object({
  telefono: z.string().min(5, 'El teléfono es muy corto').max(50, 'El teléfono es muy largo'),
  tipoTelefono: z.string().max(30, 'El tipo no puede exceder los 30 caracteres').optional()
}).strict();

/**
 * alta de un correo de contacto (POST /api/vendedor/inmobiliaria/correos).
 *
 * ejemplo: { "correo": "ventas@inmobiliaria.com", "tipoCorreo": "Ventas" }
 */
export const createEmailSchema = z.object({
  correo: z.string().email('Debe ser un correo electrónico válido').max(150, 'El correo no puede exceder los 150 caracteres'),
  tipoCorreo: z.string().max(30, 'El tipo no puede exceder los 30 caracteres').optional()
}).strict();
