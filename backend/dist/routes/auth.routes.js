"use strict";
/**
 * @fileoverview Rutas de Autenticación de la API REST.
 * Asocia las URLs '/register' y '/login' con sus respectivos controladores y middlewares
 * de validación de esquemas Zod (OWASP A03 - Input Validation).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const auth_schema_1 = require("../schemas/auth.schema");
const router = (0, express_1.Router)();
/**
 * @route PORT /api/auth/register
 * @description Registro de nuevo vendedor e inmobiliaria. Validado mediante Zod.
 * @access Público
 */
router.post('/register', (0, validate_middleware_1.validateSchema)(auth_schema_1.registerSchema), auth_controller_1.register);
/**
 * @route POST /api/auth/login
 * @description Inicio de sesión de vendedor. Validado mediante Zod.
 * @access Público
 */
router.post('/login', (0, validate_middleware_1.validateSchema)(auth_schema_1.loginSchema), auth_controller_1.login);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map