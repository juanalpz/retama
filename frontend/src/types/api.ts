/**
 * tipos de los datos que devuelve la api.
 * siguen la forma real de las respuestas, documentada en docs/api-documentation.md.
 */

export type TipoPropiedad = "CASA" | "DEPARTAMENTO" | "TERRENO" | "COMERCIAL";
export type Operacion = "VENTA" | "ALQUILER";
export type Moneda = "ARS" | "USD";
export type EstadoPropiedad = "BORRADOR" | "PUBLICADA" | "PAUSADA" | "RESERVADA" | "VENDIDA" | "ALQUILADA" | "CANCELADA";
export type EstadoVisita = "PENDIENTE" | "CONFIRMADA" | "REALIZADA" | "CANCELADA" | "RECHAZADA";

// resultado paginado que devuelven todos los listados
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// amenity (pileta, cochera, etc)
export interface Tag {
  id: number;
  tag: string;
}

export interface Photo {
  id: number;
  url: string;
  orden: number;
  esPortada: boolean;
}

export interface AgencyPhone {
  id: number;
  telefono: string;
  tipoTelefono: string | null;
}

export interface AgencyEmail {
  id: number;
  correo: string;
  tipoCorreo: string | null;
}

// inmobiliaria. telefonos, correos y los datos de reseñas solo vienen en algunos endpoints.
export interface Agency {
  id: number;
  nombreFantasia: string;
  descripcion: string | null;
  logoUrl: string | null;
  direccionLinea1: string | null;
  direccionLinea2: string | null;
  createdAt: string;
  telefonos?: AgencyPhone[];
  correos?: AgencyEmail[];
  calificacionPromedio?: number | null;
  cantidadResenias?: number;
}

export interface StatusHistory {
  id: number;
  estadoViejo: EstadoPropiedad;
  estadoNuevo: EstadoPropiedad;
  fechaCambio: string;
}

// propiedad. tags no viene en el listado del panel e historialEstados solo en su detalle.
export interface Property {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipoPropiedad: TipoPropiedad | null;
  operacion: Operacion;
  precio: number;
  moneda: Moneda;
  direccionLinea1: string | null;
  barrioZona: string | null;
  superficieTotalM2: number | null;
  superficieCubiertaM2: number | null;
  ambientes: number | null;
  dormitorios: number | null;
  banios: number | null;
  antiguedad: number | null;
  estado: EstadoPropiedad;
  createdAt: string;
  updatedAt: string;
  fotos: Photo[];
  // cada elemento es la relacion propiedad-tag; el amenity esta en .tag
  tags?: { id: number; tag: Tag }[];
  agency: Agency;
  historialEstados?: StatusHistory[];
}

// consulta de un interesado sobre una propiedad
export interface Question {
  id: number;
  nombreSolicitante: string;
  pregunta: string;
  respuestaVendedor: string | null;
  fechaCreacion: string;
  property?: Pick<Property, "id" | "titulo">;
}

export interface Visit {
  id: number;
  nombreVisitante: string;
  apellidoVisitante: string | null;
  telefonoVisitante: string;
  fechaPropuesta: string;
  mensajeAsociado: string | null;
  estado: EstadoVisita;
  fechaCreacion: string;
  property?: Pick<Property, "id" | "titulo">;
}

export interface Review {
  id: number;
  nombreSolicitante: string;
  resenia: string;
  calificacion: number;
  fechaCreacion: string;
}

export interface Activity {
  id: number;
  tipo: "COMENTARIO" | "SOLICITUD_VISITA" | "RESENIA" | "CAMBIO_ESTADO";
  referenciaId: number;
  referenciaTipo: "pregunta" | "visita" | "resenia" | "propiedad";
  mensaje: string | null;
  leido: boolean;
  fechaCreacion: string;
}

// vendedor autenticado, con los datos basicos de su inmobiliaria
export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  createdAt: string;
  inmobiliaria: Pick<Agency, "id" | "nombreFantasia" | "descripcion" | "logoUrl" | "direccionLinea1" | "direccionLinea2"> | null;
}

// error de la api ya normalizado para mostrar en pantalla
export interface ApiError {
  // codigo http, o 0 si no hubo respuesta del servidor
  status: number;
  message: string;
  // errores por campo, cuando la api los informa
  fields: Record<string, string>;
}
