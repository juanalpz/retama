import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { cx } from "../../utils/format";

// secciones publicas que se muestran en el encabezado
const SECTIONS = [
  { to: "/", label: "Propiedades" },
  { to: "/inmobiliarias", label: "Inmobiliarias" },
];

/**
 * layout de las pantallas publicas: encabezado con el logo, la navegacion
 * entre propiedades e inmobiliarias y el acceso para vendedores, el contenido
 * de la pagina y el pie.
 *
 * @returns el layout; la pagina actual se dibuja en el outlet
 */
export const PublicLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-[72px] sm:gap-8">
          <Link to="/" aria-label="Retama, ir al inicio" className="flex shrink-0 items-center">
            {/* en pantallas chicas se muestra solo el isotipo para que entre la navegacion */}
            <img src="/logo-icon.png" alt="Retama" className="h-10 w-auto sm:hidden" />
            <img src="/logo.png" alt="Retama" className="hidden h-11 w-auto sm:block" />
          </Link>

          <nav aria-label="Secciones" className="flex h-full min-w-0 flex-1 items-stretch gap-1 sm:gap-2">
            {SECTIONS.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                // "end" hace que propiedades se marque solo en el inicio y no en todas las rutas
                end={section.to === "/"}
                className={({ isActive }) =>
                  cx(
                    // la seccion activa se marca con una linea verde bosque en la base del encabezado
                    "flex items-center whitespace-nowrap border-b-2 px-2 text-sm transition-colors duration-200 sm:px-3",
                    isActive ? "border-brand-700 font-medium text-brand-700" : "border-transparent text-stone-600 hover:text-ink",
                  )
                }
              >
                {section.label}
              </NavLink>
            ))}
          </nav>

          {/* con la sesion iniciada se ofrece volver al panel en vez de ingresar.
              en pantallas chicas el texto se acorta para que entre todo en una linea */}
          <Link
            to={user ? "/panel/propiedades" : "/login"}
            className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full bg-brand-700 px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-800 sm:px-5"
          >
            {user ? (
              "Mi panel"
            ) : (
              <>
                Ingresar<span className="hidden sm:inline">&nbsp;como vendedor</span>
              </>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 bg-brand-700 text-brand-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-xl text-white">Retama</p>
            <p className="mt-1 text-sm text-brand-200">Propiedades en la Costa Atlantica</p>
          </div>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {SECTIONS.map((section) => (
              <Link key={section.to} to={section.to} className="transition-colors duration-200 hover:text-white">
                {section.label}
              </Link>
            ))}
            <Link to={user ? "/panel/propiedades" : "/login"} className="transition-colors duration-200 hover:text-white">
              {user ? "Mi panel" : "Acceso para vendedores"}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};
