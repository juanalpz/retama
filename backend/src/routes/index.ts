// Ver README.md de esta carpeta para la guía de cómo agregar un recurso nuevo.
import { Router } from "express";

// Routers Públicos
import { healthRouter } from "./health.routes";
import { propertyRouter } from "./property.routes";
import { agencyRouter } from "./agency.routes";

// Routers de Autenticación
import authRoutes from './auth.routes';

// Routers Privados (Dashboard Vendedor)
import privateAgencyRoutes from './agency.routes';
import privatePropertyRoutes from './property.routes';
import { sellerCommentRouter } from './seller-comment.routes';
import { sellerVisitRouter } from './seller-visit.routes';
import { sellerReportRouter } from './seller-report.routes';
import { activityRouter } from './activity.routes';

export const router = Router();

// =================================================================================
// 1. RUTAS PÚBLICAS
// =================================================================================
router.use("/health", healthRouter);
router.use("/properties", propertyRouter);
router.use("/agencies", agencyRouter);

// =================================================================================
// 2. RUTAS DE AUTENTICACIÓN
// =================================================================================
router.use("/auth", authRoutes);

// =================================================================================
// 3. RUTAS PRIVADAS (Dashboard Vendedor)
// =================================================================================
router.use("/vendedor/inmobiliaria", privateAgencyRoutes);
router.use("/vendedor/propiedades", privatePropertyRoutes);
router.use("/vendedor/actividad", activityRouter);

// Estos routers ya incluyen el prefijo interno correspondiente en sus archivos
// ej. GET /api/vendedor/visitas o GET /api/vendedor/comentarios
router.use("/vendedor", sellerCommentRouter);
router.use("/vendedor", sellerVisitRouter);
router.use("/vendedor", sellerReportRouter);