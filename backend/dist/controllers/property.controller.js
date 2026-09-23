"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyController = void 0;
const zod_1 = require("zod");
const property_service_1 = require("../services/property.service");
const ID_REGEX = /^\d+$/;
const createCommentSchema = zod_1.z.object({
    authorName: zod_1.z.string().trim().min(1, "authorName is required").max(120),
    content: zod_1.z.string().trim().min(1, "content is required").max(1000),
});
class PropertyController {
    async getById(request, response) {
        const { id } = request.params;
        if (typeof id !== "string" || !ID_REGEX.test(id)) {
            response.status(404).json({ message: "Property not found" });
            return;
        }
        const property = await property_service_1.propertyService.getById(Number(id));
        if (!property) {
            response.status(404).json({ message: "Property not found" });
            return;
        }
        response.json(property);
    }
    // Ejemplo de validacion de body con zod. Falta la entidad Comment
    // (repository + service) para persistir esto de verdad.
    async createComment(request, response) {
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
exports.propertyController = new PropertyController();
//# sourceMappingURL=property.controller.js.map