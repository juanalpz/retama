import type { Request, Response } from "express";
import { z } from "zod";
import { propertyService } from "../services/property.service";

const ID_REGEX = /^\d+$/;

const createCommentSchema = z.object({
  authorName: z.string().trim().min(1, "authorName is required").max(120),
  content: z.string().trim().min(1, "content is required").max(1000),
});

class PropertyController {
  async getById(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const property = await propertyService.getById(Number(id));

    if (!property) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    response.json(property);
  }

  // Ejemplo de validacion de body con zod. Falta la entidad Comment
  // (repository + service) para persistir esto de verdad.
  async createComment(request: Request, response: Response): Promise<void> {
    const { id } = request.params;

    if (typeof id !== "string" || !ID_REGEX.test(id)) {
      response.status(404).json({ message: "Property not found" });
      return;
    }

    const parseResult = createCommentSchema.safeParse(request.body);

    if (!parseResult.success) {
      response.status(400).json({ message: "Invalid body", issues: parseResult.error.issues });
      return;
    }

    // TODO: crear la entidad Comment y guardar esto via CommentRepository/CommentService.
    response.status(500).json({ message: "Not implemented" });
  }
}

export const propertyController = new PropertyController();