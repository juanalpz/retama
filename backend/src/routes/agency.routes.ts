import { Router } from "express";
import { agencyController } from "../controllers/agency.controller";

export const agencyRouter = Router();

agencyRouter.get("/", agencyController.listAll);
agencyRouter.get("/:id", agencyController.getById);
agencyRouter.get("/:id/properties", agencyController.getProperties);
agencyRouter.get("/:id/reviews", agencyController.getReviews);
agencyRouter.post("/:id/reviews", agencyController.createReview);
