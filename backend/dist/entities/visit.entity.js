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
exports.Visit = void 0;
const typeorm_1 = require("typeorm");
const property_entity_1 = require("./property.entity");
let Visit = class Visit {
    id;
    property;
    nombreVisitante;
    apellidoVisitante;
    telefonoVisitante;
    fechaPropuesta;
    mensajeAsociado;
    estado;
};
exports.Visit = Visit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_visita' }),
    __metadata("design:type", Number)
], Visit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_propiedad" }),
    __metadata("design:type", property_entity_1.Property)
], Visit.prototype, "property", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre_visitante', type: "varchar", length: 100 }),
    __metadata("design:type", String)
], Visit.prototype, "nombreVisitante", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apellido_visitante', type: "varchar", length: 100 }),
    __metadata("design:type", String)
], Visit.prototype, "apellidoVisitante", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono_visitante', type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Visit.prototype, "telefonoVisitante", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_propuesta', type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], Visit.prototype, "fechaPropuesta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mensaje_asociado', type: "text", nullable: true }),
    __metadata("design:type", Object)
], Visit.prototype, "mensajeAsociado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30, default: "PENDIENTE" }),
    __metadata("design:type", String)
], Visit.prototype, "estado", void 0);
exports.Visit = Visit = __decorate([
    (0, typeorm_1.Entity)("visitas")
], Visit);
//# sourceMappingURL=visit.entity.js.map