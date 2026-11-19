/**
 * notion: "mis propiedades: abm", "ciclo de vida de la propiedad",
 * "solicitudes de visita", "consultas recibidas", "actividad y notificaciones",
 * "dashboard de reportes" y "ux transversal".
 *
 * recorre el panel del vendedor con la sesion iniciada. los servicios estan
 * simulados, asi que cada test decide que responde el back.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Property, Question, Visit } from "../src/types/api";
import { AGENCY, activity, api, apiError, paged, property, question, renderApp, resetApi, signIn, visit } from "./helpers";

vi.mock("../src/services/auth");
vi.mock("../src/services/properties");
vi.mock("../src/services/agencies");
vi.mock("../src/services/panel");

beforeEach(() => {
  resetApi();
  signIn();
});

/**
 * busca la fila de un listado a partir del titulo que muestra.
 *
 * @param titulo texto del titulo de la fila
 * @returns el elemento li que contiene esa fila
 */
const rowOf = async (titulo: string): Promise<HTMLElement> => (await screen.findByRole("heading", { level: 2, name: titulo })).closest("li")!;

/**
 * devuelve los textos de los botones y links de una fila.
 *
 * @param row fila del listado
 * @returns las etiquetas en el orden en que se muestran
 */
const actionsOf = (row: HTMLElement): string[] => [...row.querySelectorAll("a, button")].map((element) => element.textContent!.trim());

