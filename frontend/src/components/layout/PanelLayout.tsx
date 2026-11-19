import { Link, NavLink, Outlet } from "react-router-dom";
import { UnreadProvider, useUnread } from "../../context/UnreadContext";
import { useAuth } from "../../hooks/useAuth";
import { cx } from "../../utils/format";

// secciones del panel, en el orden de la navegacion
const SECTIONS = [
  { to: "/panel/propiedades", label: "Mis propiedades" },
  { to: "/panel/visitas", label: "Visitas" },
  { to: "/panel/consultas", label: "Consultas" },
  { to: "/panel/actividad", label: "Actividad" },
  { to: "/panel/reportes", label: "Reportes" },
];

/**
 * barra de navegacion del panel. marca la seccion activa y muestra el
 * contador de novedades sin leer junto a "actividad".
 *
 * @returns la barra de navegacion
 */
const PanelNav = () => {
  const { unread } = useUnread();

  return (
    <nav aria-label="Secciones del panel" className="bg-brand-700">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              cx(
                "flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm transition-colors duration-200",
                isActive ? "border-brand-300 font-medium text-white" : "border-transparent text-brand-200 hover:text-white",
              )
            }
          >
            {section.label}
            {section.to === "/panel/actividad" && unread > 0 && (
              <span aria-label={`${unread} sin leer`} className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-300 px-1.5 text-xs font-medium text-brand-900">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

/**
 * layout del panel del vendedor: encabezado con la inmobiliaria y el boton de
 * salir, la navegacion por secciones y la pantalla actual.
 *
 * @returns el layout; la pantalla actual se dibuja en el outlet
 */
export const PanelLayout = () => {
  // logout cierra la sesion y vuelve al listado publico
  const { user, logout } = useAuth();

  return (
    <UnreadProvider>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
            <Link to="/" aria-label="Retama, ir al sitio público" className="flex shrink-0 items-center">
              <img src="/logo.png" alt="Retama" className="h-11 w-auto" />
            </Link>

            <div className="flex min-w-0 items-center gap-1 sm:gap-3">
              <Link to="/panel/inmobiliaria" className="min-w-0 truncate rounded-lg px-2 py-1.5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-stone-100">
                {user?.inmobiliaria?.nombreFantasia ?? user?.nombre}
              </Link>
              <button type="button" onClick={logout} className="shrink-0 rounded-lg px-2 py-1.5 text-sm text-stone-600 transition-colors duration-200 hover:bg-stone-100 hover:text-ink">
                Salir
              </button>
            </div>
          </div>
        </header>

        <PanelNav />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </UnreadProvider>
  );
};
