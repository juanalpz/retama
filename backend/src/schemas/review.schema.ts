import { z } from "zod";

export const reviewSchema = z.object({
  nombreSolicitante: z.string().trim().min(1, "El nombre es obligatorio").max(100, "El nombre no puede exceder los 100 caracteres"),
  resenia: z.string().trim().min(1, "La reseña es obligatoria").max(2000, "La reseña no puede exceder los 2000 caracteres"),
  calificacion: z.number().int().min(1).max(5),
});

export type ReviewDTO = z.infer<typeof reviewSchema>;
