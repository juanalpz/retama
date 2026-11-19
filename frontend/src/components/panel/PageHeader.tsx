import type { ReactNode } from "react";

/**
 * encabezado de una pantalla del panel: titulo, descripcion y acciones a la derecha.
 *
 * @param props title, description (opcional) y actions, botones o filtros (opcional)
 * @returns el encabezado
 */
export const PageHeader = ({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-3xl tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 text-sm text-stone-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
