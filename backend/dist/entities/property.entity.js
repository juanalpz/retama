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
let Property = class Property {
    id;
    agency;
    idTipoPropiedad;
    titulo;
    descripcion;
    operacion;
    ambientes;
    dormitorios;
    banios;
    superficieCubiertaM2;
    superficieTotalM2;
    precio;
    moneda;
    direccionLinea1;
    barrioZona;
    estado;
    createdAt;
    updatedAt;
};
exports.Property = Property;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_propiedad' }),
    __metadata("design:type", Number)
], Property.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agency_entity_1.Agency, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_inmobiliaria" }),
    __metadata("design:type", agency_entity_1.Agency)
], Property.prototype, "agency", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_tipo_propiedad', type: "int", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "idTipoPropiedad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 200 }),
    __metadata("design:type", String)
], Property.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20 }),
    __metadata("design:type", String)
], Property.prototype, "operacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "ambientes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "dormitorios", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "banios", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'superficie_cubierta_m2', type: "int", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "superficieCubiertaM2", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'superficie_total_m2', type: "int", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "superficieTotalM2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "precio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "moneda", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion_linea1', type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "direccionLinea1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'barrio_zona', type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Property.prototype, "barrioZona", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: "BORRADOR" }),
    __metadata("design:type", String)
], Property.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion' }),
    __metadata("design:type", Date)
], Property.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'fecha_actualizacion' }),
    __metadata("design:type", Date)
], Property.prototype, "updatedAt", void 0);
exports.Property = Property = __decorate([
    (0, typeorm_1.Entity)("propiedades")
], Property);
//# sourceMappingURL=property.entity.js.map