/**
 * componentes para los estados de un listado: cargando, vacio y error.
 * se reutilizan en todas las pantallas para que ninguna quede en blanco.
 */

import type { ReactNode } from "react";
import { Button } from "./Button";

/**
 * indicador de carga: un circulo que gira.
 *
 * @param props label, texto que se lee con lectores de pantalla (opcional)
 * @returns el indicador
 */
export const Spinner = ({ label = "Cargando" }: { label?: string }) => (
  <span role="status" aria-label={label} className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
);

/**
 * bloque centrado que se muestra mientras llegan los datos.
 *
 * @param props message, texto debajo del indicador (opcional)
 * @returns el bloque de carga
 */
export const LoadingState = ({ message = "Cargando..." }: { message?: string }) => (
  <div className="flex flex-col items-center gap-3 py-16 text-sm text-stone-500">
    <Spinner />
    {message}
  </div>
);

/**
 * bloque que se muestra cuando un listado no tiene resultados.
 *
 * @param props title, description (opcional) y action, un boton o link (opcional)
 * @returns el bloque de estado vacio
 */
export const EmptyState = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-14 text-center">
    <p className="font-serif text-xl text-ink">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

/**
 * bloque que se muestra cuando un pedido falla, con la opcion de reintentar.
 *
 * @param props message, el mensaje que devolvio la api, y onRetry (opcional)
 * @returns el bloque de error
 */
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
    <p className="font-medium text-red-800">No pudimos cargar la información</p>
    <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{message}</p>
    {onRetry && (
      <div className="mt-5 flex justify-center">
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    )}
  </div>
);
