/**
 * hook para repetir una accion cada cierto tiempo.
 */

import { useEffect, useRef } from "react";

/**
 * ejecuta una funcion al montar y despues cada intervalMs milisegundos.
 * el intervalo se corta solo cuando el componente se desmonta o cuando
 * enabled pasa a false, asi no quedan pedidos corriendo de fondo.
 *
 * @param callback funcion a repetir
 * @param intervalMs tiempo entre ejecuciones, en milisegundos
 * @param enabled false para pausar el polling (por defecto true)
 * @returns nada
 */
export const usePolling = (callback: () => void, intervalMs: number, enabled = true): void => {
  // se guarda la ultima version del callback para no reiniciar el intervalo en cada render
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    callbackRef.current();
    const id = window.setInterval(() => callbackRef.current(), intervalMs);

    // limpieza: se corta el intervalo
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
};
