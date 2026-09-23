"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyRouter = void 0;
const express_1 = require("express");
const property_controller_1 = require("../controllers/property.controller");
exports.propertyRouter = (0, express_1.Router)();
exports.propertyRouter.get("/:id", property_controller_1.propertyController.getById);
exports.propertyRouter.post("/:id/comments", property_controller_1.propertyController.createComment);
//# sourceMappingURL=property.routes.js.map