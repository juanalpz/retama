import { z } from 'zod';

// ==========================================
// 3. ABM Y CICLO DE VIDA DE PROPIEDADES
// ==========================================

// ----------------------------------------------------------------------------------------------------

/**
 * Valores válidos para el tipo de propiedad.
 * Se corresponden con los establecidos en el dominio de la consigna:
 * Casa, Departamento, Terreno, Local (mapeado como COMERCIAL en el enum).
 */
const tiposPropiedad = ['CASA', 'DEPARTAMENTO', 'TERRENO', 'COMERCIAL'] as const;

/**
 * Valores válidos para el tipo de operación.
 */
const tiposOperacion = ['VENTA', 'ALQUILER'] as const;

/**
 * Valores válidos para la moneda del precio.
 */
const tiposMoneda = ['ARS', 'USD'] as const;

/**
 * Transiciones válidas del ciclo de vida de una propiedad.
 * Mapa: { estadoActual: [estadosPermitidos] }
 *
 * ```
 * BORRADOR ──→ PUBLICADA ──→ RESERVADA ──→ VENDIDA / ALQUILADA
 *                  ↕
 *               PAUSADA
 *               │
 *               └──→ CANCELADA   (desde cualquier estado activo)
 * ```
 */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  BORRADOR:   ['PUBLICADA', 'CANCELADA'],
  PUBLICADA:  ['RESERVADA', 'PAUSADA', 'CANCELADA'],
  PAUSADA:    ['PUBLICADA', 'CANCELADA'],
  RESERVADA:  ['VENDIDA', 'ALQUILADA', 'CANCELADA'],
};

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.1] Esquema de validación para crear una nueva propiedad.
 * Valida todos los campos obligatorios y las reglas de negocio:
 * - Precio mayor a 0.
 * - Superficies mayores a 0 cuando se informan.
 * - Tipo, operación y moneda dentro de los valores permitidos.
 *
 * @type {z.ZodObject<any>}
 *
 * @example
 * { "titulo": "Depto 2 amb", "operacion": "ALQUILER", "precio": 400, "moneda": "USD", ... }
 */
export const createPropertySchema = z.object({
  titulo: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder los 200 caracteres'),
  descripcion: z.string().optional(),
  tipoPropiedad: z.enum(tiposPropiedad, {
    error: `El tipo de propiedad debe ser uno de: ${tiposPropiedad.join(', ')}`
  }),
  operacion: z.enum(tiposOperacion, {
    error: `La operación debe ser una de: ${tiposOperacion.join(', ')}`
  }),
  precio: z.number()
    .positive('El precio debe ser mayor a 0'),
  moneda: z.enum(tiposMoneda, {
    error: `La moneda debe ser una de: ${tiposMoneda.join(', ')}`
  }),
  direccionLinea1: z.string()
    .max(100, 'La dirección no puede exceder los 100 caracteres')
    .optional(),
  barrioZona: z.string()
    .max(100, 'El barrio/zona no puede exceder los 100 caracteres')
    .optional(),
  superficieCubiertaM2: z.number()
    .positive('La superficie cubierta debe ser mayor a 0')
    .optional()
    .nullable(),
  superficieTotalM2: z.number()
    .positive('La superficie total debe ser mayor a 0')
    .optional()
    .nullable(),
  ambientes: z.number().int().positive().optional().nullable(),
  dormitorios: z.number().int().positive().optional().nullable(),
  banios: z.number().int().positive().optional().nullable(),
  antiguedad: z.number().int().min(0, 'La antigüedad no puede ser negativa').optional().nullable(),
  tags: z.array(z.number().int().positive()).optional(),
}).strict();

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.4] Esquema de validación para editar una propiedad existente.
 * Todos los campos son opcionales ya que se trata de una actualización parcial.
 * Se aplican las mismas reglas de negocio que en la creación cuando un campo se informa.
 *
 * @type {z.ZodObject<any>}
 *
 * @example
 * { "precio": 500, "moneda": "USD" }
 */
export const updatePropertySchema = z.object({
  titulo: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder los 200 caracteres')
    .optional(),
  descripcion: z.string().optional(),
  tipoPropiedad: z.enum(tiposPropiedad, {
    error: `El tipo de propiedad debe ser uno de: ${tiposPropiedad.join(', ')}`
  }).optional(),
  operacion: z.enum(tiposOperacion, {
    error: `La operación debe ser una de: ${tiposOperacion.join(', ')}`
  }).optional(),
  precio: z.number()
    .positive('El precio debe ser mayor a 0')
    .optional(),
  moneda: z.enum(tiposMoneda, {
    error: `La moneda debe ser una de: ${tiposMoneda.join(', ')}`
  }).optional(),
  direccionLinea1: z.string()
    .max(100, 'La dirección no puede exceder los 100 caracteres')
    .optional(),
  barrioZona: z.string()
    .max(100, 'El barrio/zona no puede exceder los 100 caracteres')
    .optional(),
  superficieCubiertaM2: z.number()
    .positive('La superficie cubierta debe ser mayor a 0')
    .optional()
    .nullable(),
  superficieTotalM2: z.number()
    .positive('La superficie total debe ser mayor a 0')
    .optional()
    .nullable(),
  ambientes: z.number().int().positive().optional().nullable(),
  dormitorios: z.number().int().positive().optional().nullable(),
  banios: z.number().int().positive().optional().nullable(),
  antiguedad: z.number().int().min(0, 'La antigüedad no puede ser negativa').optional().nullable(),
  tags: z.array(z.number().int().positive()).optional(),
}).strict();

// ----------------------------------------------------------------------------------------------------

/**
 * [Endpoint 3.5] Esquema de validación para cambiar el estado de una propiedad.
 * El nuevo estado se valida como un string no vacío; la transición válida
 * se verifica en el servicio contra el mapa `VALID_TRANSITIONS`.
 *
 * @type {z.ZodObject<any>}
 *
 * @example
 * { "nuevoEstado": "PUBLICADA" }
 */
export const changePropertyStatusSchema = z.object({
  nuevoEstado: z.string()
    .min(1, 'El nuevo estado es obligatorio')
    .max(30, 'El estado no puede exceder los 30 caracteres'),
}).strict();
