import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Gallery } from "../components/properties/Gallery";
import { QuestionsSection } from "../components/properties/QuestionsSection";
import { VisitRequestModal } from "../components/properties/VisitRequestModal";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/Misc";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useApi } from "../hooks/useApi";
import { getProperty } from "../services/properties";
import type { Property } from "../types/api";
import { OPERACION_LABELS, TIPO_LABELS, formatPrice } from "../utils/format";
import { PROPERTY_STATUS_LABELS } from "../utils/status";

/**
 * arma la lista de atributos de una propiedad, dejando afuera los que no
 * tiene. en un terreno no aparecen superficie cubierta, ambientes,
 * dormitorios ni baños porque la api los devuelve vacios.
 *
 * @param property propiedad a describir
 * @returns pares [etiqueta, valor] listos para mostrar
 */
const attributes = (property: Property): [string, string][] => {
  const items: [string, string | null][] = [
    ["Tipo", property.tipoPropiedad ? TIPO_LABELS[property.tipoPropiedad] : null],
    ["Operación", OPERACION_LABELS[property.operacion]],
    ["Superficie total", property.superficieTotalM2 ? `${property.superficieTotalM2} m²` : null],
    ["Superficie cubierta", property.superficieCubiertaM2 ? `${property.superficieCubiertaM2} m²` : null],
    ["Ambientes", property.ambientes ? String(property.ambientes) : null],
    ["Dormitorios", property.dormitorios ? String(property.dormitorios) : null],
    ["Baños", property.banios ? String(property.banios) : null],
    ["Antigüedad", property.antiguedad === null ? null : property.antiguedad === 0 ? "A estrenar" : `${property.antiguedad} años`],
  ];
  return items.filter((item): item is [string, string] => item[1] !== null);
};

/**
 * pagina de detalle de una propiedad: galeria, datos, amenities, inmobiliaria,
 * boton para pedir una visita y la seccion de consultas.
 *
 * @returns la pagina
 */
export const PropertyDetailPage = () => {
  const { id = "" } = useParams();
  const { data: property, loading, error, reload } = useApi((signal) => getProperty(id, signal), [id]);
  const [visitOpen, setVisitOpen] = useState(false);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {error.status === 404 ? (
          <EmptyState
            title="No encontramos esa propiedad"
            description="Puede que el link esté mal o que la publicación ya no exista."
            action={
              <Link to="/" className="text-sm font-medium text-brand-700 underline underline-offset-4">
                Ver todas las propiedades
              </Link>
            }
          />
        ) : (
          <ErrorState message={error.message} onRetry={reload} />
        )}
      </div>
    );
  }

  if (loading || !property) {
    return <LoadingState message="Cargando la propiedad..." />;
  }

  const publicada = property.estado === "PUBLICADA";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link to="/" className="text-sm text-stone-600 transition-colors duration-200 hover:text-brand-800">
        ← Volver al listado
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Gallery photos={property.fotos} title={property.titulo} />

          <div className="mt-6">
            {!publicada && (
              <div className="mb-2">
                <StatusBadge status={property.estado} label={PROPERTY_STATUS_LABELS[property.estado]} />
              </div>
            )}
            <h1 className="text-3xl tracking-tight text-ink">{property.titulo}</h1>
            <p className="mt-1 text-sm text-stone-600">
              {[property.direccionLinea1, property.barrioZona].filter(Boolean).join(" · ")}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 rounded-3xl bg-stone-300 p-6 sm:grid-cols-4">
            {attributes(property).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wider text-stone-600">{label}</dt>
                <dd className="mt-1 font-serif text-lg text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {property.tags && property.tags.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Amenities">
              {property.tags.map((item) => (
                <li key={item.id} className="rounded-full bg-brand-300 px-3.5 py-1.5 text-xs font-medium text-brand-900">
                  {item.tag.tag}
                </li>
              ))}
            </ul>
          )}

          {property.descripcion && <p className="mt-6 max-w-2xl whitespace-pre-line leading-relaxed text-stone-700">{property.descripcion}</p>}

          <div className="mt-10">
            <QuestionsSection propertyId={property.id} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-brand-700 p-6 text-white shadow-lift sm:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-300">{OPERACION_LABELS[property.operacion]}</p>
            <p className="mt-1 font-serif text-4xl text-white">{formatPrice(property.precio, property.moneda, property.operacion)}</p>

            {/* la visita solo se ofrece en propiedades publicadas */}
            {publicada ? (
              <Button variant="light" className="mt-5 w-full" onClick={() => setVisitOpen(true)}>
                Pedir visita
              </Button>
            ) : (
              <p className="mt-4 text-sm text-brand-200">Esta propiedad ya no recibe visitas.</p>
            )}

            <div className="mt-6 border-t border-brand-600 pt-5">
              <p className="text-xs uppercase tracking-wider text-brand-300">Publicada por</p>
              <Link to={`/inmobiliarias/${property.agency.id}`} className="mt-1 block font-serif text-xl text-white underline-offset-4 hover:underline">
                {property.agency.nombreFantasia}
              </Link>
              {property.agency.telefonos?.[0] && (
                <a href={`tel:${property.agency.telefonos[0].telefono}`} className="mt-1 block text-sm text-brand-100 transition-colors duration-200 hover:text-white">
                  {property.agency.telefonos[0].telefono}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>

      {visitOpen && <VisitRequestModal propertyId={property.id} propertyTitle={property.titulo} onClose={() => setVisitOpen(false)} />}
    </div>
  );
};
