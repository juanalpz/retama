import { Link } from "react-router-dom";
import type { Property } from "../../types/api";
import { OPERACION_LABELS, TIPO_LABELS, coverUrl, formatPrice } from "../../utils/format";

// una publicacion se marca como nueva durante sus primeros dias
const DIAS_NUEVA = 10;

/**
 * arma la lista de caracteristicas de una propiedad (superficie, ambientes y
 * dormitorios), dejando afuera las que no tiene.
 *
 * @param property propiedad a describir
 * @returns la lista de textos a mostrar, por ejemplo ["50 m²", "2 amb."]
 */
const details = (property: Property): string[] => {
  const items: string[] = [];
  if (property.superficieTotalM2) items.push(`${property.superficieTotalM2} m²`);
  if (property.ambientes) items.push(`${property.ambientes} amb.`);
  if (property.dormitorios) items.push(`${property.dormitorios} dorm.`);
  return items;
};

/**
 * indica si una propiedad se creo hace poco, para mostrarle la etiqueta "nueva".
 *
 * @param property propiedad con su fecha de creacion
 * @returns true si se creo dentro de los ultimos DIAS_NUEVA dias
 */
const isNew = (property: Property): boolean => Date.now() - new Date(property.createdAt).getTime() < DIAS_NUEVA * 24 * 60 * 60 * 1000;

/**
 * tarjeta de una propiedad en los listados: foto de portada con sus etiquetas,
 * precio, titulo, ubicacion y caracteristicas. toda la tarjeta es un link al detalle.
 *
 * @param props property, la propiedad a mostrar
 * @returns la tarjeta
 */
export const PropertyCard = ({ property }: { property: Property }) => {
  const foto = coverUrl(property);
  const tipo = property.tipoPropiedad ? TIPO_LABELS[property.tipoPropiedad] : "Propiedad";
  const caracteristicas = details(property);

  return (
    <Link
      to={`/propiedades/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card transition-shadow duration-300 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {foto ? (
          // al pasar el mouse la foto se acerca apenas
          <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">Sin foto</div>
        )}

        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">{OPERACION_LABELS[property.operacion]}</span>
          {isNew(property) && <span className="rounded-full bg-brand-700 px-2.5 py-1 text-xs font-medium text-white">Nueva</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p><span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">{tipo}</span></p>
        <h3 className="mt-2.5 line-clamp-2 font-serif text-xl leading-snug text-ink">{property.titulo}</h3>

        {property.barrioZona && (
          <p className="mt-1.5 flex items-center gap-1 text-sm text-stone-500">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <path d="M8 14.5s4.5-4 4.5-7.5a4.5 4.5 0 1 0-9 0c0 3.500 4.500 7.500 4.500 7.500Z" />
              <circle cx="8" cy="7" r="1.6" />
            </svg>
            {property.barrioZona}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-stone-200 pt-4">
          <p className="text-lg font-semibold text-brand-700">{formatPrice(property.precio, property.moneda, property.operacion)}</p>
          {caracteristicas.length > 0 && <p className="shrink-0 pb-0.5 text-xs text-stone-500">{caracteristicas.join(" · ")}</p>}
        </div>
      </div>
    </Link>
  );
};
