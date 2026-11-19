/**
 * hook de la lista de amenities.
 */

import { useEffect, useState } from "react";
import { listTags } from "../services/properties";
import type { Tag } from "../types/api";

/**
 * pide los amenities una sola vez, al montar el componente.
 * si el pedido falla devuelve una lista vacia: los filtros siguen funcionando sin amenities.
 *
 * @returns la lista de tags (vacia mientras carga)
 */
export const useTags = (): Tag[] => {
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    listTags(controller.signal)
      .then(setTags)
      .catch(() => {
        // sin amenities el filtro simplemente no se muestra
      });

    return () => controller.abort();
  }, []);

  return tags;
};
