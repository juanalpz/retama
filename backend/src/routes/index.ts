/**
 * router raiz de la api: junta los routers de cada recurso y les pone su prefijo.
 * app.ts lo monta bajo /api. ver README.md de esta carpeta para agregar un recurso nuevo.
 */
import { Router } from "express";

// routers públicos
import { healthRouter } from "./health.routes";
import { propertyRouter, tagRouter } from "./property.routes";
import { agencyRouter } from "./agency.routes";

// routers de autenticación
import authRoutes from './auth.routes';

// routers privados (dashboard vendedor)
import privateAgencyRoutes from './agency.routes';
import privatePropertyRoutes from './property.routes';
import { sellerCommentRouter } from './seller-comment.routes';
import { sellerVisitRouter } from './seller-visit.routes';
import { sellerReportRouter } from './seller-report.routes';
import { activityRouter } from './activity.routes';

export const router = Router();

// =================================================================================
// 1. rutas públicas
// =================================================================================
router.use("/health", healthRouter);
router.use("/properties", propertyRouter);
router.use("/agencies", agencyRouter);
router.use("/tags", tagRouter);

// =================================================================================
// 2. rutas de autenticación
// =================================================================================
router.use("/auth", authRoutes);

// =================================================================================
// 3. rutas privadas (dashboard vendedor)
// =================================================================================
router.use("/vendedor/inmobiliaria", privateAgencyRoutes);
router.use("/vendedor/propiedades", privatePropertyRoutes);
router.use("/vendedor/actividad", activityRouter);

// estos routers ya incluyen el prefijo interno correspondiente en sus archivos
// ej. GET /api/vendedor/visitas o GET /api/vendedor/comentarios
router.use("/vendedor", sellerCommentRouter);
router.use("/vendedor", sellerVisitRouter);
router.use("/vendedor", sellerReportRouter);