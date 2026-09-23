"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyRepository = void 0;
const data_source_1 = require("../config/data-source");
const property_entity_1 = require("../entities/property.entity");
class PropertyRepository {
    get repository() {
        return data_source_1.AppDataSource.getRepository(property_entity_1.Property);
    }
    findById(id) {
        return this.repository.findOneBy({ id });
    }
}
exports.propertyRepository = new PropertyRepository();
//# sourceMappingURL=property.repository.js.map