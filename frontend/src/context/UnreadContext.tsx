/**
 * contexto del contador de actividad sin leer del panel.
 * el layout del panel lo mantiene actualizado y cualquier pantalla puede
 * leerlo o pedir que se actualice (por ejemplo, despues de marcar algo como leido).
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePolling } from "../hooks/usePolling";
import { getUnreadCount } from "../services/panel";

interface UnreadContextValue {
  // cantidad de actividad sin leer
  unread: number;
  // vuelve a pedir el contador a la api
  refresh: () => void;
}

const UnreadContext = createContext<UnreadContextValue>({ unread: 0, refresh: () => {} });

// cada cuanto se consulta el contador, en milisegundos
const POLL_INTERVAL = 15000;

/**
 * proveedor del contador. consulta la api al entrar al panel y despues cada
 * 15 segundos. como vive dentro del layout del panel, el polling se corta
 * solo al salir del panel o al cerrar sesion.
 *
 * @param props children, las pantallas del panel
 * @returns el proveedor del contexto
 */
export const UnreadProvider = ({ children }: { children: ReactNode }) => {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    getUnreadCount()
      .then(setUnread)
      .catch(() => {
        // si un pedido falla se conserva el ultimo valor y se reintenta en la proxima vuelta
      });
  }, []);

  usePolling(refresh, POLL_INTERVAL);

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh]);

  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
};

/**
 * da acceso al contador de actividad sin leer.
 *
 * @returns { unread, refresh }
 */
export const useUnread = (): UnreadContextValue => useContext(UnreadContext);
