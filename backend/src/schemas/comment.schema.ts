import { z } from "zod";

export const commentSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre is required").max(100, "Nombre must be at most 100 characters"),
  email: z.string().email("Invalid email format"),
  comentario: z.string().trim().min(1, "Comentario is required").max(2000, "Comentario must be at most 2000 characters"),
  tipoComentario: z.string().optional(),
});

export type CommentDTO = z.infer<typeof commentSchema>;
