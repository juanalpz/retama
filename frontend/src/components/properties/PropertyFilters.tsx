import { useEffect, useState, type ReactNode } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import type { SearchState } from "../../hooks/usePropertySearchParams";
import type { Tag } from "../../types/api";
import { cx } from "../../utils/format";
import { Input } from "../ui/Field";

interface PropertyFiltersProps {
  state: SearchState;
  tags: Tag[];
  // cantidad de filtros aplicados, para mostrarla en el boton de celular
  activeCount: number;
  onChange: (key: Exclude<keyof SearchState, "tags" | "page">, value: string) => void;
  onToggleTag: (tag: string) => void;
  onClear: () => void;
}

interface DebouncedInputProps {
  value: string;
  onCommit: (value: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  ariaLabel?: string;
  className?: string;
}

/**
 * input que avisa el cambio recien cuando el usuario deja de escribir.
 * evita disparar un pedido a la api por cada tecla.
 *
 * @param props value (valor actual en la url), onCommit (recibe el texto ya
 *   estable) y los atributos de presentacion del input
 * @returns el input
 */
export const DebouncedInput = ({ value, onCommit, type = "text", placeholder, inputMode, ariaLabel, className }: DebouncedInputProps) => {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 400);

  // si la url cambia por otro lado (boton atras, limpiar filtros) se actualiza el input
  useEffect(() => {
    setText(value);
  }, [value]);

  // cuando el texto queda quieto se informa el valor, solo si cambio
  useEffect(() => {
    if (debounced !== value) onCommit(debounced.trim());
    // solo debe correr cuando cambia el texto ya estable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <Input type={type} value={text} placeholder={placeholder} inputMode={inputMode} aria-label={ariaLabel} className={className} onChange={(event) => setText(event.target.value)} />
  );
};

/**
 * opcion de un filtro, con forma de pastilla. la elegida se pinta de verde bosque.
 *
 * @param props active (si esta elegida), onClick y el texto como children
 * @returns el boton
 */
const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cx(
      "h-9 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors duration-200",
      active ? "border-brand-700 bg-brand-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-brand-700 hover:text-brand-700",
    )}
  >
    {children}
  </button>
);

/**
 * grupo de un filtro: su titulo y los controles debajo.
 *
 * @param props title y los controles como children
 * @returns el grupo
 */
const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="border-t border-stone-200 py-5 first:border-t-0 first:pt-0 last:pb-0">
    <h3 className="mb-3 text-sm font-medium text-ink">{title}</h3>
    {children}
  </div>
);

// opciones de los filtros que se eligen con pastillas
const TIPOS = [
  { value: "", label: "Todos" },
  { value: "CASA", label: "Casa" },
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "TERRENO", label: "Terreno" },
  { value: "COMERCIAL", label: "Local" },
];
const AMBIENTES = ["", "1", "2", "3", "4", "5"];

/**
 * panel de filtros del listado de propiedades: tipo, zona, ambientes, rango
 * de precio y amenities. la busqueda por texto y la operacion estan en la
 * portada del inicio. cada cambio se guarda en la url. en pantallas chicas
 * el panel se pliega detras de un boton.
 *
 * @param props state (filtros actuales), tags (amenities disponibles),
 *   activeCount, onChange (cambia un filtro), onToggleTag (agrega o quita un
 *   amenity) y onClear (quita todos los filtros)
 * @returns el panel de filtros
 */
export const PropertyFilters = ({ state, tags, activeCount, onChange, onToggleTag, onClear }: PropertyFiltersProps) => {
  // en celular los filtros arrancan plegados para llegar rapido al listado
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Filtros" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 font-serif text-xl text-ink lg:pointer-events-none">
          Filtros
          {activeCount > 0 && <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-700 px-1.5 font-sans text-xs font-medium text-white">{activeCount}</span>}
          <span aria-hidden="true" className="text-sm text-stone-500 lg:hidden">
            {open ? "Ocultar" : "Mostrar"}
          </span>
        </button>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-sm font-medium text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors duration-200 hover:decoration-brand-700">
            Limpiar
          </button>
        )}
      </div>

      <div className={cx("mt-5", !open && "hidden lg:block")}>
        <Group title="Tipo de propiedad">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((tipo) => (
              <Chip key={tipo.value} active={state.tipo === tipo.value} onClick={() => onChange("tipo", tipo.value)}>
                {tipo.label}
              </Chip>
            ))}
          </div>
        </Group>

        <Group title="Zona">
          <DebouncedInput value={state.barrioZona} onCommit={(value) => onChange("barrioZona", value)} placeholder="Centro, Ostende..." ariaLabel="Zona" />
        </Group>

        <Group title="Ambientes">
          <div className="flex flex-wrap gap-2">
            {AMBIENTES.map((n) => (
              <Chip key={n} active={state.ambientes === n} onClick={() => onChange("ambientes", n)}>
                {n === "" ? "Todos" : n}
              </Chip>
            ))}
          </div>
        </Group>

        <Group title="Precio">
          <div className="flex items-center gap-2">
            <DebouncedInput value={state.minPrice} onCommit={(value) => onChange("minPrice", value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Desde" ariaLabel="Precio mínimo" />
            <span aria-hidden="true" className="text-stone-400">
              —
            </span>
            <DebouncedInput value={state.maxPrice} onCommit={(value) => onChange("maxPrice", value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Hasta" ariaLabel="Precio máximo" />
          </div>
        </Group>

        {tags.length > 0 && (
          <Group title="Amenities">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Chip key={tag.id} active={state.tags.includes(tag.tag)} onClick={() => onToggleTag(tag.tag)}>
                  {tag.tag}
                </Chip>
              ))}
            </div>
          </Group>
        )}
      </div>
    </section>
  );
};
