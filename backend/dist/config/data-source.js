"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
/**
 * Configuración principal de TypeORM para conectar Express con PostgreSQL.
 */
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: '127.0.0.1',
    port: 5433,
    username: 'postgres',
    password: 'postgres',
    database: 'retama_db',
    synchronize: true, // Recrea las tablas automáticamente en desarrollo a partir de las entidades
    logging: false,
    entities: ['src/entities/**/*.ts'],
    migrations: ['src/migrations/**/*.ts'],
});
//# sourceMappingURL=data-source.js.map