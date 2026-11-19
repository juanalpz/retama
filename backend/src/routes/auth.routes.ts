/**
 * rutas de autenticacion: registro, login y sesion actual.
 * el body de registro y login se valida con zod antes de llegar al controlador.
 */

import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { validateSchema } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { authenticateToken } from '../middlewares/auth.middleware';

// =================================================================================
// endpoints: autenticación
// =================================================================================

const router = Router();

/**
 * @route POST /api/auth/register
 * @description registro de nuevo vendedor e inmobiliaria. validado mediante zod.
 * @access público
 */
router.post('/register', validateSchema(registerSchema), register);

/**
 * @route POST /api/auth/login
 * @description inicio de sesión de vendedor. validado mediante zod.
 * @access público
 */
router.post('/login', validateSchema(loginSchema), login);

/**
 * @route GET /api/auth/me
 * @description obtiene el perfil del vendedor autenticado (incluye su inmobiliaria) para la restauración de estado y sesión en el cliente.
 * @access privado (requiere validación de token JWT mediante middleware)
 */
router.get('/me', authenticateToken, getMe);

export default router;