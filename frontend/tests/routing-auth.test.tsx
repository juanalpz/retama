/**
 * notion: "ruteo y layouts" y "registro y login del vendedor".
 *
 * monta la aplicacion completa en cada url y prueba la navegacion, las rutas
 * protegidas y el ciclo de la sesion. la capa de servicios esta simulada.
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_EXPIRED_EVENT } from "../src/services/session";
import { USER, api, apiError, renderApp, resetApi, signIn } from "./helpers";

vi.mock("../src/services/auth");
vi.mock("../src/services/properties");
vi.mock("../src/services/agencies");
vi.mock("../src/services/panel");

beforeEach(() => {
  resetApi();
});

describe("ruteo: cada pantalla tiene su url y se puede abrir directo", () => {
  it.each([
    ["/", 2, /Propiedades disponibles/],
    ["/propiedades/2", 1, "Casa con pileta en Ostende"],
    ["/inmobiliarias", 1, "Inmobiliarias"],
    ["/inmobiliarias/1", 1, "Inmobiliaria del Mar"],
    ["/login", 1, "Ingresar"],
    ["/registro", 1, "Crear cuenta"],
  ])("la ruta publica %s muestra su pantalla", async (path, level, name) => {
    renderApp(path);
    expect(await screen.findByRole("heading", { level, name })).toBeInTheDocument();
  });

  it.each([
    ["/panel/propiedades", "Mis propiedades"],
    ["/panel/propiedades/nueva", "Nueva propiedad"],
    ["/panel/propiedades/2/editar", "Editar propiedad"],
    ["/panel/inmobiliaria", "Mi inmobiliaria"],
    ["/panel/visitas", "Solicitudes de visita"],
    ["/panel/consultas", "Consultas"],
    ["/panel/actividad", "Actividad"],
    ["/panel/reportes", "Reportes"],
  ])("la ruta del panel %s muestra su pantalla con la sesion iniciada", async (path, name) => {
    signIn();
    renderApp(path);
    expect(await screen.findByRole("heading", { level: 1, name })).toBeInTheDocument();
  });

  it("/panel lleva a mis propiedades", async () => {
    signIn();
    renderApp("/panel");
    expect(await screen.findByRole("heading", { level: 1, name: "Mis propiedades" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/panel/propiedades");
  });

  it("una ruta inexistente muestra la pagina 404, tambien dentro del panel", async () => {
    renderApp("/no-existe");
    expect(await screen.findByRole("heading", { name: "No encontramos esa página" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  });

  it("una ruta inexistente del panel tambien muestra la pagina 404", async () => {
    signIn();
    renderApp("/panel/no-existe");
    expect(await screen.findByRole("heading", { name: "No encontramos esa página" })).toBeInTheDocument();
  });
});

describe("layouts", () => {
  it("el layout publico ofrece ingresar como vendedor", async () => {
    renderApp("/");
    const ingresar = await screen.findByRole("link", { name: /^Ingresar/ });
    expect(ingresar).toHaveAttribute("href", "/login");
    expect(ingresar).toHaveTextContent(/como vendedor/);
  });

  it("con la sesion iniciada el layout publico ofrece volver al panel", async () => {
    signIn();
    renderApp("/");
    const links = await screen.findAllByRole("link", { name: "Mi panel" });
    expect(links[0]).toHaveAttribute("href", "/panel/propiedades");
    expect(screen.queryByRole("link", { name: /^Ingresar/ })).not.toBeInTheDocument();
  });

  it("el panel tiene la navegacion mis propiedades, visitas, consultas, actividad y reportes", async () => {
    signIn();
    renderApp("/panel/propiedades");
    const nav = await screen.findByRole("navigation", { name: "Secciones del panel" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Mis propiedades", "Visitas", "Consultas", "Actividad", "Reportes"]);
  });

  it("la navegacion del panel marca solo la seccion activa", async () => {
    signIn();
    renderApp("/panel/consultas");
    const nav = await screen.findByRole("navigation", { name: "Secciones del panel" });
    const activos = within(nav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(activos.map((link) => link.textContent)).toEqual(["Consultas"]);
  });

  it("la navegacion publica marca la seccion activa", async () => {
    renderApp("/inmobiliarias");
    const nav = await screen.findByRole("navigation", { name: "Secciones" });
    expect(within(nav).getByRole("link", { name: "Inmobiliarias" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Propiedades" })).not.toHaveAttribute("aria-current");
  });
});

describe("rutas protegidas", () => {
  it("entrar al panel sin sesion redirige al login", async () => {
    renderApp("/panel/reportes");
    expect(await screen.findByRole("heading", { level: 1, name: "Ingresar" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
    expect(api.panel.getStatusSummary).not.toHaveBeenCalled();
  });

  it("despues del login vuelve a la pantalla a la que se queria ir", async () => {
    const user = userEvent.setup();
    renderApp("/panel/visitas?estado=TODAS");

    await user.type(await screen.findByLabelText("Email"), "juan@inmobiliaria.com");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "123456");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Solicitudes de visita" })).toBeInTheDocument();
    expect(window.location.pathname + window.location.search).toBe("/panel/visitas?estado=TODAS");
  });

  it("con la sesion iniciada, /login y /registro llevan al panel", async () => {
    signIn();
    renderApp("/login");
    expect(await screen.findByRole("heading", { level: 1, name: "Mis propiedades" })).toBeInTheDocument();
  });

  it("si la api avisa que la sesion vencio (401) se vuelve al login", async () => {
    signIn();
    renderApp("/panel/reportes");
    await screen.findByRole("heading", { level: 1, name: "Reportes" });

    // el interceptor http limpia el token y emite este evento ante un 401
    act(() => {
      localStorage.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(await screen.findByRole("heading", { level: 1, name: "Ingresar" })).toBeInTheDocument();
  });
});

describe("registro", () => {
  /**
   * completa el formulario de registro con datos validos.
   *
   * @param user instancia de user-event
   * @returns una promesa que resuelve cuando termino de escribir
   */
  const fillRegister = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(await screen.findByLabelText("Nombre"), "  Juan ");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("Email"), "juan@inmobiliaria.com");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "123456");
    await user.type(screen.getByLabelText("Nombre de tu inmobiliaria"), "Inmobiliaria del Mar");
  };

  it("pide nombre, apellido, email, contraseña, telefono opcional y nombre de la inmobiliaria", async () => {
    renderApp("/registro");
    await screen.findByRole("heading", { name: "Crear cuenta" });
    for (const label of ["Nombre", "Apellido", "Email", "Teléfono de contacto (opcional)", "Nombre de tu inmobiliaria"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByLabelText(/^Contraseña/, { selector: "input" })).toHaveAttribute("type", "password");
  });

  it("con datos incompletos marca cada campo y no llama al back", async () => {
    const user = userEvent.setup();
    renderApp("/registro");
    await user.click(await screen.findByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByText("Ingresá tu nombre")).toBeInTheDocument();
    expect(screen.getByText("Ingresá un email válido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener al menos 6 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Ingresá el nombre de tu inmobiliaria")).toBeInTheDocument();
    expect(api.auth.register).not.toHaveBeenCalled();
  });

  it("crea la cuenta y la inmobiliaria en un paso, guarda la sesion y entra al panel", async () => {
    const user = userEvent.setup();
    renderApp("/registro");
    await fillRegister(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Mis propiedades" })).toBeInTheDocument();
    expect(api.auth.register).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Juan", apellido: "Pérez", email: "juan@inmobiliaria.com", password: "123456", nombreFantasia: "Inmobiliaria del Mar" }));
    expect(localStorage.getItem("retama.token")).toBe("token-de-prueba");
  });

  it("un email repetido (409) muestra el error del back junto al campo email", async () => {
    api.auth.register.mockRejectedValue(apiError(409, "El email ya está registrado", { email: "Ya existe una cuenta con ese email" }));
    const user = userEvent.setup();
    renderApp("/registro");
    await fillRegister(user);
    const email = screen.getByLabelText("Email");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const mensaje = await screen.findByText("Ya existe una cuenta con ese email");
    expect(mensaje.closest("label")).toContainElement(email);
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(window.location.pathname).toBe("/registro");
  });

  it("un nombre de fantasia repetido (409) muestra el error junto a ese campo", async () => {
    api.auth.register.mockRejectedValue(apiError(409, "Nombre en uso", { nombreFantasia: "Ya existe una inmobiliaria con ese nombre" }));
    const user = userEvent.setup();
    renderApp("/registro");
    await fillRegister(user);
    const fantasia = screen.getByLabelText("Nombre de tu inmobiliaria");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    const mensaje = await screen.findByText("Ya existe una inmobiliaria con ese nombre");
    expect(mensaje.closest("label")).toContainElement(fantasia);
  });
});

