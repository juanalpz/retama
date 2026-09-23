"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../config/data-source");
async function seed() {
    await data_source_1.AppDataSource.initialize();
    console.log("Seed pendiente: agregar datos de desarrollo para el dominio.");
    await data_source_1.AppDataSource.destroy();
}
seed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
//# sourceMappingURL=seed.js.map