/**
 * hook que guarda los filtros del listado en la url.
 * asi un link copiado, una recarga o el boton atras muestran siempre los mismos resultados.
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { PropertyFilters } from "../services/properties";

// cantidad de propiedades por pagina del listado
export const PAGE_SIZE = 12;

// opciones del selector de orden. value es lo que se guarda en la url.
export const SORT_OPTIONS = [
  { value: "", label: "Más recientes", sortBy: "fecha", sortOrder: "DESC" },
  { value: "precio-asc", label: "Menor precio", sortBy: "precio", sortOrder: "ASC" },
  { value: "precio-desc", label: "Mayor precio", sortBy: "precio", sortOrder: "DESC" },
  { value: "superficie-desc", label: "Mayor superficie", sortBy: "superficie", sortOrder: "DESC" },
  { value: "superficie-asc", label: "Menor superficie", sortBy: "superficie", sortOrder: "ASC" },
] as const;

// filtros tal como estan escritos en la url (todo texto)
export interface SearchState {
  q: string;
  tipo: string;
  operacion: string;
  minPrice: string;
  maxPrice: string;
  barrioZona: string;
  ambientes: string;
  tags: string[];
  orden: string;
  page: number;
}

/**
 * lee los filtros de la url y da las funciones para cambiarlos.
 *
 * @returns state (filtros de la url), filters (los mismos, listos para la api),
 *   activeCount (cuantos filtros hay aplicados), setFilter, toggleTag, setPage y clear
 */
export const usePropertySearchParams = () => {
  const [params, setParams] = useSearchParams();

  const state: SearchState = useMemo(
    () => ({
      q: params.get("q") ?? "",
      tipo: params.get("tipo") ?? "",
      operacion: params.get("operacion") ?? "",
      minPrice: params.get("minPrice") ?? "",
      maxPrice: params.get("maxPrice") ?? "",
      barrioZona: params.get("barrioZona") ?? "",
      ambientes: params.get("ambientes") ?? "",
      tags: (params.get("tags") ?? "").split(",").filter(Boolean),
      orden: params.get("orden") ?? "",
      page: Math.max(1, Number(params.get("page")) || 1),
    }),
    [params],
  );

  // traduce el estado de la url a los parametros que espera la api
  const filters: PropertyFilters = useMemo(() => {
    const sort = SORT_OPTIONS.find((option) => option.value === state.orden) ?? SORT_OPTIONS[0];
    return {
      q: state.q,
      tipo: state.tipo,
      operacion: state.operacion,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      barrioZona: state.barrioZona,
      ambientes: state.ambientes,
      tags: state.tags,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
      page: state.page,
      limit: PAGE_SIZE,
    };
  }, [state]);

  // cambia un filtro. cualquier cambio de filtro vuelve a la primera pagina.
  const setFilter = useCallback(
    (key: Exclude<keyof SearchState, "tags" | "page">, value: string) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete("page");
        return next;
      });
    },
    [setParams],
  );

  // agrega o quita un amenity de la lista
  const toggleTag = useCallback(
    (tag: string) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        const actuales = (next.get("tags") ?? "").split(",").filter(Boolean);
        const nuevos = actuales.includes(tag) ? actuales.filter((t) => t !== tag) : [...actuales, tag];
        if (nuevos.length > 0) next.set("tags", nuevos.join(","));
        else next.delete("tags");
        next.delete("page");
        return next;
      });
    },
    [setParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        if (page > 1) next.set("page", String(page));
        else next.delete("page");
        return next;
      });
    },
    [setParams],
  );

  // saca todos los filtros y deja solo el orden elegido
  const clear = useCallback(() => {
    setParams((current) => {
      const next = new URLSearchParams();
      const orden = current.get("orden");
      if (orden) next.set("orden", orden);
      return next;
    });
  }, [setParams]);

  const activeCount =
    [state.q, state.tipo, state.operacion, state.minPrice, state.maxPrice, state.barrioZona, state.ambientes].filter(Boolean).length + state.tags.length;

  return { state, filters, activeCount, setFilter, toggleTag, setPage, clear };
};
