/**
 * logica del formulario de propiedad: valores iniciales, validacion y
 * conversion a lo que espera la api. esta separada del componente para que
 * el formulario solo se ocupe de dibujar.
 */

import type { PropertyPayload } from "../services/panel";
import type { Property } from "../types/api";

// valores del formulario. los numeros se guardan como texto porque asi los maneja un input.
export interface PropertyFormValues {
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  operacion: string;
  precio: string;
  moneda: string;
  direccionLinea1: string;
  barrioZona: string;
  superficieTotalM2: string;
  superficieCubiertaM2: string;
  ambientes: string;
  dormitorios: string;
  banios: string;
  antiguedad: string;
  tags: number[];
}

export const EMPTY_PROPERTY_FORM: PropertyFormValues = {
  titulo: "",
  descripcion: "",
  tipoPropiedad: "CASA",
  operacion: "VENTA",
  precio: "",
  moneda: "USD",
  direccionLinea1: "",
  barrioZona: "",
  superficieTotalM2: "",
  superficieCubiertaM2: "",
  ambientes: "",
  dormitorios: "",
  banios: "",
  antiguedad: "",
  tags: [],
};

// campos que no aplican a un terreno y se ocultan en el formulario
export const NON_LAND_FIELDS = ["superficieCubiertaM2", "ambientes", "dormitorios", "banios"] as const;

/**
 * convierte una propiedad de la api a los valores del formulario, para editarla.
 *
 * @param property propiedad a editar
 * @returns los valores con los que se precarga el formulario
 */
export const toFormValues = (property: Property): PropertyFormValues => {
  const text = (value: number | null) => (value === null || value === undefined ? "" : String(value));
  return {
    titulo: property.titulo,
    descripcion: property.descripcion ?? "",
    tipoPropiedad: property.tipoPropiedad ?? "CASA",
    operacion: property.operacion,
    precio: text(property.precio),
    moneda: property.moneda,
    direccionLinea1: property.direccionLinea1 ?? "",
    barrioZona: property.barrioZona ?? "",
    superficieTotalM2: text(property.superficieTotalM2),
    superficieCubiertaM2: text(property.superficieCubiertaM2),
    ambientes: text(property.ambientes),
    dormitorios: text(property.dormitorios),
    banios: text(property.banios),
    antiguedad: text(property.antiguedad),
    tags: (property.tags ?? []).map((item) => item.tag.id),
  };
};

/**
 * valida el formulario antes de enviarlo, con las mismas reglas que el backend.
 *
 * @param values valores actuales del formulario
 * @returns un objeto con el mensaje de error de cada campo invalido (vacio si esta todo bien)
 */
export const validateProperty = (values: PropertyFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  const esTerreno = values.tipoPropiedad === "TERRENO";

  // un entero opcional: si viene, tiene que ser un numero entero mayor o igual al minimo
  const optionalInt = (key: keyof PropertyFormValues, label: string, min: number) => {
    const raw = String(values[key]).trim();
    if (raw === "") return;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min) errors[key] = `${label} debe ser un número entero ${min === 0 ? "mayor o igual a 0" : "mayor a 0"}`;
  };

  if (values.titulo.trim().length < 3) errors.titulo = "El título debe tener al menos 3 caracteres";
  if (!values.descripcion.trim()) errors.descripcion = "La descripción es obligatoria";
  if (!(Number(values.precio) > 0)) errors.precio = "El precio debe ser mayor a 0";
  if (!values.direccionLinea1.trim()) errors.direccionLinea1 = "La dirección es obligatoria";
  if (!values.barrioZona.trim()) errors.barrioZona = "La zona o barrio es obligatoria";

  const total = Number(values.superficieTotalM2);
  if (!Number.isInteger(total) || total <= 0) errors.superficieTotalM2 = "La superficie total debe ser un número entero mayor a 0";

  if (!esTerreno) {
    const cubierta = Number(values.superficieCubiertaM2);
    if (!Number.isInteger(cubierta) || cubierta <= 0) errors.superficieCubiertaM2 = "La superficie cubierta debe ser un número entero mayor a 0";
    optionalInt("ambientes", "Ambientes", 1);
    optionalInt("dormitorios", "Dormitorios", 1);
    optionalInt("banios", "Baños", 1);
  }
  optionalInt("antiguedad", "La antigüedad", 0);

  return errors;
};

/**
 * convierte los valores del formulario al body que espera la api.
 * en un terreno no se envian superficie cubierta, ambientes, dormitorios ni baños.
 *
 * @param values valores ya validados
 * @returns el body para crear o editar la propiedad
 */
export const toPayload = (values: PropertyFormValues): PropertyPayload => {
  const esTerreno = values.tipoPropiedad === "TERRENO";
  const optional = (raw: string): number | null => (raw.trim() === "" ? null : Number(raw));

  return {
    titulo: values.titulo.trim(),
    descripcion: values.descripcion.trim(),
    tipoPropiedad: values.tipoPropiedad,
    operacion: values.operacion,
    precio: Number(values.precio),
    moneda: values.moneda,
    direccionLinea1: values.direccionLinea1.trim(),
    barrioZona: values.barrioZona.trim(),
    superficieTotalM2: Number(values.superficieTotalM2),
    superficieCubiertaM2: esTerreno ? null : Number(values.superficieCubiertaM2),
    ambientes: esTerreno ? null : optional(values.ambientes),
    dormitorios: esTerreno ? null : optional(values.dormitorios),
    banios: esTerreno ? null : optional(values.banios),
    antiguedad: optional(values.antiguedad),
    tags: values.tags,
  };
};
