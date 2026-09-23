"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const app_1 = __importDefault(require("./app"));
const data_source_1 = require("./config/data-source");
const env_config_1 = require("./config/env.config");
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log('✅ Base de Datos PostgreSQL conectada con éxito vía TypeORM');
    app_1.default.listen(env_config_1.ENV.PORT, () => {
        console.log(`🚀 Servidor ejecutándose en http://localhost:${env_config_1.ENV.PORT}`);
    });
})
    .catch((error) => {
    console.error('❌ Error al conectar con la Base de Datos:', error);
});
//# sourceMappingURL=server.js.map