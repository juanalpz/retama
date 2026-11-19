/**
 * estados de propiedades y visitas: como se muestran y que acciones admite cada uno.
 * la interfaz ofrece solo las transiciones validas, pero quien decide es el backend.
 */

import type { EstadoPropiedad, EstadoVisita, Operacion } from "../types/api";

export const PROPERTY_STATUS_LABELS: Record<EstadoPropiedad, string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  PAUSADA: "Pausada",
  RESERVADA: "Reservada",
  VENDIDA: "Vendida",
  ALQUILADA: "Alquilada",
  CANCELADA: "Cancelada",
};

export const VISIT_STATUS_LABELS: Record<EstadoVisita, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
  RECHAZADA: "Rechazada",
};

// clases de color de la etiqueta de cada estado
export const STATUS_STYLES: Record<string, string> = {
  BORRADOR: "bg-stone-100 text-stone-600",
  PUBLICADA: "bg-brand-100 text-brand-700",
  PAUSADA: "bg-stone-200 text-stone-700",
  RESERVADA: "bg-brand-300 text-brand-900",
  VENDIDA: "bg-brand-700 text-white",
  ALQUILADA: "bg-brand-700 text-white",
  CANCELADA: "bg-red-50 text-red-700",
  PENDIENTE: "bg-stone-200 text-stone-700",
  CONFIRMADA: "bg-brand-100 text-brand-700",
  REALIZADA: "bg-brand-700 text-white",
  RECHAZADA: "bg-red-50 text-red-700",
};

// estados en los que una propiedad ya no se puede editar
export const FINAL_PROPERTY_STATES: EstadoPropiedad[] = ["VENDIDA", "ALQUILADA", "CANCELADA"];

export interface StatusAction<T extends string> {
  // estado al que lleva la accion
  to: T;
  label: string;
  // las acciones que cierran o cancelan piden confirmacion
  confirm?: string;
}

/**
 * acciones de cambio de estado que se ofrecen para una propiedad.
 * no incluye "dar de baja", que se maneja aparte.
 *
 * @param estado estado actual de la propiedad
 * @param operacion VENTA o ALQUILER, define como se cierra una reserva
 * @returns las acciones validas, en el orden en que se muestran
 */
export const propertyActions = (estado: EstadoPropiedad, operacion: Operacion): StatusAction<EstadoPropiedad>[] => {
  switch (estado) {
    case "BORRADOR":
      return [{ to: "PUBLICADA", label: "Publicar" }];
    case "PUBLICADA":
      return [
        { to: "PAUSADA", label: "Pausar" },
        { to: "RESERVADA", label: "Marcar reservada" },
      ];
    case "PAUSADA":
      return [{ to: "PUBLICADA", label: "Republicar" }];
    case "RESERVADA":
      return operacion === "VENTA"
        ? [{ to: "VENDIDA", label: "Marcar vendida", confirm: "Una propiedad vendida ya no se puede editar ni cambiar de estado." }]
        : [{ to: "ALQUILADA", label: "Marcar alquilada", confirm: "Una propiedad alquilada ya no se puede editar ni cambiar de estado." }];
    default:
      return [];
  }
};

/**
 * indica si una propiedad se puede dar de baja desde la interfaz.
 *
 * @param estado estado actual de la propiedad
 * @returns true para borrador, publicada, pausada y reservada
 */
export const canCancelProperty = (estado: EstadoPropiedad): boolean => !FINAL_PROPERTY_STATES.includes(estado);

/**
 * acciones que se ofrecen para una visita segun su estado.
 *
 * @param estado estado actual de la visita
 * @returns las acciones validas; vacio si la visita ya esta cerrada
 */
export const visitActions = (estado: EstadoVisita): StatusAction<EstadoVisita>[] => {
  switch (estado) {
    case "PENDIENTE":
      return [
        { to: "CONFIRMADA", label: "Confirmar" },
        { to: "RECHAZADA", label: "Rechazar", confirm: "La persona que pidió la visita no va a poder venir en esa fecha." },
      ];
    case "CONFIRMADA":
      return [
        { to: "REALIZADA", label: "Marcar realizada" },
        { to: "CANCELADA", label: "Cancelar", confirm: "La visita confirmada se va a cancelar." },
      ];
    default:
      return [];
  }
};
