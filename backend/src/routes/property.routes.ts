import { Router } from "express";
import { propertyController } from "../controllers/property.controller";

export const propertyRouter = Router();

propertyRouter.get("/", propertyController.listAll);
propertyRouter.get("/:id", propertyController.getById);
propertyRouter.get("/:id/comments", propertyController.getComments);
propertyRouter.post("/:id/comments", propertyController.createComment);
propertyRouter.post("/:id/visits", propertyController.createVisit);