describe("login", () => {
  it("credenciales invalidas muestran un mensaje claro sin limpiar el email", async () => {
    api.auth.login.mockRejectedValue(apiError(401, "Credenciales inválidas"));
    const user = userEvent.setup();
    renderApp("/login");
    const email = await screen.findByLabelText("Email");
    await user.type(email, "juan@inmobiliaria.com");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "incorrecta");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El email o la contraseña no son correctos.");
    expect(email).toHaveValue("juan@inmobiliaria.com");
    expect(localStorage.getItem("retama.token")).toBeNull();
  });

  it("sin email o sin contraseña avisa en cada campo y no llama al back", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    await user.click(await screen.findByRole("button", { name: "Ingresar" }));
    expect(screen.getByText("Ingresá tu email")).toBeInTheDocument();
    expect(screen.getByText("Ingresá tu contraseña")).toBeInTheDocument();
    expect(api.auth.login).not.toHaveBeenCalled();
  });

  it("el boton mostrar/ocultar cambia la visibilidad de la contraseña", async () => {
    const user = userEvent.setup();
    renderApp("/login");
    const password = await screen.findByLabelText(/^Contraseña/, { selector: "input" });
    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(password).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("mientras se envia el boton queda deshabilitado y no se repite el pedido", async () => {
    api.auth.login.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderApp("/login");
    await user.type(await screen.findByLabelText("Email"), "juan@inmobiliaria.com");
    await user.type(screen.getByLabelText(/^Contraseña/, { selector: "input" }), "123456{Enter}");

    const boton = await screen.findByRole("button", { name: "Ingresando..." });
    expect(boton).toBeDisabled();
    await user.click(boton);
    expect(api.auth.login).toHaveBeenCalledTimes(1);
  });
});

