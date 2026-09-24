import { z } from "zod";

export const questionSchema = z.object({
  nombreSolicitante: z.string().trim().min(1, "El nombre es obligatorio").max(100, "El nombre no puede exceder los 100 caracteres"),
  pregunta: z.string().trim().min(1, "La pregunta es obligatoria").max(2000, "La pregunta no puede exceder los 2000 caracteres"),
});

export type QuestionDTO = z.infer<typeof questionSchema>;
