/**
 * hook del listado publico de propiedades.
 */

import { useEffect, useState } from "react";
import { listProperties, type PropertyFilters } from "../services/properties";
import type { ApiError, Paginated, Property } from "../types/api";

interface UsePropertiesResult {
  // resultado paginado, o null mientras no llego la primera respuesta
  result: Paginated<Property> | null;
  loading: boolean;
  error: ApiError | null;
  // vuelve a pedir el listado con los mismos filtros
  retry: () => void;
}

/**
 * pide el listado de propiedades cada vez que cambian los filtros.
 * si los filtros cambian antes de que llegue la respuesta, el pedido anterior
 * se cancela para que nunca se muestre un resultado viejo.
 *
 * @param filters filtros, orden y pagina del listado
 * @returns { result, loading, error, retry }
 */
export const useProperties = (filters: PropertyFilters): UsePropertiesResult => {
  const [result, setResult] = useState<Paginated<Property> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  // cambia cada vez que se pide reintentar, para volver a disparar el efecto
  const [attempt, setAttempt] = useState(0);

  // los filtros llegan como un objeto nuevo en cada render. se comparan por su
  // contenido para pedir de nuevo solo cuando de verdad cambiaron.
  const key = JSON.stringify(filters);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listProperties(JSON.parse(key) as PropertyFilters, controller.signal)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err: ApiError) => {
        // un pedido cancelado no es un error: ya hay otro en camino
        if (controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });

    // limpieza: al cambiar los filtros o salir de la pantalla se cancela el pedido
    return () => controller.abort();
  }, [key, attempt]);

  return { result, loading, error, retry: () => setAttempt((n) => n + 1) };
};
