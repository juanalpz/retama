/**
 * @fileoverview Rutas de Salud del Sistema (Health Check).
 * Endpoint básico para monitoreo de uptime y disponibilidad del servicio.
 */

import { Router } from "express";
import { getHealth } from "../controllers/health.controller";

// =================================================================================
// ENDPOINTS: HEALTH CHECK
// =================================================================================

export const healthRouter = Router();

/**
 * @route GET /api/health
 * @description Verifica el estado y disponibilidad de la API REST.
 * @access Público
 */
healthRouter.get("/", getHealth);