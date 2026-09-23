"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("reflect-metadata");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const data_source_1 = require("./config/data-source");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
const port = Number(process.env.PORT ?? 3000);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(routes_1.router);
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Data source initialized");
    app.listen(port, () => {
        console.log(`API running on http://localhost:${port}`);
    });
})
    .catch((error) => {
    console.error("Error initializing data source", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map