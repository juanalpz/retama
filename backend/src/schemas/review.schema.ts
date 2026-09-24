import { z } from "zod";

export const reviewSchema = z.object({
  nombreAutor: z.string().trim().min(1, "Nombre is required").max(100, "Nombre must be at most 100 characters"),
  emailAutor: z.string().email("Invalid email format"),
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().optional(),
});

export type ReviewDTO = z.infer<typeof reviewSchema>;
