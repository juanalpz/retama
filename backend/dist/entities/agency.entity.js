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
exports.Agency = void 0;
const typeorm_1 = require("typeorm");
const seller_entity_1 = require("./seller.entity");
let Agency = class Agency {
    id;
    nombreFantasia;
    descripcion;
    logoUrl;
    direccionLinea1;
    direccionLinea2;
    seller;
    createdAt;
};
exports.Agency = Agency;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_inmobiliaria' }),
    __metadata("design:type", Number)
], Agency.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_fantasia', unique: true, type: "varchar", length: 150 }),
    __metadata("design:type", String)
], Agency.prototype, "nombreFantasia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Agency.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', type: "text", nullable: true }),
    __metadata("design:type", Object)
], Agency.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion_linea1', type: "varchar", length: 200, nullable: true }),
    __metadata("design:type", Object)
], Agency.prototype, "direccionLinea1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion_linea2', type: "varchar", length: 200, nullable: true }),
    __metadata("design:type", Object)
], Agency.prototype, "direccionLinea2", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => seller_entity_1.Seller, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_usuario" }),
    __metadata("design:type", seller_entity_1.Seller)
], Agency.prototype, "seller", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion' }),
    __metadata("design:type", Date)
], Agency.prototype, "createdAt", void 0);
exports.Agency = Agency = __decorate([
    (0, typeorm_1.Entity)("inmobiliarias")
], Agency);
//# sourceMappingURL=agency.entity.js.map