import { z } from "zod";

export const visitSchema = z.object({
  nombreVisitante: z.string().trim().min(1, "Nombre is required").max(100, "Nombre must be at most 100 characters"),
  apellidoVisitante: z.string().trim().min(1, "Apellido is required").max(100, "Apellido must be at most 100 characters"),
  telefonoVisitante: z.string().optional(),
  fechaPropuesta: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(), {
    message: "fechaPropuesta must be a valid date in the future",
  }),
  mensajeAsociado: z.string().optional(),
});

export type VisitDTO = z.infer<typeof visitSchema>;
