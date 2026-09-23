"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const app = (0, express_1.default)();
// Middleware para entender JSON en las peticiones[cite: 5]
app.use(express_1.default.json());
// Ruta de prueba (Health Check)[cite: 5]
app.get('/api/health', (req, res) => {
    return res.json({
        status: 'OK',
        message: 'El servidor de Retama está corriendo correctamente 🚀'
    });
});
// Registrar el módulo de rutas de Autenticación[cite: 2, 5]
app.use('/api/auth', auth_routes_1.default);
// Middleware global de captura de errores (SIEMPRE AL FINAL)[cite: 2]
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map