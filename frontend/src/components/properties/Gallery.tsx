import { useState } from "react";
import type { Photo } from "../../types/api";
import { cx } from "../../utils/format";

/**
 * galeria de una propiedad: una foto principal y las miniaturas debajo.
 * al hacer click en una miniatura pasa a ser la principal.
 *
 * @param props photos (fotos de la propiedad) y title (para el texto alternativo)
 * @returns la galeria, o un recuadro vacio si no hay fotos
 */
export const Gallery = ({ photos, title }: { photos: Photo[]; title: string }) => {
  // la portada va primero y el resto en el orden que eligio el vendedor
  const ordered = [...photos].sort((a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (ordered.length === 0) {
    return <div className="flex aspect-[16/10] items-center justify-center rounded-3xl bg-stone-100 text-sm text-stone-400">Sin fotos</div>;
  }

  const selected = ordered.find((photo) => photo.id === selectedId) ?? ordered[0];

  return (
    <div>
      <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-stone-100 shadow-card">
        <img src={selected.url} alt={title} className="h-full w-full object-cover" />
      </div>

      {ordered.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {ordered.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`Ver foto ${index + 1}`}
              aria-pressed={photo.id === selected.id}
              onClick={() => setSelectedId(photo.id)}
              className={cx(
                "h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-[border-color,opacity] duration-200",
                photo.id === selected.id ? "border-brand-700" : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
