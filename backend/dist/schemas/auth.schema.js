"use strict";
/**
 * @fileoverview Esquemas de validación con Zod para el módulo de Autenticación.
 * Garantiza la integridad de los datos de entrada antes de ser procesados en los controladores[cite: 2, 3].
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
/**
 * Esquema Zod de validación para el inicio de sesión (Login).
 * Sanitiza los datos de entrada para evitar inyecciones o formatos inválidos.
 */
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'El formato de email no es válido' }),
    password: zod_1.z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});
/**
 * Esquema Zod de validación para el registro unificado de Vendedor e Inmobiliaria.
 */
exports.registerSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    apellido: zod_1.z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
    email: zod_1.z.string().email({ message: 'El formato de correo electrónico no es válido' }),
    password: zod_1.z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    nombreFantasia: zod_1.z.string().min(3, { message: 'El nombre de la inmobiliaria debe tener al menos 3 caracteres' }),
    descripcion: zod_1.z.string().optional()
});
//# sourceMappingURL=auth.schema.js.map