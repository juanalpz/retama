"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyStatusHistory = void 0;
const typeorm_1 = require("typeorm");
const property_entity_1 = require("./property.entity");
const enum_1 = require("./enum");
let PropertyStatusHistory = class PropertyStatusHistory {
    id;
    fromStatus;
    toStatus;
    property;
    createdAt;
};
exports.PropertyStatusHistory = PropertyStatusHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PropertyStatusHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enum_1.PropertyStatus }),
    __metadata("design:type", String)
], PropertyStatusHistory.prototype, "fromStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enum_1.PropertyStatus }),
    __metadata("design:type", String)
], PropertyStatusHistory.prototype, "toStatus", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "property_id" }),
    __metadata("design:type", property_entity_1.Property)
], PropertyStatusHistory.prototype, "property", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PropertyStatusHistory.prototype, "createdAt", void 0);
exports.PropertyStatusHistory = PropertyStatusHistory = __decorate([
    (0, typeorm_1.Entity)("property_status_history")
], PropertyStatusHistory);
//# sourceMappingURL=property-status-history.entity.js.map