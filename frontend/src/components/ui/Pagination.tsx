import { cx } from "../../utils/format";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/**
 * calcula que numeros de pagina mostrar: la primera, la ultima y las vecinas
 * de la actual. los saltos se marcan con null.
 *
 * @param page pagina actual
 * @param totalPages cantidad total de paginas
 * @returns la lista de paginas a dibujar, con null donde va "..."
 */
const visiblePages = (page: number, totalPages: number): (number | null)[] => {
  const pages: (number | null)[] = [];
  for (let n = 1; n <= totalPages; n++) {
    const cerca = n === 1 || n === totalPages || Math.abs(n - page) <= 1;
    if (cerca) pages.push(n);
    else if (pages[pages.length - 1] !== null) pages.push(null);
  }
  return pages;
};

/**
 * paginador con anterior, numeros y siguiente. no se dibuja si hay una sola pagina.
 *
 * @param props page, totalPages y onChange, que recibe la pagina elegida
 * @returns el paginador, o null si no hace falta
 */
export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const base = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3.5 text-sm transition-colors duration-200";

  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-1">
      <button type="button" className={cx(base, "text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent")} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>

      {visiblePages(page, totalPages).map((n, index) =>
        n === null ? (
          <span key={`salto-${index}`} className="px-1 text-stone-400">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            aria-current={n === page ? "page" : undefined}
            className={cx(base, n === page ? "bg-brand-700 font-medium text-white" : "text-stone-700 hover:bg-stone-100")}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ),
      )}

      <button type="button" className={cx(base, "text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent")} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </nav>
  );
};
