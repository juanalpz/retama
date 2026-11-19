import { Link, useParams } from "react-router-dom";
import { ReviewForm } from "../components/agency/ReviewForm";
import { PropertyCard } from "../components/properties/PropertyCard";
import { Stars } from "../components/ui/Misc";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { getAgency, listAgencyProperties, listReviews } from "../services/agencies";
import type { Review } from "../types/api";
import { formatDate } from "../utils/dates";

/**
 * calcula el promedio de un listado de reseñas.
 *
 * @param reviews reseñas cargadas en pantalla
 * @returns el promedio con un decimal, o null si no hay reseñas
 */
const average = (reviews: Review[]): number | null =>
  reviews.length === 0 ? null : Math.round((reviews.reduce((sum, review) => sum + review.calificacion, 0) / reviews.length) * 10) / 10;

/**
 * sitio publico de una inmobiliaria: datos de contacto, calificacion,
 * propiedades publicadas y reseñas, con el formulario para dejar una.
 *
 * @returns la pagina
 */
export const AgencyPage = () => {
  const { id = "" } = useParams();
  const agency = useApi((signal) => getAgency(id, signal), [id]);
  const properties = useApi((signal) => listAgencyProperties(id, signal), [id]);
  const reviews = useApi((signal) => listReviews(id, signal), [id]);

  if (agency.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {agency.error.status === 404 ? (
          <EmptyState
            title="No encontramos esa inmobiliaria"
            description="Puede que el link esté mal o que la inmobiliaria ya no exista."
            action={
              <Link to="/inmobiliarias" className="text-sm font-medium text-brand-700 underline underline-offset-4">
                Ver todas las inmobiliarias
              </Link>
            }
          />
        ) : (
          <ErrorState message={agency.error.message} onRetry={agency.reload} />
        )}
      </div>
    );
  }

  if (!agency.data) {
    return <LoadingState message="Cargando la inmobiliaria..." />;
  }

  const info = agency.data;
  const lista = reviews.data?.data ?? [];
  // el promedio y la cantidad salen de las reseñas en pantalla, asi se actualizan
  // al publicar una nueva. mientras cargan se usa lo que informo la api.
  const promedio = reviews.data ? average(lista) : info.calificacionPromedio ?? null;
  const cantidad = reviews.data ? reviews.data.total : info.cantidadResenias ?? 0;

  // suma la reseña nueva al listado sin volver a pedirlo
  const addReview = (review: Review) => {
    reviews.setData((current) => (current ? { ...current, data: [review, ...current.data], total: current.total + 1 } : current));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="rounded-3xl bg-brand-700 p-6 text-white shadow-lift sm:p-9">
        <div className="flex flex-wrap items-start gap-4">
          {info.logoUrl ? (
            <img src={info.logoUrl} alt="" className="h-20 w-20 rounded-2xl bg-white object-cover" />
          ) : (
            <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-300 font-serif text-4xl text-brand-900">
              {info.nombreFantasia.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl tracking-tight text-white sm:text-4xl">{info.nombreFantasia}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-brand-100">
              {promedio !== null ? (
                <>
                  <Stars value={promedio} onDark />
                  <span>
                    {promedio} · {cantidad} {cantidad === 1 ? "reseña" : "reseñas"}
                  </span>
                </>
              ) : (
                <span>Todavía sin reseñas</span>
              )}
            </p>
            {info.descripcion && <p className="mt-3 max-w-2xl text-brand-100">{info.descripcion}</p>}
          </div>
        </div>

        <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4 border-t border-brand-600 pt-6 text-sm">
          {info.telefonos?.map((telefono) => (
            <div key={telefono.id}>
              <dt className="text-xs uppercase tracking-wider text-brand-300">Teléfono</dt>
              <dd>
                <a href={`tel:${telefono.telefono}`} className="font-medium text-white underline-offset-4 hover:underline">
                  {telefono.telefono}
                </a>
              </dd>
            </div>
          ))}
          {info.correos?.map((correo) => (
            <div key={correo.id}>
              <dt className="text-xs uppercase tracking-wider text-brand-300">Email</dt>
              <dd>
                <a href={`mailto:${correo.correo}`} className="font-medium text-white underline-offset-4 hover:underline">
                  {correo.correo}
                </a>
              </dd>
            </div>
          ))}
          {info.direccionLinea1 && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-brand-300">Oficina</dt>
              <dd className="font-medium text-white">{info.direccionLinea1}</dd>
            </div>
          )}
        </dl>
      </header>

      <section className="mt-10" aria-labelledby="propiedades-titulo">
        <h2 id="propiedades-titulo" className="mb-5 font-serif text-2xl text-ink">
          Sus propiedades
        </h2>
        {properties.error ? (
          <ErrorState message={properties.error.message} onRetry={properties.reload} />
        ) : !properties.data ? (
          <LoadingState message="Cargando propiedades..." />
        ) : properties.data.data.length === 0 ? (
          <EmptyState title="Esta inmobiliaria no tiene propiedades publicadas" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.data.data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" aria-labelledby="resenias-titulo">
        <div>
          <h2 id="resenias-titulo" className="mb-2 font-serif text-2xl text-ink">
            Reseñas
          </h2>
          {reviews.error ? (
            <ErrorState message={reviews.error.message} onRetry={reviews.reload} />
          ) : !reviews.data ? (
            <LoadingState message="Cargando reseñas..." />
          ) : lista.length === 0 ? (
            <p className="py-6 text-sm text-stone-500">Todavía no hay reseñas. Dejá la primera.</p>
          ) : (
            <ul className="divide-y divide-stone-200">
              {lista.map((review) => (
                <li key={review.id} className="py-4">
                  <Stars value={review.calificacion} />
                  <p className="mt-1 text-sm text-ink">{review.resenia}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {review.nombreSolicitante} · {formatDate(review.fechaCreacion)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:pt-9">
          <ReviewForm agencyId={info.id} onCreated={addReview} />
        </div>
      </section>
    </div>
  );
};
