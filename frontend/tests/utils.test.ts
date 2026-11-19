/**
 * notion: "modularizacion y estilos", "ciclo de vida de la propiedad",
 * "solicitudes de visita" y "mis propiedades: abm".
 *
 * prueba las reglas que viven fuera de los componentes: que acciones ofrece
 * cada estado, la validacion del formulario de propiedad y los hooks propios.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "../src/hooks/usePolling";
import { useSubmitLock } from "../src/hooks/useSubmitLock";
import type { EstadoPropiedad, EstadoVisita } from "../src/types/api";
import { nowForInput, timeAgo } from "../src/utils/dates";
import { coverUrl, formatPrice } from "../src/utils/format";
import { groupByProperty } from "../src/utils/group";
import { EMPTY_PROPERTY_FORM, toFormValues, toPayload, validateProperty, type PropertyFormValues } from "../src/utils/propertyForm";
import { canCancelProperty, propertyActions, visitActions } from "../src/utils/status";
import { property } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
});

/**
 * devuelve los textos de los botones de estado de una propiedad.
 *
 * @param estado estado actual
 * @param operacion venta o alquiler
 * @returns las etiquetas de las acciones disponibles
 */
const labels = (estado: EstadoPropiedad, operacion: "VENTA" | "ALQUILER" = "VENTA"): string[] => propertyActions(estado, operacion).map((action) => action.label);

describe("acciones segun el estado de la propiedad", () => {
  it("un borrador solo se puede publicar: nunca ofrece marcar vendida", () => {
    expect(labels("BORRADOR")).toEqual(["Publicar"]);
  });

  it("una publicada se puede pausar o reservar, y una pausada se republica", () => {
    expect(labels("PUBLICADA")).toEqual(["Pausar", "Marcar reservada"]);
    expect(labels("PAUSADA")).toEqual(["Republicar"]);
  });

  it("una reservada se cierra segun su operacion, y el cierre pide confirmacion", () => {
    expect(labels("RESERVADA", "VENTA")).toEqual(["Marcar vendida"]);
    expect(labels("RESERVADA", "ALQUILER")).toEqual(["Marcar alquilada"]);
    expect(propertyActions("RESERVADA", "VENTA")[0].confirm).toBeTruthy();
    expect(propertyActions("RESERVADA", "ALQUILER")[0].confirm).toBeTruthy();
  });

  it("vendida, alquilada y cancelada no ofrecen acciones ni baja", () => {
    for (const estado of ["VENDIDA", "ALQUILADA", "CANCELADA"] as EstadoPropiedad[]) {
      expect(labels(estado)).toEqual([]);
      expect(canCancelProperty(estado)).toBe(false);
    }
  });

  it("cualquier estado activo se puede dar de baja", () => {
    for (const estado of ["BORRADOR", "PUBLICADA", "PAUSADA", "RESERVADA"] as EstadoPropiedad[]) {
      expect(canCancelProperty(estado)).toBe(true);
    }
  });
});

describe("acciones segun el estado de la visita", () => {
  it("pendiente: confirmar o rechazar; confirmada: realizada o cancelar", () => {
    expect(visitActions("PENDIENTE").map((action) => action.label)).toEqual(["Confirmar", "Rechazar"]);
    expect(visitActions("CONFIRMADA").map((action) => action.label)).toEqual(["Marcar realizada", "Cancelar"]);
  });

  it("rechazar y cancelar piden confirmacion; confirmar y realizada no", () => {
    expect(visitActions("PENDIENTE").map((action) => Boolean(action.confirm))).toEqual([false, true]);
    expect(visitActions("CONFIRMADA").map((action) => Boolean(action.confirm))).toEqual([false, true]);
  });

  it("realizada, cancelada y rechazada no ofrecen mas acciones", () => {
    for (const estado of ["REALIZADA", "CANCELADA", "RECHAZADA"] as EstadoVisita[]) {
      expect(visitActions(estado)).toEqual([]);
    }
  });
});

