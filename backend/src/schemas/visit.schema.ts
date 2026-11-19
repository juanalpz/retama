/**
 * validaciones de las solicitudes de visita y definicion de su maquina de estados
 * (VISIT_STATES y VISIT_TRANSITIONS).
 */

import { z } from "zod";

// estados posibles de una solicitud de visita
export const VISIT_STATES = ["PENDIENTE", "CONFIRMADA", "REALIZADA", "CANCELADA", "RECHAZADA"] as const;

// transiciones permitidas: pendiente -> confirmada -> realizada,
// y cancelada o rechazada en cualquier momento mientras siga abierta.
// realizada, cancelada y rechazada son finales y no admiten mas cambios.
export const VISIT_TRANSITIONS: Record<string, string[]> = {
  PENDIENTE: ["CONFIRMADA", "RECHAZADA", "CANCELADA"],
  CONFIRMADA: ["REALIZADA", "CANCELADA", "RECHAZADA"],
};

// datos que deja el interesado al pedir una visita.
// el enunciado pide nombre y telefono obligatorios; el apellido y el mensaje son opcionales.
export const visitSchema = z.object({
  nombreVisitante: z.string().trim().min(1, "El nombre es obligatorio").max(100, "El nombre no puede exceder los 100 caracteres"),
  apellidoVisitante: z.string().trim().max(100, "El apellido no puede exceder los 100 caracteres").optional(),
  telefonoVisitante: z.string().trim().min(6, "El teléfono es obligatorio (mínimo 6 caracteres)").max(50, "El teléfono no puede exceder los 50 caracteres"),
  fechaPropuesta: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(), {
    message: "La fecha propuesta debe ser una fecha válida y futura",
  }),
  mensajeAsociado: z.string().trim().max(2000, "El mensaje no puede exceder los 2000 caracteres").optional(),
});

// body para cambiar el estado de una visita. acepta minusculas y las pasa a mayusculas.
export const visitStatusSchema = z.object({
  estado: z.string().trim().toUpperCase().pipe(
    z.enum(VISIT_STATES, { error: `El estado debe ser uno de: ${VISIT_STATES.join(", ")}` })
  ),
});

export type VisitDTO = z.infer<typeof visitSchema>;
