"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const data_source_1 = require("./data-source");
async function initDatabase() {
    try {
        // Intenta conectar con el contenedor de Docker
        await data_source_1.AppDataSource.initialize();
        console.log('✅ Conexión con PostgreSQL en Docker establecida exitosamente.');
    }
    catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error);
    }
}
//# sourceMappingURL=db.init.js.map