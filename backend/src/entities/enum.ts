// Tipos de propiedad
export enum TipoPropiedad {
  CASA = "CASA",
  DEPARTAMENTO = "DEPARTAMENTO",
  TERRENO = "TERRENO",
  COMERCIAL = "COMERCIAL",
}

// Tipos de operación
export enum TipoOperacion {
  VENTA = "VENTA",
  ALQUILER = "ALQUILER",
}

// Estados de una propiedad
export enum EstadoPropiedad {
  BORRADOR = "BORRADOR",
  PUBLICADA = "PUBLICADA",
  RESERVADA = "RESERVADA",
  PAUSADA = "PAUSADA",
  VENDIDA = "VENDIDA",
  ALQUILADA = "ALQUILADA",
  CANCELADA = "CANCELADA",
}

// Estados de una solicitud de visita
export enum EstadoVisita {
  PENDIENTE = "PENDIENTE",
  CONFIRMADA = "CONFIRMADA",
  COMPLETADA = "COMPLETADA",
  CANCELADA = "CANCELADA",
  RECHAZADA = "RECHAZADA",
}

// Tipos de actividad
export enum TipoActividad {
  COMENTARIO = "COMENTARIO",
  SOLICITUD_VISITA = "SOLICITUD_VISITA",
  CAMBIO_ESTADO = "CAMBIO_ESTADO",
  RESENIA = "RESENIA",
}