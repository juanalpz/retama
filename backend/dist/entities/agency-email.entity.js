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
exports.AgencyEmail = void 0;
const typeorm_1 = require("typeorm");
const agency_entity_1 = require("./agency.entity");
let AgencyEmail = class AgencyEmail {
    id;
    agency;
    correo;
    tipoCorreo;
};
exports.AgencyEmail = AgencyEmail;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_correo_inmobiliaria' }),
    __metadata("design:type", Number)
], AgencyEmail.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => agency_entity_1.Agency, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_inmobiliaria" }),
    __metadata("design:type", agency_entity_1.Agency)
], AgencyEmail.prototype, "agency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 150 }),
    __metadata("design:type", String)
], AgencyEmail.prototype, "correo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_correo', type: "varchar", length: 30, nullable: true }),
    __metadata("design:type", Object)
], AgencyEmail.prototype, "tipoCorreo", void 0);
exports.AgencyEmail = AgencyEmail = __decorate([
    (0, typeorm_1.Entity)("inmobiliarias_correos")
], AgencyEmail);
//# sourceMappingURL=agency-email.entity.js.map