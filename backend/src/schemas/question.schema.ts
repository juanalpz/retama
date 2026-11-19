/**
 * validaciones de las consultas sobre una propiedad y de su respuesta.
 */

import { z } from "zod";

// consulta que deja un interesado en una propiedad: nombre y contenido
export const questionSchema = z.object({
  nombreSolicitante: z.string().trim().min(1, "El nombre es obligatorio").max(100, "El nombre no puede exceder los 100 caracteres"),
  pregunta: z.string().trim().min(1, "La pregunta es obligatoria").max(2000, "La pregunta no puede exceder los 2000 caracteres"),
});

// respuesta del vendedor a una consulta
export const replySchema = z.object({
  respuestaVendedor: z.string().trim().min(1, "La respuesta es obligatoria").max(2000, "La respuesta no puede exceder los 2000 caracteres"),
});

export type QuestionDTO = z.infer<typeof questionSchema>;
