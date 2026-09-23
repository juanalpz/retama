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
exports.Property = void 0;
const typeorm_1 = require("typeorm");
const agency_entity_1 = require("./agency.entity");
const enum_1 = require("./enum");
let Property = class Property {
    id;
    title;
    description;
    type;
    operation;
    price;
    currency;
    address;
    area;
    coveredAreaM2;
    totalAreaM2;
    rooms;
    bedrooms;
    bathrooms;
    ageYears;
    tags;
    status;
    agency;
    createdAt;
    updatedAt;
};
exports.Property = Property;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Property.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], Property.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Property.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enum_1.PropertyType }),
    __metadata("design:type", String)
], Property.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enum_1.OperationType }),
    __metadata("design:type", String)
], Property.prototype, "operation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 14, scale: 2 }),
    __metadata("design:type", String)
], Property.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 3 }),
    __metadata("design:type", String)
], Property.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Property.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], Property.prototype, "area", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "coveredAreaM2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", String)
], Property.prototype, "totalAreaM2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "rooms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "bedrooms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "bathrooms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "ageYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-array", default: "" }),
    __metadata("design:type", Array)
], Property.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: enum_1.PropertyStatus, default: enum_1.PropertyStatus.DRAFT }),
    __metadata("design:type", String)
], Property.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agency_entity_1.Agency, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: "agency_id" }),
    __metadata("design:type", agency_entity_1.Agency)
], Property.prototype, "agency", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Property.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Property.prototype, "updatedAt", void 0);
exports.Property = Property = __decorate([
    (0, typeorm_1.Entity)("properties")
], Property);
//# sourceMappingURL=property.entity.js.map