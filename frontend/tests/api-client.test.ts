/**
 * notion: "cliente de api y tipos" y "setup del frontend".
 *
 * prueba la capa unica para hablar con el back: la url base, el token en el
 * header, la normalizacion de errores y el cierre de sesion ante un 401.
 * aca los servicios son los reales; lo unico simulado es la red.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createReview, createVisit, listAgencies } from "../src/services/agencies";
import { login } from "../src/services/auth";
import { http } from "../src/services/http";
import { changePropertyStatus, getAverageTimeOnMarket, getStatusSummary, getUnreadCount, replyQuestion } from "../src/services/panel";
import { listProperties } from "../src/services/properties";
import { SESSION_EXPIRED_EVENT, getToken, saveSession } from "../src/services/session";
import { USER } from "./helpers";

// ultimo pedido que salio hacia la red
let sent: InternalAxiosRequestConfig | null = null;

/**
 * hace que el proximo pedido termine con una respuesta exitosa.
 *
 * @param data body que devuelve el back simulado
 * @returns nada
 */
const respondWith = (data: unknown): void => {
  http.defaults.adapter = async (config) => {
    sent = config;
    return { data, status: 200, statusText: "OK", headers: {}, config } as AxiosResponse;
  };
};

/**
 * hace que el proximo pedido termine con un error del back.
 *
 * @param status codigo http
 * @param data body del error, con la forma { error, details? }
 * @returns nada
 */
const failWith = (status: number, data: unknown): void => {
  http.defaults.adapter = async (config) => {
    sent = config;
    const response = { data, status, statusText: "", headers: {}, config } as AxiosResponse;
    throw new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, response);
  };
};