describe("mis propiedades: listado", () => {
  it("muestra titulo, operacion, precio y estado actual de cada propiedad", async () => {
    api.panel.listMyProperties.mockResolvedValue(paged([property(), property({ id: 3, titulo: "Depto en alquiler", operacion: "ALQUILER", precio: 400, estado: "BORRADOR" })]));
    renderApp("/panel/propiedades");

    const casa = await rowOf("Casa con pileta en Ostende");
    expect(within(casa).getByText("Venta · USD 120.000")).toBeInTheDocument();
    expect(within(casa).getByText("Publicada")).toBeInTheDocument();

    const depto = await rowOf("Depto en alquiler");
    expect(within(depto).getByText("Alquiler · USD 400/mes")).toBeInTheDocument();
    expect(within(depto).getByText("Borrador")).toBeInTheDocument();
  });

  it("sin propiedades muestra un estado vacio y el acceso para crear la primera", async () => {
    renderApp("/panel/propiedades");
    expect(await screen.findByText("Todavía no cargaste propiedades")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nueva propiedad" })).toHaveAttribute("href", "/panel/propiedades/nueva");
  });

  it("filtra por estado y guarda el filtro en la url", async () => {
    const user = userEvent.setup();
    renderApp("/panel/propiedades");
    await user.selectOptions(await screen.findByLabelText("Filtrar por estado"), "PAUSADA");

    expect(window.location.search).toBe("?estado=PAUSADA");
    await waitFor(() => expect(api.panel.listMyProperties).toHaveBeenLastCalledWith({ estado: "PAUSADA", page: 1 }, expect.anything()));
    expect(await screen.findByText("No tenés propiedades en ese estado")).toBeInTheDocument();
  });

  it("si el listado falla muestra el error y deja reintentar", async () => {
    api.panel.listMyProperties.mockRejectedValueOnce(apiError(500, "Error interno del servidor"));
    const user = userEvent.setup();
    renderApp("/panel/propiedades");

    expect(await screen.findByRole("alert")).toHaveTextContent("Error interno del servidor");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Todavía no cargaste propiedades")).toBeInTheDocument();
  });
});

describe("ciclo de vida de la propiedad", () => {
  it.each<[Property["estado"], Property["operacion"], string[]]>([
    ["BORRADOR", "VENTA", ["Editar", "Publicar", "Dar de baja", "Historial"]],
    ["PUBLICADA", "VENTA", ["Editar", "Pausar", "Marcar reservada", "Dar de baja", "Historial", "Ver publicación"]],
    ["PAUSADA", "VENTA", ["Editar", "Republicar", "Dar de baja", "Historial", "Ver publicación"]],
    ["RESERVADA", "VENTA", ["Editar", "Marcar vendida", "Dar de baja", "Historial", "Ver publicación"]],
    ["RESERVADA", "ALQUILER", ["Editar", "Marcar alquilada", "Dar de baja", "Historial", "Ver publicación"]],
    ["VENDIDA", "VENTA", ["Historial", "Ver publicación"]],
    ["ALQUILADA", "ALQUILER", ["Historial", "Ver publicación"]],
    ["CANCELADA", "VENTA", ["Historial", "Ver publicación"]],
  ])("una propiedad %s (%s) ofrece solo sus acciones validas", async (estado, operacion, esperadas) => {
    api.panel.listMyProperties.mockResolvedValue(paged([property({ estado, operacion })]));
    renderApp("/panel/propiedades");
    expect(actionsOf(await rowOf("Casa con pileta en Ostende"))).toEqual(esperadas);
  });

  it("publicar llama al back y actualiza el listado con el estado nuevo", async () => {
    api.panel.listMyProperties.mockResolvedValueOnce(paged([property({ estado: "BORRADOR" })])).mockResolvedValue(paged([property({ estado: "PUBLICADA" })]));
    api.panel.changePropertyStatus.mockResolvedValue(property({ estado: "PUBLICADA" }));
    const user = userEvent.setup();
    renderApp("/panel/propiedades");

    await user.click(within(await rowOf("Casa con pileta en Ostende")).getByRole("button", { name: "Publicar" }));

    expect(api.panel.changePropertyStatus).toHaveBeenCalledWith(2, "PUBLICADA");
    await waitFor(async () => expect(within(await rowOf("Casa con pileta en Ostende")).getByText("Publicada")).toBeInTheDocument());
    expect(screen.queryByText("Borrador", { selector: "span" })).not.toBeInTheDocument();
    expect(api.panel.listMyProperties).toHaveBeenCalledTimes(2);
  });

  it("si el back rechaza la transicion se muestra el error y el estado en pantalla no cambia", async () => {
    api.panel.listMyProperties.mockResolvedValue(paged([property({ estado: "BORRADOR", fotos: [] })]));
    api.panel.changePropertyStatus.mockRejectedValue(apiError(409, "No se puede publicar una propiedad sin fotos"));
    const user = userEvent.setup();
    renderApp("/panel/propiedades");

    const row = await rowOf("Casa con pileta en Ostende");
    await user.click(within(row).getByRole("button", { name: "Publicar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se puede publicar una propiedad sin fotos");
    expect(within(row).getByText("Borrador")).toBeInTheDocument();
    expect(api.panel.listMyProperties).toHaveBeenCalledTimes(1);
  });

  it("dar de baja pide confirmacion: un solo click no ejecuta nada", async () => {
    api.panel.listMyProperties.mockResolvedValue(paged([property()]));
    const user = userEvent.setup();
    renderApp("/panel/propiedades");

    await user.click(within(await rowOf("Casa con pileta en Ostende")).getByRole("button", { name: "Dar de baja" }));
    const dialog = screen.getByRole("dialog", { name: "¿Dar de baja la propiedad?" });
    expect(dialog).toHaveTextContent("Casa con pileta en Ostende");
    expect(api.panel.cancelProperty).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Volver" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(api.panel.cancelProperty).not.toHaveBeenCalled();
  });

  it("confirmar la baja llama al back y refresca el listado", async () => {
    api.panel.listMyProperties.mockResolvedValueOnce(paged([property()])).mockResolvedValue(paged([property({ estado: "CANCELADA" })]));
    api.panel.cancelProperty.mockResolvedValue();
    const user = userEvent.setup();
    renderApp("/panel/propiedades");

    await user.click(within(await rowOf("Casa con pileta en Ostende")).getByRole("button", { name: "Dar de baja" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Dar de baja" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.panel.cancelProperty).toHaveBeenCalledWith(2);
    await waitFor(async () => expect(within(await rowOf("Casa con pileta en Ostende")).getByText("Cancelada")).toBeInTheDocument());
  });

  it("marcar vendida pide confirmacion y, si el back la rechaza, el error queda en el dialogo", async () => {
    api.panel.listMyProperties.mockResolvedValue(paged([property({ estado: "RESERVADA" })]));
    api.panel.changePropertyStatus.mockRejectedValue(apiError(409, "La propiedad tiene visitas confirmadas"));
    const user = userEvent.setup();
    renderApp("/panel/propiedades");

    await user.click(within(await rowOf("Casa con pileta en Ostende")).getByRole("button", { name: "Marcar vendida" }));
    const dialog = screen.getByRole("dialog", { name: "¿Marcar vendida?" });
    expect(api.panel.changePropertyStatus).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Marcar vendida" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("La propiedad tiene visitas confirmadas");
    expect(api.panel.changePropertyStatus).toHaveBeenCalledWith(2, "VENDIDA");
    expect(within(await rowOf("Casa con pileta en Ostende")).getByText("Reservada")).toBeInTheDocument();
  });

  it("muestra el historial de estados de la propiedad", async () => {
    api.panel.listMyProperties.mockResolvedValue(paged([property()]));
    api.panel.getMyProperty.mockResolvedValue(
      property({
        historialEstados: [
          { id: 1, estadoViejo: "BORRADOR", estadoNuevo: "PUBLICADA", fechaCambio: "2026-03-01T13:00:00.000Z" },
          { id: 2, estadoViejo: "PUBLICADA", estadoNuevo: "PAUSADA", fechaCambio: "2026-03-05T13:00:00.000Z" },
        ],
      }),
    );
    const user = userEvent.setup();
    renderApp("/panel/propiedades");

    const row = await rowOf("Casa con pileta en Ostende");
    await user.click(within(row).getByRole("button", { name: "Historial" }));

    const cambios = await within(row).findAllByRole("listitem");
    expect(cambios.map((item) => item.textContent!.split(" · ")[1])).toEqual(["Borrador → Publicada", "Publicada → Pausada"]);

    await user.click(within(row).getByRole("button", { name: "Ocultar historial" }));
    expect(within(row).queryByText(/Borrador → Publicada/)).not.toBeInTheDocument();
  });
});

describe("formulario de propiedad", () => {
  /**
   * completa los campos obligatorios del formulario de alta.
   *
   * @param user instancia de user-event
   * @param precio valor a escribir en el campo precio
   * @returns una promesa que resuelve cuando termino de escribir
   */
  const fillProperty = async (user: ReturnType<typeof userEvent.setup>, precio: string) => {
    await user.type(await screen.findByLabelText("Título"), "Depto con vista al mar");
    await user.type(screen.getByLabelText("Descripción"), "Luminoso y cerca de la playa");
    await user.type(screen.getByLabelText("Precio"), precio);
    await user.type(screen.getByLabelText("Dirección (calle y altura)"), "Av. del Mar 320");
    await user.type(screen.getByLabelText("Zona o barrio"), "Centro");
    await user.type(screen.getByLabelText("Superficie total (m²)"), "50");
    await user.type(screen.getByLabelText("Superficie cubierta (m²)"), "45");
  };

  it("tiene todos los campos del enunciado", async () => {
    api.properties.listTags.mockResolvedValue([{ id: 1, tag: "Pileta" }]);
    renderApp("/panel/propiedades/nueva");
    await screen.findByRole("heading", { level: 1, name: "Nueva propiedad" });

    const campos = ["Título", "Descripción", "Tipo", "Operación", "Precio", "Moneda", "Dirección (calle y altura)", "Zona o barrio", "Superficie total (m²)", "Superficie cubierta (m²)", "Ambientes (opcional)", "Dormitorios (opcional)", "Baños (opcional)", "Antigüedad en años (opcional)"];
    for (const campo of campos) expect(screen.getByLabelText(campo)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Pileta" })).toHaveAttribute("aria-pressed", "false");
  });

  it("precio o superficie en 0 se marcan como invalidos antes de enviar", async () => {
    const user = userEvent.setup();
    renderApp("/panel/propiedades/nueva");
    await fillProperty(user, "0");
    await user.clear(screen.getByLabelText("Superficie total (m²)"));
    await user.type(screen.getByLabelText("Superficie total (m²)"), "0");
    await user.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect(screen.getByText("El precio debe ser mayor a 0")).toBeInTheDocument();
    expect(screen.getByText("La superficie total debe ser un número entero mayor a 0")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Revisá los campos marcados.");
    expect(api.panel.createProperty).not.toHaveBeenCalled();
  });

  it("si el tipo es terreno oculta superficie cubierta, ambientes, dormitorios y baños", async () => {
    const user = userEvent.setup();
    renderApp("/panel/propiedades/nueva");
    await user.selectOptions(await screen.findByLabelText("Tipo"), "TERRENO");

    for (const campo of ["Superficie cubierta (m²)", "Ambientes (opcional)", "Dormitorios (opcional)", "Baños (opcional)"]) {
      expect(screen.queryByLabelText(campo)).not.toBeInTheDocument();
    }
    expect(screen.getByLabelText("Superficie del terreno (m²)")).toBeInTheDocument();
    expect(screen.getByLabelText("Antigüedad en años (opcional)")).toBeInTheDocument();
  });

  it("crea la propiedad como borrador y pasa a la edicion para cargar fotos", async () => {
    api.properties.listTags.mockResolvedValue([{ id: 1, tag: "Pileta" }]);
    api.panel.createProperty.mockResolvedValue(property({ id: 9, estado: "BORRADOR" }));
    api.panel.getMyProperty.mockResolvedValue(property({ id: 9, estado: "BORRADOR", fotos: [] }));
    const user = userEvent.setup();
    renderApp("/panel/propiedades/nueva");
    await fillProperty(user, "90000");
    await user.click(await screen.findByRole("button", { name: "Pileta" }));
    await user.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Editar propiedad" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/panel/propiedades/9/editar");
    expect(api.panel.createProperty).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Depto con vista al mar", tipoPropiedad: "CASA", operacion: "VENTA", precio: 90000, moneda: "USD", superficieTotalM2: 50, superficieCubiertaM2: 45, ambientes: null, tags: [1] }),
    );
    expect(screen.getByRole("status")).toHaveTextContent("La propiedad se guardó como borrador");
  });

  it("si el back rechaza el alta muestra el error junto al campo", async () => {
    api.panel.createProperty.mockRejectedValue(apiError(400, "Datos inválidos", { titulo: "El título es demasiado largo" }));
    const user = userEvent.setup();
    renderApp("/panel/propiedades/nueva");
    await fillProperty(user, "90000");
    const titulo = screen.getByLabelText("Título");
    await user.click(screen.getByRole("button", { name: "Guardar borrador" }));

    expect((await screen.findByText("El título es demasiado largo")).closest("label")).toContainElement(titulo);
    expect(window.location.pathname).toBe("/panel/propiedades/nueva");
  });

  it("editar precarga los datos actuales de la propiedad", async () => {
    api.properties.listTags.mockResolvedValue([{ id: 1, tag: "Pileta" }, { id: 2, tag: "Cochera" }]);
    renderApp("/panel/propiedades/2/editar");

    expect(await screen.findByLabelText("Título")).toHaveValue("Casa con pileta en Ostende");
    expect(screen.getByLabelText("Tipo")).toHaveValue("CASA");
    expect(screen.getByLabelText("Operación")).toHaveValue("VENTA");
    expect(screen.getByLabelText("Precio")).toHaveValue("120000");
    expect(screen.getByLabelText("Zona o barrio")).toHaveValue("Ostende");
    expect(screen.getByLabelText("Ambientes (opcional)")).toHaveValue("4");
    expect(await screen.findByRole("button", { name: "Pileta" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Cochera" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Estado actual: Publicada")).toBeInTheDocument();
  });

  it("guardar la edicion envia los cambios y avisa que se guardaron", async () => {
    api.panel.updateProperty.mockResolvedValue(property({ precio: 99000 }));
    const user = userEvent.setup();
    renderApp("/panel/propiedades/2/editar");
    const precio = await screen.findByLabelText("Precio");
    await user.clear(precio);
    await user.type(precio, "99000");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Los cambios se guardaron.");
    expect(api.panel.updateProperty).toHaveBeenCalledWith(2, expect.objectContaining({ precio: 99000, titulo: "Casa con pileta en Ostende" }));
  });

  it.each(["VENDIDA", "ALQUILADA", "CANCELADA"] as const)("una propiedad %s no se puede editar aunque se abra la url directo", async (estado) => {
    api.panel.getMyProperty.mockResolvedValue(property({ estado }));
    renderApp("/panel/propiedades/2/editar");

    expect(await screen.findByText(/ya no se puede editar/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Título")).not.toBeInTheDocument();
  });

  it("una propiedad ajena o inexistente muestra 'no encontrada'", async () => {
    api.panel.getMyProperty.mockRejectedValue(apiError(404, "Propiedad no encontrada"));
    renderApp("/panel/propiedades/999/editar");
    expect(await screen.findByText("No encontramos esa propiedad")).toBeInTheDocument();
  });
});

describe("galeria de fotos de la propiedad", () => {
  const fotos = [
    { id: 1, url: "/fotos/foto-01.jpg", orden: 0, esPortada: true },
    { id: 2, url: "/fotos/foto-02.jpg", orden: 1, esPortada: false },
  ];

  it("agrega una foto al final de la galeria", async () => {
    api.panel.listPhotos.mockResolvedValue(fotos);
    api.panel.addPhoto.mockResolvedValue({ id: 3, url: "https://img.test/3.jpg", orden: 2, esPortada: false });
    const user = userEvent.setup();
    renderApp("/panel/propiedades/2/editar");

    await user.type(await screen.findByLabelText("URL de la imagen"), "https://img.test/3.jpg");
    await user.click(screen.getByRole("button", { name: "Agregar foto" }));

    await waitFor(() => expect(api.panel.addPhoto).toHaveBeenCalledWith(2, { url: "https://img.test/3.jpg", orden: 2 }));
    await waitFor(() => expect(api.panel.listPhotos).toHaveBeenCalledTimes(2));
  });

  it("permite marcar otra foto como portada y cambiar el orden", async () => {
    api.panel.listPhotos.mockResolvedValue(fotos);
    api.panel.updatePhoto.mockResolvedValue();
    const user = userEvent.setup();
    renderApp("/panel/propiedades/2/editar");

    const segunda = (await screen.findByRole("img", { name: "Foto 2" })).closest("li")!;
    await user.click(within(segunda).getByRole("button", { name: "Portada" }));
    await waitFor(() => expect(api.panel.updatePhoto).toHaveBeenCalledWith(2, 2, { esPortada: true }));

    await user.click(within(segunda).getByRole("button", { name: "Mover antes" }));
    await waitFor(() => expect(api.panel.updatePhoto).toHaveBeenCalledWith(2, 2, { orden: 0 }));
    expect(api.panel.updatePhoto).toHaveBeenCalledWith(2, 1, { orden: 1 });
  });

  it("quitar una foto pide confirmacion y muestra el motivo si el back la rechaza", async () => {
    api.panel.listPhotos.mockResolvedValue(fotos);
    api.panel.deletePhoto.mockRejectedValue(apiError(409, "Una propiedad publicada no puede quedarse sin fotos"));
    const user = userEvent.setup();
    renderApp("/panel/propiedades/2/editar");

    const primera = (await screen.findByRole("img", { name: "Foto 1" })).closest("li")!;
    await user.click(within(primera).getByRole("button", { name: "Quitar" }));
    const dialog = screen.getByRole("dialog", { name: "¿Quitar la foto?" });
    expect(api.panel.deletePhoto).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Quitar foto" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Una propiedad publicada no puede quedarse sin fotos");
    expect(api.panel.deletePhoto).toHaveBeenCalledWith(2, 1);
  });

  it("sin url avisa y no llama al back", async () => {
    const user = userEvent.setup();
    renderApp("/panel/propiedades/2/editar");
    await user.click(await screen.findByRole("button", { name: "Agregar foto" }));

    expect(await screen.findByText("Pegá la dirección (URL) de la imagen")).toBeInTheDocument();
    expect(api.panel.addPhoto).not.toHaveBeenCalled();
  });
});

describe("datos de la inmobiliaria", () => {
  it("precarga los datos y guarda los cambios", async () => {
    api.panel.updateMyAgency.mockResolvedValue({ ...AGENCY, nombreFantasia: "Del Mar Propiedades" });
    const user = userEvent.setup();
    renderApp("/panel/inmobiliaria");

    const nombre = await screen.findByLabelText("Nombre de fantasía");
    expect(nombre).toHaveValue("Inmobiliaria del Mar");
    expect(screen.getByLabelText("Descripción")).toHaveValue("Más de 20 años en Pinamar.");

    await user.clear(nombre);
    await user.type(nombre, "Del Mar Propiedades");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Los cambios se guardaron.");
    expect(api.panel.updateMyAgency).toHaveBeenCalledWith(expect.objectContaining({ nombreFantasia: "Del Mar Propiedades" }));
  });

  it("un nombre de fantasia en uso (409) se muestra junto al campo", async () => {
    api.panel.updateMyAgency.mockRejectedValue(apiError(409, "Nombre en uso", { nombreFantasia: "Ya existe una inmobiliaria con ese nombre" }));
    const user = userEvent.setup();
    renderApp("/panel/inmobiliaria");
    const nombre = await screen.findByLabelText("Nombre de fantasía");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect((await screen.findByText("Ya existe una inmobiliaria con ese nombre")).closest("label")).toContainElement(nombre);
  });

  it("eliminar pide confirmacion y, si el back responde 409, muestra el motivo y no cierra la sesion", async () => {
    api.panel.deleteMyAgency.mockRejectedValue(apiError(409, "No se puede eliminar: tiene propiedades publicadas o reservadas"));
    const user = userEvent.setup();
    renderApp("/panel/inmobiliaria");

    await user.click(await screen.findByRole("button", { name: "Eliminar inmobiliaria" }));
    const dialog = screen.getByRole("dialog", { name: "¿Eliminar la inmobiliaria?" });
    expect(api.panel.deleteMyAgency).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("No se puede eliminar: tiene propiedades publicadas o reservadas");
    expect(localStorage.getItem("retama.token")).not.toBeNull();
    expect(window.location.pathname).toBe("/panel/inmobiliaria");
  });

  it("si se elimina, cierra la sesion y vuelve al sitio publico", async () => {
    api.panel.deleteMyAgency.mockResolvedValue();
    const user = userEvent.setup();
    renderApp("/panel/inmobiliaria");

    await user.click(await screen.findByRole("button", { name: "Eliminar inmobiliaria" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("heading", { level: 2, name: /Propiedades disponibles/ })).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem("retama.token")).toBeNull());
  });

  it("quitar un telefono pide confirmacion", async () => {
    api.panel.deletePhone.mockResolvedValue();
    const user = userEvent.setup();
    renderApp("/panel/inmobiliaria");

    await user.click(await screen.findByRole("button", { name: "Quitar" }));
    const dialog = screen.getByRole("dialog", { name: "¿Quitar el teléfono?" });
    expect(api.panel.deletePhone).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Quitar" }));
    await waitFor(() => expect(api.panel.deletePhone).toHaveBeenCalledWith(1));
  });
});

describe("solicitudes de visita", () => {
  it("agrupa por propiedad y muestra nombre, telefono clickeable, fecha, mensaje y estado", async () => {
    api.panel.listMyVisits.mockResolvedValue(paged<Visit>([visit(), visit({ id: 2, nombreVisitante: "Sofía", property: { id: 5, titulo: "Depto en el centro" } })]));
    renderApp("/panel/visitas");

    const item = (await screen.findByText("Marcos")).closest("li")!;
    expect(screen.getByRole("heading", { level: 2, name: "Casa con pileta en Ostende" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Depto en el centro" })).toBeInTheDocument();
    expect(within(item).getByRole("link", { name: "1155550000" })).toHaveAttribute("href", "tel:1155550000");
    expect(within(item).getByText(/10\/5, \d{2}:\d{2} hs/)).toBeInTheDocument();
    expect(within(item).getByText('"Puedo por la tarde"')).toBeInTheDocument();
    expect(within(item).getByText("Pendiente")).toBeInTheDocument();
  });

  it("por defecto pide las pendientes y el filtro permite ver todas", async () => {
    const user = userEvent.setup();
    renderApp("/panel/visitas");
    await waitFor(() => expect(api.panel.listMyVisits).toHaveBeenLastCalledWith("PENDIENTE", expect.anything()));

    await user.selectOptions(await screen.findByLabelText("Filtrar por estado"), "TODAS");
    await waitFor(() => expect(api.panel.listMyVisits).toHaveBeenLastCalledWith("", expect.anything()));
    expect(window.location.search).toBe("?estado=TODAS");
  });

  it("al confirmar, la solicitud cambia de estado en pantalla sin recargar", async () => {
    api.panel.listMyVisits.mockResolvedValue(paged([visit()]));
    api.panel.updateVisitStatus.mockResolvedValue(visit({ estado: "CONFIRMADA" }));
    const user = userEvent.setup();
    renderApp("/panel/visitas");

    const item = (await screen.findByText("Marcos")).closest("li")!;
    expect(within(item).getAllByRole("button").map((button) => button.textContent)).toEqual(["Confirmar", "Rechazar"]);
    await user.click(within(item).getByRole("button", { name: "Confirmar" }));

    expect(await within(item).findByText("Confirmada")).toBeInTheDocument();
    expect(within(item).getAllByRole("button").map((button) => button.textContent)).toEqual(["Marcar realizada", "Cancelar"]);
    expect(api.panel.updateVisitStatus).toHaveBeenCalledWith(1, "CONFIRMADA");
    expect(api.panel.listMyVisits).toHaveBeenCalledTimes(1);
  });

  it("rechazar pide confirmacion antes de ejecutar", async () => {
    api.panel.listMyVisits.mockResolvedValue(paged([visit()]));
    api.panel.updateVisitStatus.mockResolvedValue(visit({ estado: "RECHAZADA" }));
    const user = userEvent.setup();
    renderApp("/panel/visitas");

    const item = (await screen.findByText("Marcos")).closest("li")!;
    await user.click(within(item).getByRole("button", { name: "Rechazar" }));
    const dialog = screen.getByRole("dialog", { name: "¿Rechazar la visita?" });
    expect(api.panel.updateVisitStatus).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Rechazar" }));
    expect(await within(item).findByText("Rechazada")).toBeInTheDocument();
    expect(within(item).queryAllByRole("button")).toEqual([]);
  });

  it.each(["RECHAZADA", "CANCELADA", "REALIZADA"] as const)("una solicitud %s no ofrece mas acciones", async (estado) => {
    api.panel.listMyVisits.mockResolvedValue(paged([visit({ estado })]));
    renderApp("/panel/visitas?estado=TODAS");

    const item = (await screen.findByText("Marcos")).closest("li")!;
    expect(within(item).queryAllByRole("button")).toEqual([]);
  });

  it("si el back rechaza el cambio se muestra el error y el estado no cambia", async () => {
    api.panel.listMyVisits.mockResolvedValue(paged([visit()]));
    api.panel.updateVisitStatus.mockRejectedValue(apiError(409, "La visita ya fue cancelada"));
    const user = userEvent.setup();
    renderApp("/panel/visitas");

    const item = (await screen.findByText("Marcos")).closest("li")!;
    await user.click(within(item).getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La visita ya fue cancelada");
    expect(within(item).getByText("Pendiente")).toBeInTheDocument();
  });

  it("sin solicitudes muestra un estado vacio", async () => {
    renderApp("/panel/visitas");
    expect(await screen.findByText("No hay visitas en ese estado")).toBeInTheDocument();
  });
});

describe("consultas recibidas", () => {
  it("agrupa por propiedad, con autor, y distingue respondidas de pendientes", async () => {
    api.panel.listMyQuestions.mockResolvedValue(
      paged<Question>([
        question(),
        question({ id: 2, pregunta: "¿Tiene cochera?", respuestaVendedor: "Sí, para un auto." }),
        question({ id: 3, pregunta: "¿Aceptan garantía?", property: { id: 5, titulo: "Depto en el centro" } }),
      ]),
    );
    renderApp("/panel/consultas?ver=todas");

    const pendiente = (await screen.findByText("¿Admite mascotas?")).closest("li")!;
    expect(within(pendiente).getByText("Pendiente")).toBeInTheDocument();
    expect(within(pendiente).getByText(/^Lucía ·/)).toBeInTheDocument();
    expect(within(pendiente).getByLabelText("Respuesta")).toBeInTheDocument();

    const respondida = screen.getByText("¿Tiene cochera?").closest("li")!;
    expect(within(respondida).getByText("Respondida")).toBeInTheDocument();
    expect(within(respondida).getByText("Sí, para un auto.")).toBeInTheDocument();

    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Casa con pileta en Ostende", "Depto en el centro"]);
  });

  it("por defecto pide solo las pendientes", async () => {
    renderApp("/panel/consultas");
    await waitFor(() => expect(api.panel.listMyQuestions).toHaveBeenCalledWith(true, expect.anything()));
    expect(await screen.findByText("No tenés consultas pendientes")).toBeInTheDocument();
  });

  it("responder una consulta la marca como respondida en el momento", async () => {
    api.panel.listMyQuestions.mockResolvedValue(paged([question()]));
    api.panel.replyQuestion.mockResolvedValue(question({ respuestaVendedor: "Sí, sin problema." }));
    const user = userEvent.setup();
    renderApp("/panel/consultas");

    const item = (await screen.findByText("¿Admite mascotas?")).closest("li")!;
    await user.type(within(item).getByLabelText("Respuesta"), "Sí, sin problema.");
    await user.click(within(item).getByRole("button", { name: "Responder" }));

    expect(await within(item).findByText("Respondida")).toBeInTheDocument();
    expect(within(item).getByText("Sí, sin problema.")).toBeInTheDocument();
    expect(api.panel.replyQuestion).toHaveBeenCalledWith(1, "Sí, sin problema.");
    expect(api.panel.listMyQuestions).toHaveBeenCalledTimes(1);
  });

  it("una consulta ya respondida no admite una segunda respuesta", async () => {
    api.panel.listMyQuestions.mockResolvedValue(paged([question({ respuestaVendedor: "Sí, sin problema." })]));
    renderApp("/panel/consultas?ver=todas");

    const item = (await screen.findByText("¿Admite mascotas?")).closest("li")!;
    expect(within(item).queryByLabelText("Respuesta")).not.toBeInTheDocument();
    expect(within(item).queryByRole("button", { name: "Responder" })).not.toBeInTheDocument();
  });

  it("una respuesta vacia no se envia, y un rechazo del back se muestra en la consulta", async () => {
    api.panel.listMyQuestions.mockResolvedValue(paged([question()]));
    api.panel.replyQuestion.mockRejectedValue(apiError(409, "La consulta ya fue respondida"));
    const user = userEvent.setup();
    renderApp("/panel/consultas");

    const item = (await screen.findByText("¿Admite mascotas?")).closest("li")!;
    await user.click(within(item).getByRole("button", { name: "Responder" }));
    expect(within(item).getByText("Escribí la respuesta")).toBeInTheDocument();
    expect(api.panel.replyQuestion).not.toHaveBeenCalled();

    await user.type(within(item).getByLabelText("Respuesta"), "Sí");
    await user.click(within(item).getByRole("button", { name: "Responder" }));
    expect(await within(item).findByText("La consulta ya fue respondida")).toBeInTheDocument();
    expect(within(item).getByText("Pendiente")).toBeInTheDocument();
  });
});

describe("actividad y notificaciones", () => {
  it("la navegacion muestra el contador de novedades sin leer", async () => {
    api.panel.getUnreadCount.mockResolvedValue(3);
    renderApp("/panel/propiedades");
    const nav = await screen.findByRole("navigation", { name: "Secciones del panel" });
    expect(await within(nav).findByLabelText("3 sin leer")).toHaveTextContent("3");
  });

  it("sin novedades no muestra el contador", async () => {
    renderApp("/panel/actividad");
    expect(await screen.findByText("Estás al día")).toBeInTheDocument();
    expect(screen.queryByLabelText(/sin leer/)).not.toBeInTheDocument();
    expect(await screen.findByText("Todavía no hay actividad")).toBeInTheDocument();
  });

  it("el feed diferencia las leidas de las no leidas", async () => {
    api.panel.getUnreadCount.mockResolvedValue(1);
    api.panel.listActivity.mockResolvedValue(paged([activity(), activity({ id: 2, mensaje: "Marcos pidió una visita", referenciaTipo: "visita", tipo: "SOLICITUD_VISITA", leido: true })]));
    renderApp("/panel/actividad");

    const sinLeer = await screen.findByRole("button", { name: /Lucía consultó/ });
    const leida = screen.getByRole("button", { name: /Marcos pidió una visita/ });
    expect(sinLeer).not.toHaveTextContent("leída");
    expect(leida).toHaveTextContent("· leída");
    expect(screen.getByText("1 novedad sin leer")).toBeInTheDocument();
  });

  it("marcar una actividad como leida baja el contador sin recargar y lleva a su origen", async () => {
    api.panel.getUnreadCount.mockResolvedValueOnce(3).mockResolvedValue(2);
    api.panel.listActivity.mockResolvedValue(paged([activity()]));
    api.panel.markActivityRead.mockResolvedValue();
    const user = userEvent.setup();
    renderApp("/panel/actividad");
    await screen.findByLabelText("3 sin leer");

    await user.click(screen.getByRole("button", { name: /Lucía consultó/ }));

    expect(await screen.findByLabelText("2 sin leer")).toBeInTheDocument();
    expect(api.panel.markActivityRead).toHaveBeenCalledWith(1);
    expect(await screen.findByRole("heading", { level: 1, name: "Consultas" })).toBeInTheDocument();
    expect(window.location.pathname + window.location.search).toBe("/panel/consultas?ver=todas");
  });

  it("una actividad ya leida no vuelve a marcarse", async () => {
    api.panel.listActivity.mockResolvedValue(paged([activity({ leido: true, referenciaTipo: "visita" })]));
    const user = userEvent.setup();
    renderApp("/panel/actividad");

    await user.click(await screen.findByRole("button", { name: /Lucía consultó/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Solicitudes de visita" })).toBeInTheDocument();
    expect(api.panel.markActivityRead).not.toHaveBeenCalled();
  });

  it("marcar todas deja el contador en cero", async () => {
    api.panel.getUnreadCount.mockResolvedValueOnce(2).mockResolvedValue(0);
    api.panel.listActivity.mockResolvedValue(paged([activity(), activity({ id: 2, mensaje: "Ana dejó una reseña" })]));
    api.panel.markAllActivityRead.mockResolvedValue();
    const user = userEvent.setup();
    renderApp("/panel/actividad");

    await user.click(await screen.findByRole("button", { name: "Marcar todas como leídas" }));

    expect(await screen.findByText("Estás al día")).toBeInTheDocument();
    expect(screen.queryByLabelText(/sin leer/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ana dejó una reseña/ })).toHaveTextContent("· leída");
  });

  it("el contador se refresca cada 15 segundos y el intervalo se corta al hacer logout", async () => {
    const setSpy = vi.spyOn(window, "setInterval");
    const clearSpy = vi.spyOn(window, "clearInterval");
    const user = userEvent.setup();
    renderApp("/panel/propiedades");
    await screen.findByRole("heading", { level: 1, name: "Mis propiedades" });

    const indice = setSpy.mock.calls.findIndex(([, ms]) => ms === 15000);
    expect(indice).toBeGreaterThanOrEqual(0);
    const intervalo = setSpy.mock.results[indice].value;

    await user.click(screen.getByRole("button", { name: "Salir" }));
    await screen.findByRole("heading", { level: 2, name: /Propiedades disponibles/ });

    expect(clearSpy).toHaveBeenCalledWith(intervalo);
    setSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe("dashboard de reportes", () => {
  it("muestra los tres indicadores con los numeros que devuelve la api", async () => {
    api.panel.getStatusSummary.mockResolvedValue([
      { estado: "BORRADOR", cantidad: 2 },
      { estado: "PUBLICADA", cantidad: 4 },
      { estado: "VENDIDA", cantidad: 1 },
    ]);
    api.panel.getMonthlyEvolution.mockResolvedValue([
      { mes: "2026-10", publicaciones: 3, cierres: 2 },
      { mes: "2026-11", publicaciones: 5, cierres: 1 },
    ]);
    api.panel.getAverageTimeOnMarket.mockResolvedValue(36.6);
    renderApp("/panel/reportes");

    const porEstado = (await screen.findByRole("heading", { level: 2, name: "Propiedades por estado" })).closest("section")!;
    const conteo = Object.fromEntries(within(porEstado).getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]));
    expect(conteo).toEqual({ Publicada: "4", Vendida: "1" });

    const mensual = screen.getByRole("heading", { level: 2, name: "Publicaciones y ventas/alquileres por mes" }).closest("section")!;
    expect(mensual).toHaveTextContent("Publicaciones nuevas");
    expect(mensual).toHaveTextContent("Ventas y alquileres");
    for (const valor of ["3", "2", "5", "1"]) expect(within(mensual).getByText(valor)).toBeInTheDocument();

    const tiempo = screen.getByRole("heading", { level: 2, name: "Tiempo promedio en mercado" }).closest("section")!;
    expect(tiempo).toHaveTextContent("37 días");
  });

  it("pide los tres reportes en paralelo, cada uno por su ruta", async () => {
    renderApp("/panel/reportes");
    await screen.findByRole("heading", { level: 1, name: "Reportes" });
    expect(api.panel.getStatusSummary).toHaveBeenCalledTimes(1);
    expect(api.panel.getMonthlyEvolution).toHaveBeenCalledTimes(1);
    expect(api.panel.getAverageTimeOnMarket).toHaveBeenCalledTimes(1);
  });

  it("si todavia no vendio ni alquilo nada muestra un estado vacio y nunca 'NaN dias'", async () => {
    renderApp("/panel/reportes");

    expect(await screen.findByText("Todavía no vendiste ni alquilaste ninguna propiedad.")).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay movimientos para mostrar.")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("NaN");
  });

  it("un solo dia se escribe en singular", async () => {
    api.panel.getAverageTimeOnMarket.mockResolvedValue(1);
    renderApp("/panel/reportes");
    const tiempo = (await screen.findByRole("heading", { level: 2, name: "Tiempo promedio en mercado" })).closest("section")!;
    await waitFor(() => expect(tiempo).toHaveTextContent("1 día"));
    expect(tiempo).not.toHaveTextContent("1 días");
  });

  it("cada indicador tiene su estado de carga", async () => {
    api.panel.getStatusSummary.mockReturnValue(new Promise(() => {}));
    api.panel.getAverageTimeOnMarket.mockResolvedValue(12);
    renderApp("/panel/reportes");

    const tiempo = (await screen.findByRole("heading", { level: 2, name: "Tiempo promedio en mercado" })).closest("section")!;
    await waitFor(() => expect(tiempo).toHaveTextContent("12 días"));
    const porEstado = screen.getByRole("heading", { level: 2, name: "Propiedades por estado" }).closest("section")!;
    expect(porEstado).toHaveTextContent("Cargando...");
  });

  it("si un indicador falla los otros se muestran igual, y se puede reintentar", async () => {
    api.panel.getStatusSummary.mockResolvedValue([{ estado: "PUBLICADA", cantidad: 4 }]);
    api.panel.getMonthlyEvolution.mockRejectedValueOnce(apiError(500, "No se pudo calcular el reporte")).mockResolvedValue([{ mes: "2026-11", publicaciones: 5, cierres: 1 }]);
    api.panel.getAverageTimeOnMarket.mockResolvedValue(20);
    const user = userEvent.setup();
    renderApp("/panel/reportes");

    const mensual = (await screen.findByRole("heading", { level: 2, name: "Publicaciones y ventas/alquileres por mes" })).closest("section")!;
    expect(await within(mensual).findByRole("alert")).toHaveTextContent("No se pudo calcular el reporte");
    expect(screen.getByText("Publicada").nextElementSibling).toHaveTextContent("4");
    expect(screen.getByRole("heading", { level: 2, name: "Tiempo promedio en mercado" }).closest("section")).toHaveTextContent("20 días");

    await user.click(within(mensual).getByRole("button", { name: "Reintentar" }));
    expect(await within(mensual).findByText("Publicaciones nuevas")).toBeInTheDocument();
  });
});
