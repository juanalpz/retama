/**
 * notion: "listado de propiedades (home)", "detalle de propiedad y consultas",
 * "pedir una visita", "sitio del vendedor y reseñas" y "ux transversal".
 *
 * recorre lo que hace un interesado sin cuenta: buscar, ver una propiedad,
 * consultar, pedir una visita y dejar una reseña. los servicios estan simulados.
 */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Question, Visit } from "../src/types/api";
import { AGENCY, api, apiError, paged, property, question, renderApp, resetApi, review, visit } from "./helpers";

vi.mock("../src/services/auth");
vi.mock("../src/services/properties");
vi.mock("../src/services/agencies");
vi.mock("../src/services/panel");

beforeEach(() => {
  resetApi();
});

/**
 * devuelve los filtros con los que se llamo al listado por ultima vez.
 *
 * @returns el primer argumento de la ultima llamada a listProperties
 */
const lastFilters = () => api.properties.listProperties.mock.calls.at(-1)![0];

describe("inicio: listado de propiedades", () => {
  it("cada resultado muestra portada, titulo, tipo, operacion, precio con moneda y zona", async () => {
    api.properties.listProperties.mockResolvedValue(paged([property()]));
    renderApp("/");

    const card = await screen.findByRole("link", { name: /Casa con pileta en Ostende/ });
    expect(card).toHaveAttribute("href", "/propiedades/2");
    expect(card.querySelector("img")).toHaveAttribute("src", "/fotos/foto-01.jpg");
    expect(within(card).getByText("Casa")).toBeInTheDocument();
    expect(within(card).getByText("Venta")).toBeInTheDocument();
    expect(within(card).getByText("USD 120.000")).toBeInTheDocument();
    expect(within(card).getByText("Ostende")).toBeInTheDocument();
    expect(screen.getByText("1 propiedad")).toBeInTheDocument();
  });

  it("muestra un estado de carga mientras llegan los datos", async () => {
    api.properties.listProperties.mockReturnValue(new Promise(() => {}));
    renderApp("/");
    expect(await screen.findByText("Buscando propiedades...")).toBeInTheDocument();
  });

  it("sin resultados muestra un mensaje claro y permite limpiar los filtros", async () => {
    const user = userEvent.setup();
    renderApp("/?tipo=TERRENO&operacion=ALQUILER");

    expect(await screen.findByText("No encontramos propiedades con esos filtros")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    await waitFor(() => expect(window.location.search).toBe(""));
  });

  it("si la api falla muestra el error del back y deja reintentar", async () => {
    api.properties.listProperties.mockRejectedValueOnce(apiError(500, "Error interno del servidor"));
    const user = userEvent.setup();
    renderApp("/");

    expect(await screen.findByRole("alert")).toHaveTextContent("Error interno del servidor");
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("No encontramos propiedades con esos filtros")).toBeInTheDocument();
    expect(api.properties.listProperties).toHaveBeenCalledTimes(2);
  });

  it("abrir una url con filtros, orden y pagina pide exactamente esos resultados", async () => {
    api.properties.listTags.mockResolvedValue([{ id: 1, tag: "Pileta" }]);
    renderApp("/?q=quincho&tipo=CASA&operacion=VENTA&minPrice=50000&maxPrice=200000&barrioZona=Ostende&ambientes=3&tags=Pileta&orden=precio-asc&page=2");

    await waitFor(() => expect(api.properties.listProperties).toHaveBeenCalled());
    expect(lastFilters()).toEqual({
      q: "quincho",
      tipo: "CASA",
      operacion: "VENTA",
      minPrice: "50000",
      maxPrice: "200000",
      barrioZona: "Ostende",
      ambientes: "3",
      tags: ["Pileta"],
      sortBy: "precio",
      sortOrder: "ASC",
      page: 2,
      limit: 12,
    });

    // los controles reflejan lo que dice la url
    expect(screen.getByRole("searchbox", { name: "Buscar propiedades" })).toHaveValue("quincho");
    expect(screen.getByRole("button", { name: "Casa" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Comprar" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Zona")).toHaveValue("Ostende");
    expect(screen.getByLabelText("Precio mínimo")).toHaveValue("50000");
    expect(screen.getByLabelText("Ordenar")).toHaveValue("precio-asc");
    expect(await screen.findByRole("button", { name: "Pileta" })).toHaveAttribute("aria-pressed", "true");
  });

  it("elegir tipo, operacion, ambientes y amenities guarda cada filtro en la url y vuelve a la pagina 1", async () => {
    api.properties.listTags.mockResolvedValue([{ id: 1, tag: "Pileta" }, { id: 2, tag: "Cochera" }]);
    const user = userEvent.setup();
    renderApp("/?page=3");

    await user.click(await screen.findByRole("button", { name: "Departamento" }));
    await user.click(screen.getByRole("button", { name: "Alquilar" }));
    await user.click(screen.getByRole("button", { name: "Pileta" }));
    await user.click(screen.getByRole("button", { name: "Cochera" }));
    const ambientes = screen.getByRole("heading", { name: "Ambientes" }).parentElement!;
    await user.click(within(ambientes).getByRole("button", { name: "2" }));

    const params = new URLSearchParams(window.location.search);
    expect(Object.fromEntries(params)).toEqual({ tipo: "DEPARTAMENTO", operacion: "ALQUILER", tags: "Pileta,Cochera", ambientes: "2" });
    await waitFor(() => expect(lastFilters()).toMatchObject({ tipo: "DEPARTAMENTO", operacion: "ALQUILER", tags: ["Pileta", "Cochera"], ambientes: "2", page: 1 }));

    // volver a tocar un amenity lo quita
    await user.click(screen.getByRole("button", { name: "Pileta" }));
    expect(new URLSearchParams(window.location.search).get("tags")).toBe("Cochera");
  });

  it("escribir en el buscador no dispara un pedido por cada tecla", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await waitFor(() => expect(api.properties.listProperties).toHaveBeenCalledTimes(1));

    await user.type(screen.getByRole("searchbox", { name: "Buscar propiedades" }), "pileta");
    await waitFor(() => expect(lastFilters().q).toBe("pileta"), { timeout: 2000 });

    const buscados = api.properties.listProperties.mock.calls.map(([filters]) => filters.q);
    expect(buscados).toEqual(["", "pileta"]);
    expect(window.location.search).toBe("?q=pileta");
  });

  it("ordenar cambia el criterio y queda en la url", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await user.selectOptions(await screen.findByLabelText("Ordenar"), "superficie-desc");

    expect(window.location.search).toBe("?orden=superficie-desc");
    await waitFor(() => expect(lastFilters()).toMatchObject({ sortBy: "superficie", sortOrder: "DESC" }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Más recientes", "Menor precio", "Mayor precio", "Mayor superficie", "Menor superficie"]);
  });

  it("pagina con la metadata que devuelve la api", async () => {
    api.properties.listProperties.mockResolvedValue(paged([property()], { total: 30, totalPages: 3 }));
    const user = userEvent.setup();
    renderApp("/?tipo=CASA");

    const paginacion = await screen.findByRole("navigation", { name: "Paginación" });
    expect(within(paginacion).getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
    expect(within(paginacion).getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByText("30 propiedades")).toBeInTheDocument();

    await user.click(within(paginacion).getByRole("button", { name: "2" }));
    expect(window.location.search).toBe("?tipo=CASA&page=2");
    await waitFor(() => expect(lastFilters()).toMatchObject({ tipo: "CASA", page: 2 }));
  });

  it("una pagina que no existe ofrece volver a la primera en vez de quedar en blanco", async () => {
    api.properties.listProperties.mockResolvedValue(paged([], { total: 8, page: 99, totalPages: 1 }));
    const user = userEvent.setup();
    renderApp("/?page=99");

    expect(await screen.findByText("Esa página no existe")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ir a la primera página" }));
    expect(window.location.search).toBe("");
  });
});

describe("detalle de propiedad", () => {
  it("muestra la galeria y al tocar una miniatura la pone como principal", async () => {
    const user = userEvent.setup();
    renderApp("/propiedades/2");

    const principal = await screen.findByRole("img", { name: "Casa con pileta en Ostende" });
    expect(principal).toHaveAttribute("src", "/fotos/foto-01.jpg");
    expect(screen.getByRole("button", { name: "Ver foto 1" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Ver foto 2" }));
    expect(screen.getByRole("img", { name: "Casa con pileta en Ostende" })).toHaveAttribute("src", "/fotos/foto-02.jpg");
    expect(screen.getByRole("button", { name: "Ver foto 2" })).toHaveAttribute("aria-pressed", "true");
  });

  it("muestra los atributos, el precio, los amenities y el link a la inmobiliaria", async () => {
    renderApp("/propiedades/2");
    await screen.findByRole("heading", { level: 1, name: "Casa con pileta en Ostende" });

    const atributos = Object.fromEntries(screen.getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]));
    expect(atributos).toEqual({
      Tipo: "Casa",
      Operación: "Venta",
      "Superficie total": "600 m²",
      "Superficie cubierta": "140 m²",
      Ambientes: "4",
      Dormitorios: "3",
      Baños: "2",
      Antigüedad: "15 años",
    });
    expect(screen.getByText("USD 120.000")).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Amenities" })).getByText("Pileta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inmobiliaria del Mar" })).toHaveAttribute("href", "/inmobiliarias/1");
    expect(screen.getByRole("link", { name: "02254-48-1111" })).toHaveAttribute("href", "tel:02254-48-1111");
  });

  it("en un terreno oculta los atributos que no aplican", async () => {
    api.properties.getProperty.mockResolvedValue(
      property({ titulo: "Terreno en Pinamar Norte", tipoPropiedad: "TERRENO", superficieCubiertaM2: null, ambientes: null, dormitorios: null, banios: null, antiguedad: null }),
    );
    renderApp("/propiedades/4");
    await screen.findByRole("heading", { level: 1, name: "Terreno en Pinamar Norte" });

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["Tipo", "Operación", "Superficie total"]);
  });

  it("una propiedad inexistente muestra 'no encontrada' y no una pantalla en blanco", async () => {
    api.properties.getProperty.mockRejectedValue(apiError(404, "Propiedad no encontrada"));
    renderApp("/propiedades/9999");

    expect(await screen.findByText("No encontramos esa propiedad")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas las propiedades" })).toHaveAttribute("href", "/");
  });
});

describe("consultas en el detalle", () => {
  it("lista las consultas con la respuesta del vendedor si la tienen", async () => {
    api.agencies.listQuestions.mockResolvedValue(
      paged<Question>([question({ id: 1, pregunta: "¿Admite mascotas?", respuestaVendedor: "Sí, sin problema." }), question({ id: 2, pregunta: "¿Tiene expensas?" })]),
    );
    renderApp("/propiedades/2");

    const respondida = (await screen.findByText("¿Admite mascotas?")).closest("li")!;
    expect(within(respondida).getByText("Respuesta de la inmobiliaria")).toBeInTheDocument();
    expect(within(respondida).getByText("Sí, sin problema.")).toBeInTheDocument();

    const pendiente = screen.getByText("¿Tiene expensas?").closest("li")!;
    expect(within(pendiente).queryByText("Respuesta de la inmobiliaria")).not.toBeInTheDocument();
  });

  it("una consulta nueva aparece en el listado sin recargar la pagina", async () => {
    api.agencies.createQuestion.mockResolvedValue(question({ id: 7, nombreSolicitante: "Lucía", pregunta: "¿Se puede visitar el sábado?" }));
    const user = userEvent.setup();
    renderApp("/propiedades/2");

    await user.type(await screen.findByLabelText("Tu nombre"), "Lucía");
    await user.type(screen.getByLabelText("Tu consulta"), "¿Se puede visitar el sábado?");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByText("¿Se puede visitar el sábado?", { selector: "li p" })).toBeInTheDocument();
    expect(api.agencies.createQuestion).toHaveBeenCalledWith(2, { nombreSolicitante: "Lucía", pregunta: "¿Se puede visitar el sábado?" });
    expect(api.agencies.listQuestions).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Tu consulta")).toHaveValue("");
  });

  it("una consulta sin contenido no llega al back: se avisa en el formulario", async () => {
    const user = userEvent.setup();
    renderApp("/propiedades/2");

    await user.type(await screen.findByLabelText("Tu nombre"), "Lucía");
    await user.type(screen.getByLabelText("Tu consulta"), "   ");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(screen.getByText("Escribí tu consulta")).toBeInTheDocument();
    expect(api.agencies.createQuestion).not.toHaveBeenCalled();
  });

  it("si el back rechaza la consulta se muestra su mensaje", async () => {
    api.agencies.createQuestion.mockRejectedValue(apiError(400, "Datos inválidos", { pregunta: "La consulta es demasiado larga" }));
    const user = userEvent.setup();
    renderApp("/propiedades/2");

    await user.type(await screen.findByLabelText("Tu nombre"), "Lucía");
    await user.type(screen.getByLabelText("Tu consulta"), "Hola");
    await user.click(screen.getByRole("button", { name: "Enviar consulta" }));

    expect(await screen.findByText("La consulta es demasiado larga")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Datos inválidos");
  });
});

describe("pedir una visita", () => {
  /**
   * abre el formulario de visita desde el detalle.
   *
   * @param user instancia de user-event
   * @returns el dialogo ya abierto
   */
  const openVisitForm = async (user: ReturnType<typeof userEvent.setup>) => {
    renderApp("/propiedades/2");
    await user.click(await screen.findByRole("button", { name: "Pedir visita" }));
    return screen.getByRole("dialog", { name: "Pedir una visita" });
  };

  /**
   * completa el formulario de visita.
   *
   * @param user instancia de user-event
   * @param dialog dialogo del formulario
   * @param fecha valor del selector de dia y hora
   * @returns una promesa que resuelve cuando termino de escribir
   */
  const fillVisit = async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, fecha: string) => {
    await user.type(within(dialog).getByLabelText("Nombre"), "Marcos");
    await user.type(within(dialog).getByLabelText("Teléfono"), "1155550000");
    fireEvent.change(within(dialog).getByLabelText("Día y hora"), { target: { value: fecha } });
  };

  it("el boton abre un formulario con nombre, telefono, fecha y mensaje opcional", async () => {
    const dialog = await openVisitForm(userEvent.setup());
    for (const label of ["Nombre", "Teléfono", "Día y hora", "Mensaje (opcional)"]) {
      expect(within(dialog).getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("el selector no deja elegir una fecha pasada", async () => {
    const dialog = await openVisitForm(userEvent.setup());
    const fecha = within(dialog).getByLabelText("Día y hora");
    expect(fecha).toHaveAttribute("type", "datetime-local");
    expect(Math.abs(new Date(fecha.getAttribute("min")!).getTime() - Date.now())).toBeLessThan(2 * 60000);
  });

  it("valida en el cliente que la fecha sea futura y los datos de contacto", async () => {
    const user = userEvent.setup();
    const dialog = await openVisitForm(user);
    fireEvent.change(within(dialog).getByLabelText("Día y hora"), { target: { value: "2020-01-01T10:00" } });
    await user.click(within(dialog).getByRole("button", { name: "Pedir visita" }));

    expect(within(dialog).getByText("La fecha tiene que ser futura")).toBeInTheDocument();
    expect(within(dialog).getByText("Decinos tu nombre")).toBeInTheDocument();
    expect(within(dialog).getByText("Ingresá un teléfono para que te contacten")).toBeInTheDocument();
    expect(api.agencies.createVisit).not.toHaveBeenCalled();
  });

  it("al enviar con exito muestra una confirmacion visible", async () => {
    api.agencies.createVisit.mockResolvedValue(visit({ fechaPropuesta: new Date("2030-05-10T15:00").toISOString() }));
    const user = userEvent.setup();
    const dialog = await openVisitForm(user);
    await fillVisit(user, dialog, "2030-05-10T15:00");
    await user.type(within(dialog).getByLabelText("Mensaje (opcional)"), "Puedo por la tarde");
    await user.click(within(dialog).getByRole("button", { name: "Pedir visita" }));

    const confirmacion = await screen.findByRole("dialog", { name: "Visita solicitada" });
    expect(confirmacion).toHaveTextContent("Casa con pileta en Ostende");
    expect(api.agencies.createVisit).toHaveBeenCalledWith(2, {
      nombreVisitante: "Marcos",
      telefonoVisitante: "1155550000",
      fechaPropuesta: new Date("2030-05-10T15:00").toISOString(),
      mensajeAsociado: "Puedo por la tarde",
    });

    await user.click(within(confirmacion).getByRole("button", { name: "Listo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("durante el envio el boton queda deshabilitado y no se generan solicitudes duplicadas", async () => {
    let responder: (value: Visit) => void = () => {};
    api.agencies.createVisit.mockReturnValue(new Promise<Visit>((resolve) => (responder = resolve)));
    const user = userEvent.setup();
    const dialog = await openVisitForm(user);
    await fillVisit(user, dialog, "2030-05-10T15:00");
    await user.click(within(dialog).getByRole("button", { name: "Pedir visita" }));

    const enviando = await within(dialog).findByRole("button", { name: "Enviando..." });
    expect(enviando).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.click(enviando);
    fireEvent.submit(dialog.querySelector("form")!);
    expect(api.agencies.createVisit).toHaveBeenCalledTimes(1);

    responder(visit());
    expect(await screen.findByRole("dialog", { name: "Visita solicitada" })).toBeInTheDocument();
  });

  it("si el back rechaza la fecha igual se muestra el error", async () => {
    api.agencies.createVisit.mockRejectedValue(apiError(400, "Datos inválidos", { fechaPropuesta: "La fecha propuesta debe ser futura" }));
    const user = userEvent.setup();
    const dialog = await openVisitForm(user);
    await fillVisit(user, dialog, "2030-05-10T15:00");
    await user.click(within(dialog).getByRole("button", { name: "Pedir visita" }));

    expect(await within(dialog).findByText("La fecha propuesta debe ser futura")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Visita solicitada" })).not.toBeInTheDocument();
  });

  it("el boton no se ofrece en propiedades que no estan publicadas", async () => {
    for (const estado of ["PAUSADA", "RESERVADA", "VENDIDA"] as const) {
      api.properties.getProperty.mockResolvedValue(property({ estado }));
      const { unmount } = renderApp("/propiedades/2");
      expect(await screen.findByText("Esta propiedad ya no recibe visitas.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Pedir visita" })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("el formulario se cierra con escape sin enviar nada", async () => {
    const user = userEvent.setup();
    await openVisitForm(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(api.agencies.createVisit).not.toHaveBeenCalled();
  });
});

describe("sitio de la inmobiliaria y reseñas", () => {
  it("la cabecera muestra nombre, descripcion, telefono clickeable y email", async () => {
    api.agencies.listReviews.mockResolvedValue(paged([review()]));
    renderApp("/inmobiliarias/1");

    expect(await screen.findByRole("heading", { level: 1, name: "Inmobiliaria del Mar" })).toBeInTheDocument();
    expect(screen.getByText("Más de 20 años en Pinamar.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "02254-48-1111" })).toHaveAttribute("href", "tel:02254-48-1111");
    expect(screen.getByRole("link", { name: "juan@inmobiliaria.com" })).toHaveAttribute("href", "mailto:juan@inmobiliaria.com");
    expect(await screen.findByText("4 · 1 reseña")).toBeInTheDocument();
  });

  it("lista sus propiedades publicadas con link al detalle y sus reseñas", async () => {
    api.agencies.listAgencyProperties.mockResolvedValue(paged([property(), property({ id: 5, titulo: "Depto en el centro" })]));
    api.agencies.listReviews.mockResolvedValue(paged([review({ resenia: "Muy buena atención.", nombreSolicitante: "Ana" })]));
    renderApp("/inmobiliarias/1");

    expect(await screen.findByRole("link", { name: /Casa con pileta en Ostende/ })).toHaveAttribute("href", "/propiedades/2");
    expect(screen.getByRole("link", { name: /Depto en el centro/ })).toHaveAttribute("href", "/propiedades/5");
    expect(await screen.findByText("Muy buena atención.")).toBeInTheDocument();
    expect(screen.getByText(/^Ana ·/)).toBeInTheDocument();
  });

  it("sin propiedades ni reseñas muestra un texto y no un bloque vacio", async () => {
    renderApp("/inmobiliarias/1");
    expect(await screen.findByText("Esta inmobiliaria no tiene propiedades publicadas")).toBeInTheDocument();
    expect(await screen.findByText("Todavía no hay reseñas. Dejá la primera.")).toBeInTheDocument();
    expect(screen.getByText("Todavía sin reseñas")).toBeInTheDocument();
  });

  it("una reseña nueva aparece en el listado y actualiza el promedio sin recargar", async () => {
    api.agencies.listReviews.mockResolvedValue(paged([review({ calificacion: 4 })]));
    api.agencies.createReview.mockResolvedValue(review({ id: 2, nombreSolicitante: "Pedro", resenia: "Tardaron en responder.", calificacion: 2 }));
    const user = userEvent.setup();
    renderApp("/inmobiliarias/1");
    await screen.findByText("4 · 1 reseña");

    await user.click(screen.getByRole("radio", { name: "2 estrellas" }));
    await user.type(screen.getByLabelText("Tu nombre"), "Pedro");
    await user.type(screen.getByLabelText("Tu opinión"), "Tardaron en responder.");
    await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

    expect(await screen.findByText("Tardaron en responder.", { selector: "li p" })).toBeInTheDocument();
    expect(screen.getByText("3 · 2 reseñas")).toBeInTheDocument();
    expect(api.agencies.createReview).toHaveBeenCalledWith(1, { nombreSolicitante: "Pedro", resenia: "Tardaron en responder.", calificacion: 2 });
    expect(api.agencies.listReviews).toHaveBeenCalledTimes(1);
  });

  it("no se puede enviar una reseña sin contenido o sin calificacion", async () => {
    const user = userEvent.setup();
    renderApp("/inmobiliarias/1");
    await user.type(await screen.findByLabelText("Tu nombre"), "Pedro");
    await user.click(screen.getByRole("button", { name: "Publicar reseña" }));

    expect(screen.getByText("Contanos cómo fue tu experiencia")).toBeInTheDocument();
    expect(screen.getByText("Elegí una calificación")).toBeInTheDocument();
    expect(api.agencies.createReview).not.toHaveBeenCalled();
  });

  it("la calificacion se elige de 1 a 5 estrellas", async () => {
    const user = userEvent.setup();
    renderApp("/inmobiliarias/1");
    const grupo = await screen.findByRole("radiogroup", { name: "Calificación" });
    expect(within(grupo).getAllByRole("radio")).toHaveLength(5);

    await user.click(within(grupo).getByRole("radio", { name: "5 estrellas" }));
    expect(within(grupo).getByRole("radio", { name: "5 estrellas" })).toBeChecked();
    expect(within(grupo).getByRole("radio", { name: "1 estrella" })).not.toBeChecked();
  });

  it("una inmobiliaria inexistente muestra 'no encontrada'", async () => {
    api.agencies.getAgency.mockRejectedValue(apiError(404, "Inmobiliaria no encontrada"));
    renderApp("/inmobiliarias/999");
    expect(await screen.findByText("No encontramos esa inmobiliaria")).toBeInTheDocument();
  });
});

describe("directorio de inmobiliarias", () => {
  it("lista las inmobiliarias con link a su sitio", async () => {
    api.agencies.listAgencies.mockResolvedValue(paged([AGENCY]));
    renderApp("/inmobiliarias");

    expect(await screen.findByRole("link", { name: /Inmobiliaria del Mar/ })).toHaveAttribute("href", "/inmobiliarias/1");
    expect(screen.getByText("1 inmobiliaria")).toBeInTheDocument();
  });

  it("busca por nombre sin pedir por cada tecla y guarda la busqueda en la url", async () => {
    const user = userEvent.setup();
    renderApp("/inmobiliarias");
    await screen.findByText("No encontramos inmobiliarias con ese nombre");

    await user.type(screen.getByLabelText("Buscar por nombre"), "urbana");
    await waitFor(() => expect(window.location.search).toBe("?nombre=urbana"), { timeout: 2000 });

    const buscados = api.agencies.listAgencies.mock.calls.map(([params]) => params.nombre);
    expect(buscados).toEqual(["", "urbana"]);
  });
});
