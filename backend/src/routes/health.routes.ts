/**
 * ruta de salud de la api. sirve para comprobar que el servidor esta respondiendo.
 */

import { Router } from "express";
import { getHealth } from "../controllers/health.controller";

// =================================================================================
// endpoints: health check
// =================================================================================

export const healthRouter = Router();

/**
 * @route GET /api/health
 * @description verifica el estado y disponibilidad de la API REST.
 * @access público
 */
healthRouter.get("/", getHealth);