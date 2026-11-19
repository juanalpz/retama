/**
 * piezas chicas de interfaz: area de texto, etiqueta de estado, aviso y estrellas.
 */

import type { TextareaHTMLAttributes } from "react";
import { cx } from "../../utils/format";
import { STATUS_STYLES } from "../../utils/status";

/**
 * area de texto con el estilo del tema.
 *
 * @param props invalid (marca el borde en rojo) y cualquier atributo de un textarea
 * @returns el textarea
 */
export const Textarea = ({ className, invalid, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) => (
  <textarea
    className={cx(
      "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-stone-400",
      "transition-[border-color,box-shadow] duration-200 hover:border-stone-400",
      "focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100",
      invalid && "border-red-400",
      className,
    )}
    aria-invalid={invalid || undefined}
    {...rest}
  />
);

/**
 * etiqueta de color para el estado de una propiedad o de una visita.
 *
 * @param props status (el estado, por ejemplo PUBLICADA) y label (el texto a mostrar)
 * @returns la etiqueta
 */
export const StatusBadge = ({ status, label }: { status: string; label: string }) => (
  <span className={cx("inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium", STATUS_STYLES[status] ?? "bg-stone-100 text-stone-700")}>{label}</span>
);

/**
 * aviso dentro de un formulario: error de la api o confirmacion de que salio bien.
 *
 * @param props kind ("error" o "success") y el mensaje como children
 * @returns el aviso
 */
export const Alert = ({ kind, children }: { kind: "error" | "success"; children: string }) => (
  <p
    role={kind === "error" ? "alert" : "status"}
    className={cx(
      "rounded-xl border px-3.5 py-2.5 text-sm",
      kind === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-brand-200 bg-brand-100 text-brand-800",
    )}
  >
    {children}
  </p>
);

/**
 * calificacion en estrellas, solo para mostrar.
 *
 * @param props value, calificacion de 0 a 5 (puede tener decimales), y onDark,
 *   true cuando se dibuja sobre un fondo verde bosque
 * @returns las cinco estrellas, con las primeras llenas segun el valor redondeado
 */
export const Stars = ({ value, onDark = false }: { value: number; onDark?: boolean }) => (
  <span aria-label={`${value} de 5 estrellas`} className={cx("inline-flex", onDark ? "text-brand-300" : "text-brand-600")}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} aria-hidden="true" className={n <= Math.round(value) ? "" : onDark ? "text-brand-600" : "text-stone-300"}>
        ★
      </span>
    ))}
  </span>
);
