/**
 * validaciones de la galeria de fotos de una propiedad.
 */

import { z } from "zod";

// alta de una foto: la url de la imagen, su posicion en la galeria y si es la portada
export const photoSchema = z.object({
  url: z.string().trim().url("La URL de la foto no es válida"),
  orden: z.number().int().min(0, "El orden no puede ser negativo").default(0),
  esPortada: z.boolean().default(false),
});

// edicion de una foto: solo se puede cambiar el orden o marcarla como portada
export const photoUpdateSchema = z.object({
  orden: z.number().int().min(0, "El orden no puede ser negativo").optional(),
  esPortada: z.boolean().optional(),
});

export type PhotoDTO = z.infer<typeof photoSchema>;
export type PhotoUpdateDTO = z.infer<typeof photoUpdateSchema>;
