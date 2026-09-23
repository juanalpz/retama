/**
 * @fileoverview Esquemas de validación con Zod para el módulo de Autenticación.
 * Garantiza la integridad de los datos de entrada antes de ser procesados en los controladores[cite: 2, 3].
 */
import { z } from 'zod';
/**
 * Esquema Zod de validación para el inicio de sesión (Login).
 * Sanitiza los datos de entrada para evitar inyecciones o formatos inválidos.
 */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
/**
 * Esquema Zod de validación para el registro unificado de Vendedor e Inmobiliaria.
 */
export declare const registerSchema: z.ZodObject<{
    nombre: z.ZodString;
    apellido: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    nombreFantasia: z.ZodString;
    descripcion: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