beforeEach(() => {
  sent = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("cliente http", () => {
  it("usa como url base la variable de entorno, o el back local si no esta definida", () => {
    expect(http.defaults.baseURL).toBe((import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, ""));
  });

  it("agrega el token al header authorization de forma automatica", async () => {
    saveSession("abc123", USER);
    respondWith({ sinLeer: 0 });
    await getUnreadCount();
    expect(sent?.headers.Authorization).toBe("Bearer abc123");
  });

  it("sin sesion no manda el header authorization", async () => {
    respondWith({ data: [], total: 0, page: 1, limit: 12, totalPages: 0 });
    await listProperties({});
    expect(sent?.headers.Authorization).toBeUndefined();
  });
});

describe("normalizacion de errores", () => {
  it("entrega el mensaje del back y los errores por campo", async () => {
    failWith(409, { error: "El email ya está registrado", details: [{ field: "email", message: "Ya existe una cuenta con ese email" }] });
    await expect(login("a@b.com", "123456")).rejects.toEqual({
      status: 409,
      message: "El email ya está registrado",
      fields: { email: "Ya existe una cuenta con ese email" },
    });
  });

  it("si un campo tiene varios errores se queda con el primero", async () => {
    failWith(400, {
      error: "Datos inválidos",
      details: [
        { field: "precio", message: "El precio debe ser mayor a 0" },
        { field: "precio", message: "Otro error" },
      ],
    });
    await expect(listProperties({})).rejects.toMatchObject({ status: 400, fields: { precio: "El precio debe ser mayor a 0" } });
  });

  it("si el back no responde muestra un mensaje propio y no un 'network error'", async () => {
    http.defaults.adapter = async (config) => {
      throw new AxiosError("Network Error", "ERR_NETWORK", config);
    };
    const error = await listProperties({}).catch((err) => err);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/No pudimos conectar con el servidor/);
    expect(error.message).not.toMatch(/Network Error/i);
  });
});

describe("sesion vencida", () => {
  it("un 401 con sesion iniciada limpia el token y avisa a la aplicacion", async () => {
    saveSession("vencido", USER);
    const onExpired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    failWith(401, { error: "Token inválido o expirado" });

    await expect(getUnreadCount()).rejects.toMatchObject({ status: 401 });

    expect(getToken()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  });

  it("un 401 sin sesion (login con datos incorrectos) no dispara el aviso", async () => {
    const onExpired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    failWith(401, { error: "Credenciales inválidas" });

    await expect(login("a@b.com", "mala")).rejects.toMatchObject({ status: 401, message: "Credenciales inválidas" });

    expect(onExpired).not.toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  });
});

describe("servicios por recurso", () => {
  it("el listado de propiedades manda solo los filtros con valor y une los amenities con coma", async () => {
    respondWith({ data: [], total: 0, page: 1, limit: 12, totalPages: 0 });
    await listProperties({ q: "", tipo: "CASA", operacion: "", minPrice: "50000", tags: ["Pileta", "Cochera"], page: 2, limit: 12 });
    expect(sent?.method).toBe("get");
    expect(sent?.url).toBe("/properties");
    expect(sent?.params).toEqual({ tipo: "CASA", minPrice: "50000", tags: "Pileta,Cochera", page: 2, limit: 12 });
  });

  it("el directorio de inmobiliarias no manda el nombre si esta vacio", async () => {
    respondWith({ data: [], total: 0, page: 1, limit: 12, totalPages: 0 });
    await listAgencies({ nombre: "" });
    expect(sent?.url).toBe("/agencies");
    expect(sent?.params).toEqual({ nombre: undefined, page: 1, limit: 12 });
  });

  it("pedir una visita y dejar una reseña pegan en la ruta publica del recurso", async () => {
    respondWith({ id: 1 });
    await createVisit(7, { nombreVisitante: "Ana", telefonoVisitante: "1155550000", fechaPropuesta: "2030-01-01T10:00:00.000Z" });
    expect(sent?.method).toBe("post");
    expect(sent?.url).toBe("/properties/7/visits");

    await createReview(3, { nombreSolicitante: "Ana", resenia: "Muy bien", calificacion: 5 });
    expect(sent?.url).toBe("/agencies/3/reviews");
    expect(JSON.parse(sent?.data as string)).toEqual({ nombreSolicitante: "Ana", resenia: "Muy bien", calificacion: 5 });
  });

  it("las acciones del vendedor usan las rutas del panel y desarman la respuesta", async () => {
    respondWith({ propiedad: { id: 4, estado: "PUBLICADA" } });
    const propiedad = await changePropertyStatus(4, "PUBLICADA");
    expect(sent?.method).toBe("patch");
    expect(sent?.url).toBe("/vendedor/propiedades/4/estado");
    expect(JSON.parse(sent?.data as string)).toEqual({ nuevoEstado: "PUBLICADA" });
    expect(propiedad).toEqual({ id: 4, estado: "PUBLICADA" });

    respondWith({ id: 9, respuestaVendedor: "Sí" });
    await replyQuestion(9, "Sí");
    expect(sent?.method).toBe("put");
    expect(sent?.url).toBe("/vendedor/comentarios/9/respuesta");
  });

  it("cada reporte tiene su ruta y devuelve el dato ya desarmado", async () => {
    respondWith({ propiedadesPorEstado: [{ estado: "PUBLICADA", cantidad: 4 }] });
    expect(await getStatusSummary()).toEqual([{ estado: "PUBLICADA", cantidad: 4 }]);
    expect(sent?.url).toBe("/vendedor/reportes/por-estado");

    respondWith({ tiempoPromedioMercadoDias: null });
    expect(await getAverageTimeOnMarket()).toBeNull();
    expect(sent?.url).toBe("/vendedor/reportes/tiempo-en-mercado");
  });
});

/**
 * junta todos los archivos de codigo de una carpeta, recorriendo las subcarpetas.
 *
 * @param dir carpeta a recorrer
 * @returns las rutas de los archivos .ts y .tsx
 */
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });

describe("reglas de la capa de servicios (revision del codigo fuente)", () => {
  const files = sourceFiles(join(process.cwd(), "src")).map((path) => ({
    path: path.replace(/\\/g, "/").split("/src/")[1],
    code: readFileSync(path, "utf-8"),
  }));

  it("ningun componente, pagina, hook o contexto usa axios o fetch directo", () => {
    const fueraDeServicios = files.filter((file) => !file.path.startsWith("services/"));
    const culpables = fueraDeServicios.filter((file) => /from\s+["']axios["']/.test(file.code) || /\bfetch\(/.test(file.code));
    expect(culpables.map((file) => file.path)).toEqual([]);
  });

  it("la url de la api solo aparece en la configuracion de entorno", () => {
    const culpables = files.filter((file) => file.path !== "config/env.ts" && /https?:\/\/(localhost|127\.0\.0\.1)/.test(file.code));
    expect(culpables.map((file) => file.path)).toEqual([]);
  });

  it("ningun archivo supera las 250 lineas", () => {
    // la capa de servicios del panel es un listado plano de llamadas y queda afuera del limite
    const largos = files.filter((file) => file.path !== "services/panel.ts" && file.code.split("\n").length > 250);
    expect(largos.map((file) => file.path)).toEqual([]);
  });
});
