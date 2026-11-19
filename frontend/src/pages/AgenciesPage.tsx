import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebounce } from "@uidotdev/usehooks";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { Stars } from "../components/ui/Misc";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { listAgencies } from "../services/agencies";
import type { Agency } from "../types/api";

/**
 * tarjeta de una inmobiliaria en el directorio: logo o inicial, nombre,
 * calificacion, descripcion y contacto. toda la tarjeta lleva a su ficha.
 *
 * @param props agency, la inmobiliaria a mostrar
 * @returns la tarjeta
 */
const AgencyCard = ({ agency }: { agency: Agency }) => {
  const cantidad = agency.cantidadResenias ?? 0;
  const promedio = agency.calificacionPromedio ?? null;

  return (
    <Link
      to={`/inmobiliarias/${agency.id}`}
      className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        {agency.logoUrl ? (
          <img src={agency.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-stone-200 object-cover" />
        ) : (
          <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-700 font-serif text-xl text-white">
            {agency.nombreFantasia.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="font-serif text-lg text-ink transition-colors duration-200 group-hover:text-brand-700">{agency.nombreFantasia}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
            {promedio !== null ? (
              <>
                <Stars value={promedio} />
                <span>
                  {promedio} · {cantidad} {cantidad === 1 ? "reseña" : "reseñas"}
                </span>
              </>
            ) : (
              "Sin reseñas todavía"
            )}
          </p>
        </div>
      </div>

      {agency.descripcion && <p className="mt-3 line-clamp-2 text-sm text-stone-600">{agency.descripcion}</p>}

      <p className="mt-auto pt-4 text-xs text-stone-500">
        {[agency.direccionLinea1, agency.telefonos?.[0]?.telefono].filter(Boolean).join(" · ") || "Ver ficha"}
      </p>
    </Link>
  );
};

/**
 * directorio publico de inmobiliarias: permite buscarlas por nombre y entrar
 * a la ficha de cada una. la busqueda y la pagina se guardan en la url.
 *
 * @returns la pagina
 */
export const AgenciesPage = () => {
  const [params, setParams] = useSearchParams();
  const nombre = params.get("nombre") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // el texto se guarda en la url recien cuando el usuario deja de escribir
  const [text, setText] = useState(nombre);
  const debounced = useDebounce(text, 400);

  // si la url cambia por otro lado (boton atras) se actualiza el input
  useEffect(() => {
    setText(nombre);
  }, [nombre]);

  useEffect(() => {
    const value = debounced.trim();
    if (value !== nombre) setParams(value ? { nombre: value } : {});
    // solo debe correr cuando cambia el texto ya estable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, loading, error, reload } = useApi((signal) => listAgencies({ nombre, page }, signal), [nombre, page]);

  const goToPage = (next: number) => {
    setParams({ ...(nombre ? { nombre } : {}), ...(next > 1 ? { page: String(next) } : {}) });
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      {/* encabezado de la pantalla, en una banda arena a todo el ancho */}
      <section className="bg-stone-300">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-700">Directorio</p>
          <h1 className="mt-3 text-4xl tracking-tight text-ink sm:text-5xl">Inmobiliarias</h1>
          <p className="mt-3 max-w-lg text-stone-700">Conocé a las inmobiliarias que publican en Retama y mirá sus propiedades y reseñas.</p>
          <div className="mt-6 max-w-md">
            <Field label="Buscar por nombre">
              <Input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Nombre de la inmobiliaria" className="h-12" />
            </Field>
          </div>
        </div>
      </section>

    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">

      <p className="mb-5 text-sm text-stone-600" aria-live="polite">
        {data ? (data.total === 1 ? "1 inmobiliaria" : `${data.total} inmobiliarias`) : " "}
      </p>

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data ? (
        <LoadingState message="Buscando inmobiliarias..." />
      ) : data.data.length === 0 && data.total > 0 ? (
        // hay resultados pero la pagina pedida en la url no existe
        <EmptyState
          title="Esa página no existe"
          action={
            <Button variant="secondary" size="sm" onClick={() => goToPage(1)}>
              Ir a la primera página
            </Button>
          }
        />
      ) : data.data.length === 0 ? (
        <EmptyState title="No encontramos inmobiliarias con ese nombre" description="Probá con otra palabra o borrá la búsqueda." />
      ) : (
        <>
          <div className={loading ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"} aria-busy={loading}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.data.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} />
              ))}
            </div>
          </div>
          <div className="mt-8">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={goToPage} />
          </div>
        </>
      )}
    </div>
    </>
  );
};
