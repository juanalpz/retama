/**
 * @fileoverview Rutas de Autenticación de la API REST.
 * Asocia las URLs '/register' y '/login' con sus respectivos controladores y middlewares
 * de validación de esquemas Zod (OWASP A03 - Input Validation).
 */

import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validateSchema } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { validate } from 'zod/mini';

const router = Router();

/**
 * @route PORT /api/auth/register
 * @description Registro de nuevo vendedor e inmobiliaria. Validado mediante Zod.
 * @access Público
 */
router.post('/register', validateSchema(registerSchema), register);

/**
 * @route POST /api/auth/login
 * @description Inicio de sesión de vendedor. Validado mediante Zod.
 * @access Público
 */
router.post('/login', validateSchema(loginSchema), login);

export default router;