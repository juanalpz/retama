import { Router } from "express";
import { propertyController } from "../controllers/property.controller";

export const propertyRouter = Router();

propertyRouter.get("/:id", propertyController.getById);
propertyRouter.post("/:id/comments", propertyController.createComment);