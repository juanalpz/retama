import { z } from "zod";

export const photoSchema = z.object({
  url: z.string().url("Invalid URL format"),
  orden: z.number().int().min(0).default(0),
  esPortada: z.boolean().default(false),
});

export const photoUpdateSchema = z.object({
  orden: z.number().int().min(0).optional(),
  esPortada: z.boolean().optional(),
});

export type PhotoDTO = z.infer<typeof photoSchema>;
export type PhotoUpdateDTO = z.infer<typeof photoUpdateSchema>;
