// Ver README.md de esta carpeta para la guía de cómo agregar un recurso nuevo.
import { Router } from "express";
import { healthRouter } from "./health.routes";
import { propertyRouter } from "./property.routes";

export const router = Router();

router.use("/health", healthRouter);
router.use("/properties", propertyRouter);