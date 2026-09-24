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
exports.PropertyPhoto = void 0;
const typeorm_1 = require("typeorm");
const property_entity_1 = require("./property.entity");
let PropertyPhoto = class PropertyPhoto {
    id;
    property;
    url;
    orden;
    esPortada;
};
exports.PropertyPhoto = PropertyPhoto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_foto' }),
    __metadata("design:type", Number)
], PropertyPhoto.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_propiedad" }),
    __metadata("design:type", property_entity_1.Property)
], PropertyPhoto.prototype, "property", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], PropertyPhoto.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], PropertyPhoto.prototype, "orden", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'es_portada', type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], PropertyPhoto.prototype, "esPortada", void 0);
exports.PropertyPhoto = PropertyPhoto = __decorate([
    (0, typeorm_1.Entity)("propiedades_fotos")
], PropertyPhoto);
//# sourceMappingURL=property-photo.entity.js.map