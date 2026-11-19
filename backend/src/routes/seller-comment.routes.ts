/**
 * rutas de las consultas recibidas por el vendedor (/api/vendedor/comentarios).
 * todas exigen token.
 */

import { Router } from "express";
import { sellerCommentController } from "../controllers/seller-comment.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";
import { validateSchema } from "../middlewares/validate.middleware";
import { replySchema } from "../schemas/question.schema";

// =================================================================================
// endpoints: gestión de consultas (dashboard vendedor)
// =================================================================================

export const sellerCommentRouter = Router();

// middleware de auth global para todas las rutas de este router
sellerCommentRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/comentarios
 * @description lista todos los comentarios/consultas recibidos en la inmobiliaria. permite filtro ?sinResponder=true.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerCommentRouter.get("/comentarios", sellerCommentController.getComments);

/**
 * @route GET /api/vendedor/propiedades/:id/comentarios
 * @description lista los comentarios de una propiedad específica perteneciente a la inmobiliaria.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerCommentRouter.get("/propiedades/:id/comentarios", sellerCommentController.getPropertyComments);

/**
 * @route PUT /api/vendedor/comentarios/:id/respuesta
 * @description permite al vendedor responder a una consulta recibida.
 * @access privado (requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerCommentRouter.put("/comentarios/:id/respuesta", validateSchema(replySchema), sellerCommentController.replyToComment);
