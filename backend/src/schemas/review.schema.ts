/**
 * validaciones de las reseñas de una inmobiliaria.
 */

import { z } from "zod";

// reseña de un interesado sobre una inmobiliaria: nombre, contenido y calificacion de 1 a 5
export const reviewSchema = z.object({
  nombreSolicitante: z.string().trim().min(1, "El nombre es obligatorio").max(100, "El nombre no puede exceder los 100 caracteres"),
  resenia: z.string().trim().min(1, "La reseña es obligatoria").max(2000, "La reseña no puede exceder los 2000 caracteres"),
  calificacion: z.number({ error: "La calificación debe ser un número entero entre 1 y 5" })
    .int("La calificación debe ser un número entero entre 1 y 5")
    .min(1, "La calificación mínima es 1")
    .max(5, "La calificación máxima es 5"),
});

export type ReviewDTO = z.infer<typeof reviewSchema>;
