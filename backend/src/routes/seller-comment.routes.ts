/**
 * @fileoverview Rutas de Comentarios del Dashboard del Vendedor.
 * Permite al vendedor ver las consultas recibidas y responderlas.
 */

import { Router } from "express";
import { sellerCommentController } from "../controllers/seller-comment.controller";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware";

export const sellerCommentRouter = Router();

// Middleware de auth global para todas las rutas de este router
sellerCommentRouter.use(authenticateToken, authorizeRoles('VENDEDOR', 'ADMIN'));

/**
 * @route GET /api/vendedor/comentarios
 * @description Lista todos los comentarios recibidos en las propiedades de la inmobiliaria. Permite filtro ?sinResponder=true.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerCommentRouter.get("/comentarios", sellerCommentController.getComments);

/**
 * @route GET /api/vendedor/propiedades/:id/comentarios
 * @description Lista los comentarios de una propiedad específica perteneciente a la inmobiliaria.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerCommentRouter.get("/propiedades/:id/comentarios", sellerCommentController.getPropertyComments);

/**
 * @route PUT /api/vendedor/comentarios/:id/respuesta
 * @description Permite al vendedor responder a una consulta o reseña recibida en su propiedad.
 * @access Privado (Requiere token JWT con rol VENDEDOR o ADMIN)
 */
sellerCommentRouter.put("/comentarios/:id/respuesta", sellerCommentController.replyToComment);
