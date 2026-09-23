"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyService = void 0;
const property_repository_1 = require("../repositories/property.repository");
class PropertyService {
    getById(id) {
        return property_repository_1.propertyRepository.findById(id);
    }
}
exports.propertyService = new PropertyService();
//# sourceMappingURL=property.service.js.map