describe("validacion del formulario de propiedad", () => {
  const valido: PropertyFormValues = {
    ...EMPTY_PROPERTY_FORM,
    titulo: "Depto con vista al mar",
    descripcion: "Luminoso",
    precio: "90000",
    direccionLinea1: "Av. del Mar 320",
    barrioZona: "Centro",
    superficieTotalM2: "50",
    superficieCubiertaM2: "45",
  };

  it("un formulario completo no tiene errores", () => {
    expect(validateProperty(valido)).toEqual({});
  });

  it("marca el precio en 0, negativo o vacio", () => {
    for (const precio of ["0", "-10", "", "abc"]) {
      expect(validateProperty({ ...valido, precio }).precio).toBe("El precio debe ser mayor a 0");
    }
  });

  it("marca las superficies en 0 o negativas", () => {
    expect(validateProperty({ ...valido, superficieTotalM2: "0" }).superficieTotalM2).toBeDefined();
    expect(validateProperty({ ...valido, superficieTotalM2: "-5" }).superficieTotalM2).toBeDefined();
    expect(validateProperty({ ...valido, superficieCubiertaM2: "0" }).superficieCubiertaM2).toBeDefined();
  });

  it("exige titulo, descripcion, direccion y zona", () => {
    const errores = validateProperty(EMPTY_PROPERTY_FORM);
    expect(Object.keys(errores)).toEqual(expect.arrayContaining(["titulo", "descripcion", "precio", "direccionLinea1", "barrioZona", "superficieTotalM2"]));
  });

  it("en un terreno no valida ni envia superficie cubierta, ambientes, dormitorios ni baños", () => {
    const terreno = { ...valido, tipoPropiedad: "TERRENO", superficieCubiertaM2: "", ambientes: "-1", dormitorios: "x", banios: "0" };
    expect(validateProperty(terreno)).toEqual({});
    expect(toPayload(terreno)).toMatchObject({ superficieCubiertaM2: null, ambientes: null, dormitorios: null, banios: null });
  });

  it("convierte los textos del formulario a numeros y deja en null los opcionales vacios", () => {
    expect(toPayload({ ...valido, ambientes: "2", antiguedad: "" })).toMatchObject({
      precio: 90000,
      superficieTotalM2: 50,
      superficieCubiertaM2: 45,
      ambientes: 2,
      dormitorios: null,
      antiguedad: null,
    });
  });

  it("editar precarga los datos actuales de la propiedad", () => {
    expect(toFormValues(property({ antiguedad: null }))).toMatchObject({
      titulo: "Casa con pileta en Ostende",
      tipoPropiedad: "CASA",
      operacion: "VENTA",
      precio: "120000",
      moneda: "USD",
      barrioZona: "Ostende",
      superficieTotalM2: "600",
      ambientes: "4",
      antiguedad: "",
      tags: [1],
    });
  });
});

describe("formato y agrupado", () => {
  it("el precio lleva moneda, separador de miles y /mes en los alquileres", () => {
    expect(formatPrice(120000, "USD", "VENTA")).toBe("USD 120.000");
    expect(formatPrice(900000, "ARS", "ALQUILER")).toBe("ARS 900.000/mes");
  });

  it("la portada es la foto marcada, o la primera por orden si no hay ninguna", () => {
    expect(coverUrl({ fotos: [{ id: 1, url: "a.jpg", orden: 0, esPortada: false }, { id: 2, url: "b.jpg", orden: 1, esPortada: true }] })).toBe("b.jpg");
    expect(coverUrl({ fotos: [{ id: 1, url: "a.jpg", orden: 2, esPortada: false }, { id: 2, url: "b.jpg", orden: 1, esPortada: false }] })).toBe("b.jpg");
    expect(coverUrl({ fotos: [] })).toBeNull();
  });

  it("agrupa consultas o visitas por propiedad respetando el orden de llegada", () => {
    const grupos = groupByProperty([
      { id: 1, property: { id: 5, titulo: "Depto" } },
      { id: 2, property: { id: 8, titulo: "Casa" } },
      { id: 3, property: { id: 5, titulo: "Depto" } },
    ]);
    expect(grupos.map((grupo) => [grupo.titulo, grupo.items.map((item) => item.id)])).toEqual([
      ["Depto", [1, 3]],
      ["Casa", [2]],
    ]);
  });

  it("las fechas relativas se leen en lenguaje natural", () => {
    const hace = (minutos: number) => new Date(Date.now() - minutos * 60000).toISOString();
    expect(timeAgo(hace(0))).toBe("recién");
    expect(timeAgo(hace(5))).toBe("hace 5 min");
    expect(timeAgo(hace(180))).toBe("hace 3 h");
    expect(timeAgo(hace(60 * 24))).toBe("ayer");
  });

  it("el minimo del selector de fecha es el momento actual en hora local", () => {
    expect(nowForInput()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(Math.abs(new Date(nowForInput()).getTime() - Date.now())).toBeLessThan(2 * 60000);
  });
});

describe("hook usePolling", () => {
  it("llama al instante, repite en cada intervalo y se detiene al desmontar", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { unmount } = renderHook(() => usePolling(callback, 15000));

    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30000);
    expect(callback).toHaveBeenCalledTimes(3);

    unmount();
    vi.advanceTimersByTime(60000);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("deshabilitado no llama ni deja intervalos", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    renderHook(() => usePolling(callback, 15000, false));
    vi.advanceTimersByTime(60000);
    expect(callback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("hook useSubmitLock", () => {
  it("ignora un segundo envio mientras el primero sigue en curso", async () => {
    let terminar: () => void = () => {};
    const accion = vi.fn(() => new Promise<void>((resolve) => (terminar = resolve)));
    const { result } = renderHook(() => useSubmitLock());

    let primero: Promise<void> = Promise.resolve();
    act(() => {
      primero = result.current[1](accion);
      result.current[1](accion);
    });
    expect(accion).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(true);

    await act(async () => {
      terminar();
      await primero;
    });
    expect(result.current[0]).toBe(false);
  });
});