describe("sesion", () => {
  it("recargar la pagina con la sesion iniciada mantiene al vendedor adentro", async () => {
    signIn();
    renderApp("/panel/reportes");
    expect(await screen.findByRole("heading", { level: 1, name: "Reportes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inmobiliaria del Mar" })).toHaveAttribute("href", "/panel/inmobiliaria");
  });

  it("al recargar refresca los datos del vendedor con /auth/me", async () => {
    api.auth.getMe.mockResolvedValue({ ...USER, inmobiliaria: { ...USER.inmobiliaria!, nombreFantasia: "Nombre Nuevo" } });
    signIn();
    renderApp("/panel/reportes");
    expect(await screen.findByRole("link", { name: "Nombre Nuevo" })).toBeInTheDocument();
  });

  it("logout limpia el token y redirige al listado publico", async () => {
    signIn();
    const user = userEvent.setup();
    renderApp("/panel/propiedades");
    await user.click(await screen.findByRole("button", { name: "Salir" }));

    expect(await screen.findByRole("heading", { level: 2, name: /Propiedades disponibles/ })).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem("retama.token")).toBeNull());
    expect(localStorage.getItem("retama.user")).toBeNull();
    expect(window.location.pathname).toBe("/");
    expect(await screen.findByRole("link", { name: /^Ingresar/ })).toBeInTheDocument();
  });
});
