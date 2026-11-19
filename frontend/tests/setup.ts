import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom no implementa el scroll: se reemplaza por una funcion vacia
Element.prototype.scrollIntoView = vi.fn();

// cada test arranca sin componentes montados, sin sesion y en la pagina de inicio
afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.pushState({}, "", "/");
});
