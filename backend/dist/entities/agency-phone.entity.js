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
exports.AgencyPhone = void 0;
const typeorm_1 = require("typeorm");
const agency_entity_1 = require("./agency.entity");
let AgencyPhone = class AgencyPhone {
    id;
    agency;
    telefono;
    tipoTelefono;
};
exports.AgencyPhone = AgencyPhone;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_telefono_inmobiliaria' }),
    __metadata("design:type", Number)
], AgencyPhone.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agency_entity_1.Agency, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_inmobiliaria" }),
    __metadata("design:type", agency_entity_1.Agency)
], AgencyPhone.prototype, "agency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50 }),
    __metadata("design:type", String)
], AgencyPhone.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_telefono', type: "varchar", length: 30, nullable: true }),
    __metadata("design:type", Object)
], AgencyPhone.prototype, "tipoTelefono", void 0);
exports.AgencyPhone = AgencyPhone = __decorate([
    (0, typeorm_1.Entity)("inmobiliarias_telefonos")
], AgencyPhone);
//# sourceMappingURL=agency-phone.entity.js.map