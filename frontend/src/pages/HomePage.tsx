import { Link } from "react-router-dom";
import { PropertyCard } from "../components/properties/PropertyCard";
import { DebouncedInput, PropertyFilters } from "../components/properties/PropertyFilters";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Field";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useProperties } from "../hooks/useProperties";
import { SORT_OPTIONS, usePropertySearchParams } from "../hooks/usePropertySearchParams";
import { useTags } from "../hooks/useTags";
import { cx } from "../utils/format";

// accesos rapidos de la portada: cada uno aplica el filtro de operacion
const OPERATIONS = [
  { value: "", label: "Todas" },
  { value: "VENTA", label: "Comprar" },
  { value: "ALQUILER", label: "Alquilar" },
];

// pasos que explican como se usa el sitio
const STEPS = [
  { title: "Buscá", text: "Filtrá por zona, tipo de propiedad, precio y amenities." },
  { title: "Consultá", text: "Preguntale a la inmobiliaria desde la ficha, sin registrarte." },
  { title: "Visitá", text: "Pedí una visita y coordiná el horario por teléfono." },
];

/**
 * arma el texto con la cantidad de resultados.
 *
 * @param total cantidad de propiedades encontradas
 * @returns el texto en singular o plural
 */
const resultsLabel = (total: number): string => (total === 1 ? "1 propiedad" : `${total} propiedades`);

/**
 * pagina de inicio: portada con el buscador, los pasos de uso del sitio, y el
 * listado publico de propiedades con filtros, orden y paginado. los filtros
 * viven en la url, asi el link se puede compartir.
 *
 * @returns la pagina
 */
export const HomePage = () => {
  const { state, filters, activeCount, setFilter, toggleTag, setPage, clear } = usePropertySearchParams();
  const { result, loading, error, retry } = useProperties(filters);
  const tags = useTags();

  // al cambiar de pagina se vuelve al listado para ver los resultados nuevos
  const goToPage = (page: number) => {
    setPage(page);
    document.getElementById("resultados")?.scrollIntoView({ block: "start" });
  };

  return (
    <>
      {/* portada: una foto a todo el ancho, oscurecida en verde bosque para que el texto se lea */}
      <section className="relative isolate overflow-hidden bg-brand-900">
        <img src="/fotos/foto-19.jpg" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900 via-brand-900/85 to-brand-800/40" />

        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20 lg:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-300">Costa Atlántica</p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] tracking-tight text-white sm:text-6xl">
            Encontrá tu lugar <span className="italic text-brand-300">cerca del mar</span>
          </h1>
          <p className="mt-5 max-w-md text-brand-100">Casas, departamentos, terrenos y locales en venta y alquiler, publicados por inmobiliarias de la zona.</p>

          <div className="mt-8 max-w-xl rounded-3xl bg-white p-2.5 shadow-lift">
            <div role="group" aria-label="Operación" className="mb-2 flex gap-1 rounded-2xl bg-stone-100 p-1">
              {OPERATIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={state.operacion === option.value}
                  onClick={() => setFilter("operacion", option.value)}
                  className={cx(
                    "h-9 flex-1 rounded-xl text-sm transition-colors duration-200",
                    state.operacion === option.value ? "bg-brand-700 font-medium text-white" : "text-stone-600 hover:text-ink",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <DebouncedInput value={state.q} onCommit={(value) => setFilter("q", value)} type="search" placeholder="Buscá por pileta, vista al mar, quincho..." ariaLabel="Buscar propiedades" className="h-12" />
          </div>
        </div>
      </section>

      {/* como funciona: tres pasos numerados sobre un fondo arena */}
      <section aria-labelledby="pasos-titulo" className="bg-stone-300">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
          <h2 id="pasos-titulo" className="font-serif text-2xl text-ink sm:text-3xl">
            <span className="mr-2 text-base text-brand-600">01.</span>Cómo funciona
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-700 font-serif text-lg text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-serif text-xl text-ink">{step.title}</p>
                  <p className="mt-1 text-sm text-stone-700">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div id="resultados" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-ink sm:text-3xl">
              <span className="mr-2 text-base text-brand-600">02.</span>Propiedades disponibles
            </h2>
            {/* mientras llega la primera respuesta todavia no hay un total para mostrar */}
            <p className="mt-1 text-sm text-stone-600" aria-live="polite">
              {result ? resultsLabel(result.total) : " "}
            </p>
          </div>

          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-stone-600">
            Ordenar
            <Select className="h-10 w-auto" value={state.orden} onChange={(event) => setFilter("orden", event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {/* en escritorio los filtros van en una columna fija a la izquierda */}
        <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <PropertyFilters state={state} tags={tags} activeCount={activeCount} onChange={setFilter} onToggleTag={toggleTag} onClear={clear} />
          </div>

          <div>
            {error ? (
              <ErrorState message={error.message} onRetry={retry} />
            ) : !result ? (
              <LoadingState message="Buscando propiedades..." />
            ) : result.data.length === 0 && result.total > 0 ? (
              // hay resultados pero la pagina pedida en la url no existe
              <EmptyState
                title="Esa página no existe"
                description="El listado tiene menos páginas de las que indica el link."
                action={
                  <Button variant="secondary" size="sm" onClick={() => goToPage(1)}>
                    Ir a la primera página
                  </Button>
                }
              />
            ) : result.data.length === 0 ? (
              <EmptyState
                title="No encontramos propiedades con esos filtros"
                description="Probá con menos filtros o con otra zona."
                action={
                  activeCount > 0 ? (
                    <Button variant="secondary" size="sm" onClick={clear}>
                      Limpiar filtros
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                {/* al cambiar un filtro se atenuan los resultados viejos hasta que llegan los nuevos */}
                <div className={loading ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"} aria-busy={loading}>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {result.data.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                </div>

                <div className="mt-10">
                  <Pagination page={result.page} totalPages={result.totalPages} onChange={goToPage} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* invitacion para inmobiliarias: bloque salvia con una foto al costado */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid overflow-hidden rounded-3xl bg-brand-300 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="p-8 sm:p-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-800">Para inmobiliarias</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-brand-900 sm:text-4xl">Publicá tus propiedades y gestioná consultas y visitas en un solo lugar</h2>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/registro" className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-brand-700 px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-800">
                Crear cuenta
              </Link>
              <Link to="/inmobiliarias" className="inline-flex h-11 items-center whitespace-nowrap rounded-full border border-brand-700 px-6 text-sm font-medium text-brand-800 transition-colors duration-200 hover:bg-brand-200">
                Ver inmobiliarias
              </Link>
            </div>
          </div>
          <img src="/fotos/foto-04.jpg" alt="" aria-hidden="true" className="hidden h-full min-h-64 w-full object-cover md:block" />
        </div>
      </section>
    </>
  );
};
