/**
 * validaciones del abm de propiedades y definicion de su maquina de estados
 * (PROPERTY_STATES y VALID_TRANSITIONS).
 */

import { z } from 'zod';
import { TIPOS_PROPIEDAD } from '../utils/property-type.utils';

const tiposOperacion = ['VENTA', 'ALQUILER'] as const;
const tiposMoneda = ['ARS', 'USD'] as const;

// todos los estados que puede tener una propiedad
export const PROPERTY_STATES = ['BORRADOR', 'PUBLICADA', 'PAUSADA', 'RESERVADA', 'VENDIDA', 'ALQUILADA', 'CANCELADA'] as const;

/**
 * transiciones validas del ciclo de vida. clave: estado actual, valor: destinos permitidos.
 *
 *   borrador -> publicada -> reservada -> vendida / alquilada
 *   publicada <-> pausada
 *   cancelada desde cualquier estado activo
 *
 * vendida, alquilada y cancelada son finales: no figuran como clave porque no tienen salida.
 */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  BORRADOR:   ['PUBLICADA', 'CANCELADA'],
  PUBLICADA:  ['RESERVADA', 'PAUSADA', 'CANCELADA'],
  PAUSADA:    ['PUBLICADA', 'CANCELADA'],
  RESERVADA:  ['VENDIDA', 'ALQUILADA', 'CANCELADA'],
};

/**
 * arma la validacion de un numero entero mayor a 0 que puede no venir.
 * se usa para la superficie cubierta, ambientes, dormitorios y baños.
 *
 * @param nombre nombre del campo, para armar los mensajes de error
 * @returns el schema de zod para ese campo
 */
const enteroPositivoOpcional = (nombre: string) =>
  z.number({ error: `${nombre} debe ser un número` })
    .int(`${nombre} debe ser un número entero`)
    .positive(`${nombre} debe ser mayor a 0`)
    .optional()
    .nullable();

// campos comunes al alta y a la edicion
const camposPropiedad = {
  titulo: z.string().trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder los 200 caracteres'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
  tipoPropiedad: z.enum(TIPOS_PROPIEDAD, {
    error: `El tipo de propiedad debe ser uno de: ${TIPOS_PROPIEDAD.join(', ')}`
  }),
  operacion: z.enum(tiposOperacion, {
    error: `La operación debe ser una de: ${tiposOperacion.join(', ')}`
  }),
  precio: z.number({ error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0'),
  moneda: z.enum(tiposMoneda, {
    error: `La moneda debe ser una de: ${tiposMoneda.join(', ')}`
  }),
  direccionLinea1: z.string().trim()
    .min(1, 'La dirección es obligatoria')
    .max(100, 'La dirección no puede exceder los 100 caracteres'),
  barrioZona: z.string().trim()
    .min(1, 'La zona o barrio es obligatoria')
    .max(100, 'El barrio/zona no puede exceder los 100 caracteres'),
  superficieTotalM2: z.number({ error: 'La superficie total debe ser un número' })
    .int('La superficie total debe ser un número entero')
    .positive('La superficie total debe ser mayor a 0'),
  superficieCubiertaM2: enteroPositivoOpcional('La superficie cubierta'),
  ambientes: enteroPositivoOpcional('Los ambientes'),
  dormitorios: enteroPositivoOpcional('Los dormitorios'),
  banios: enteroPositivoOpcional('Los baños'),
  antiguedad: z.number({ error: 'La antigüedad debe ser un número' })
    .int('La antigüedad debe ser un número entero')
    .min(0, 'La antigüedad no puede ser negativa')
    .optional()
    .nullable(),
  // ids de los tags (amenities). la lista disponible sale de GET /api/tags
  tags: z.array(z.number().int().positive()).optional(),
};

/**
 * alta de una propiedad. pide todos los campos obligatorios del enunciado.
 * la superficie cubierta es obligatoria salvo que el tipo sea terreno.
 *
 * ejemplo:
 * { "titulo": "Depto 2 amb", "descripcion": "...", "tipoPropiedad": "DEPARTAMENTO",
 *   "operacion": "ALQUILER", "precio": 400, "moneda": "USD", "direccionLinea1": "Bunge 100",
 *   "barrioZona": "Centro", "superficieTotalM2": 50, "superficieCubiertaM2": 45 }
 */
export const createPropertySchema = z.object(camposPropiedad).strict().superRefine((data, ctx) => {
  if (data.tipoPropiedad !== 'TERRENO' && (data.superficieCubiertaM2 === undefined || data.superficieCubiertaM2 === null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['superficieCubiertaM2'],
      message: 'La superficie cubierta es obligatoria (salvo para terrenos)',
    });
  }
});

/**
 * edicion de una propiedad. todos los campos son opcionales (actualizacion parcial)
 * y cuando un campo se envia se le aplican las mismas reglas que en el alta.
 *
 * ejemplo: { "precio": 500, "moneda": "USD" }
 */
export const updatePropertySchema = z.object(camposPropiedad).partial().strict();

/**
 * cambio de estado. aca solo se valida que el estado exista; que la transicion
 * sea valida se verifica en el servicio contra VALID_TRANSITIONS.
 *
 * ejemplo: { "nuevoEstado": "PUBLICADA" }
 */
export const changePropertyStatusSchema = z.object({
  nuevoEstado: z.string().trim().toUpperCase().pipe(
    z.enum(PROPERTY_STATES, { error: `El estado debe ser uno de: ${PROPERTY_STATES.join(', ')}` })
  ),
}).strict();
