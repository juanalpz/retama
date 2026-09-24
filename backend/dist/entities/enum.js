"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoActividad = exports.EstadoVisita = exports.EstadoPropiedad = exports.TipoOperacion = exports.TipoPropiedad = void 0;
// Tipos de propiedad
var TipoPropiedad;
(function (TipoPropiedad) {
    TipoPropiedad["CASA"] = "CASA";
    TipoPropiedad["DEPARTAMENTO"] = "DEPARTAMENTO";
    TipoPropiedad["TERRENO"] = "TERRENO";
    TipoPropiedad["COMERCIAL"] = "COMERCIAL";
})(TipoPropiedad || (exports.TipoPropiedad = TipoPropiedad = {}));
// Tipos de operación
var TipoOperacion;
(function (TipoOperacion) {
    TipoOperacion["VENTA"] = "VENTA";
    TipoOperacion["ALQUILER"] = "ALQUILER";
})(TipoOperacion || (exports.TipoOperacion = TipoOperacion = {}));
// Estados de una propiedad
var EstadoPropiedad;
(function (EstadoPropiedad) {
    EstadoPropiedad["BORRADOR"] = "BORRADOR";
    EstadoPropiedad["PUBLICADA"] = "PUBLICADA";
    EstadoPropiedad["RESERVADA"] = "RESERVADA";
    EstadoPropiedad["PAUSADA"] = "PAUSADA";
    EstadoPropiedad["VENDIDA"] = "VENDIDA";
    EstadoPropiedad["ALQUILADA"] = "ALQUILADA";
    EstadoPropiedad["CANCELADA"] = "CANCELADA";
})(EstadoPropiedad || (exports.EstadoPropiedad = EstadoPropiedad = {}));
// Estados de una solicitud de visita
var EstadoVisita;
(function (EstadoVisita) {
    EstadoVisita["PENDIENTE"] = "PENDIENTE";
    EstadoVisita["CONFIRMADA"] = "CONFIRMADA";
    EstadoVisita["COMPLETADA"] = "COMPLETADA";
    EstadoVisita["CANCELADA"] = "CANCELADA";
    EstadoVisita["RECHAZADA"] = "RECHAZADA";
})(EstadoVisita || (exports.EstadoVisita = EstadoVisita = {}));
// Tipos de actividad
var TipoActividad;
(function (TipoActividad) {
    TipoActividad["COMENTARIO"] = "COMENTARIO";
    TipoActividad["SOLICITUD_VISITA"] = "SOLICITUD_VISITA";
    TipoActividad["CAMBIO_ESTADO"] = "CAMBIO_ESTADO";
    TipoActividad["RESENIA"] = "RESENIA";
})(TipoActividad || (exports.TipoActividad = TipoActividad = {}));
//# sourceMappingURL=enum.js.map