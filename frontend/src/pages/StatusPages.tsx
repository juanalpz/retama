import { Link } from "react-router-dom";

const linkClass =
  "mt-6 inline-flex h-11 items-center rounded-lg bg-brand-700 px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-800";

/**
 * pagina para las rutas que no existen.
 *
 * @returns la pagina 404
 */
export const NotFoundPage = () => (
  <div className="mx-auto max-w-xl px-4 py-24 text-center">
    <p className="text-sm font-medium text-brand-700">Error 404</p>
    <h1 className="mt-2 text-3xl tracking-tight text-ink">No encontramos esa página</h1>
    <p className="mt-2 text-sm text-stone-600">Puede que el link esté mal escrito o que la página ya no exista.</p>
    <Link to="/" className={linkClass}>
      Volver al inicio
    </Link>
  </div>
);
