/**
 * validaciones del modulo de autenticacion: login y registro.
 */

import { z } from 'zod';

// login: email y contraseña
export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'El formato de email no es válido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

// registro: datos del vendedor mas el nombre de fantasia de su inmobiliaria.
// el telefono es opcional y, si se informa, queda como telefono de contacto
// publico de la inmobiliaria.
export const registerSchema = z.object({
  nombre: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).max(100, { message: 'El nombre no puede exceder los 100 caracteres' }),
  apellido: z.string().trim().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }).max(100, { message: 'El apellido no puede exceder los 100 caracteres' }),
  email: z.string().trim().email({ message: 'El formato de correo electrónico no es válido' }).max(150, { message: 'El email no puede exceder los 150 caracteres' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  telefono: z.string().trim().min(6, { message: 'El teléfono es muy corto' }).max(50, { message: 'El teléfono es muy largo' }).optional(),
  nombreFantasia: z.string().trim().min(3, { message: 'El nombre de la inmobiliaria debe tener al menos 3 caracteres' }).max(150, { message: 'El nombre de la inmobiliaria no puede exceder los 150 caracteres' }),
  descripcion: z.string().trim().optional(),
});
