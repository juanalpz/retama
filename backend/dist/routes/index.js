"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
// Ver README.md de esta carpeta para la guía de cómo agregar un recurso nuevo.
const express_1 = require("express");
const health_routes_1 = require("./health.routes");
const property_routes_1 = require("./property.routes");
exports.router = (0, express_1.Router)();
exports.router.use("/health", health_routes_1.healthRouter);
exports.router.use("/properties", property_routes_1.propertyRouter);
//# sourceMappingURL=index.js.map