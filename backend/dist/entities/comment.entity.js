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
exports.Comment = void 0;
const typeorm_1 = require("typeorm");
const property_entity_1 = require("./property.entity");
let Comment = class Comment {
    id;
    property;
    tipoComentario;
    nombre;
    comentario;
    respuestaVendedor;
    fechaCreacion;
};
exports.Comment = Comment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_comentario' }),
    __metadata("design:type", Number)
], Comment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "id_propiedad" }),
    __metadata("design:type", property_entity_1.Property)
], Comment.prototype, "property", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_comentario', type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], Comment.prototype, "tipoComentario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], Comment.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Comment.prototype, "comentario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'respuesta_vendedor', type: "text", nullable: true }),
    __metadata("design:type", Object)
], Comment.prototype, "respuestaVendedor", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_creacion' }),
    __metadata("design:type", Date)
], Comment.prototype, "fechaCreacion", void 0);
exports.Comment = Comment = __decorate([
    (0, typeorm_1.Entity)("comentarios")
], Comment);
//# sourceMappingURL=comment.entity.js.map