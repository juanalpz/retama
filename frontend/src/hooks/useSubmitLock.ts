/**
 * hook para que un formulario no se envie dos veces.
 */

import { useCallback, useRef, useState } from "react";

/**
 * envuelve el envio de un formulario. mientras un envio esta en curso los
 * siguientes se ignoran, aunque lleguen antes de que el boton alcance a
 * deshabilitarse (por ejemplo, con un doble click muy rapido).
 *
 * @returns [sending, run]: sending indica si hay un envio en curso (para
 *   deshabilitar el boton) y run ejecuta la accion solo si no hay otra corriendo
 */
export const useSubmitLock = (): [boolean, (action: () => Promise<void>) => Promise<void>] => {
  const [sending, setSending] = useState(false);
  // el ref se actualiza en el momento; el estado recien en el proximo render
  const locked = useRef(false);

  const run = useCallback(async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setSending(true);
    try {
      await action();
    } finally {
      locked.current = false;
      setSending(false);
    }
  }, []);

  return [sending, run];
};
