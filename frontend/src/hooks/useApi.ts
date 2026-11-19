/**
 * hook generico para pedir datos a la api.
 */

import { useCallback, useEffect, useRef, useState, type DependencyList, type Dispatch, type SetStateAction } from "react";
import type { ApiError } from "../types/api";

interface UseApiResult<T> {
  // datos de la ultima respuesta, o null mientras no llego ninguna
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  // vuelve a pedir los datos
  reload: () => void;
  // permite actualizar los datos en pantalla sin volver a pedirlos
  setData: Dispatch<SetStateAction<T | null>>;
}

/**
 * ejecuta un pedido al montar el componente y cada vez que cambian sus dependencias.
 * maneja los tres estados de cualquier pantalla (cargando, error y datos) y
 * cancela el pedido si el componente se desmonta o las dependencias cambian antes.
 *
 * @param fetcher funcion que hace el pedido; recibe la señal para cancelarlo
 * @param deps valores de los que depende el pedido (como en useEffect)
 * @returns { data, loading, error, reload, setData }
 */
export const useApi = <T,>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  // se guarda la ultima version de la funcion para no tener que ponerla en las dependencias
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: ApiError) => {
        // un pedido cancelado no es un error
        if (controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, loading, error, reload, setData };
};
