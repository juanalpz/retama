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
exports.PropertyTag = void 0;
const typeorm_1 = require("typeorm");
const property_entity_1 = require("./property.entity");
const tag_entity_1 = require("./tag.entity");
let PropertyTag = class PropertyTag {
    id;
    property;
    tag;
};
exports.PropertyTag = PropertyTag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_propiedad_tag' }),
    __metadata("design:type", Number)
], PropertyTag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_propiedad" }),
    __metadata("design:type", property_entity_1.Property)
], PropertyTag.prototype, "property", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tag_entity_1.Tag, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_tag" }),
    __metadata("design:type", tag_entity_1.Tag)
], PropertyTag.prototype, "tag", void 0);
exports.PropertyTag = PropertyTag = __decorate([
    (0, typeorm_1.Entity)("propiedades_tags")
], PropertyTag);
//# sourceMappingURL=property-tag.entity.js.map