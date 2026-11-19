import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cx } from "../../utils/format";

// clases compartidas por inputs y selects
const CONTROL =
  "h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-ink placeholder:text-stone-400 " +
  "transition-[border-color,box-shadow] duration-200 hover:border-stone-400 " +
  // al enfocar: borde verde bosque y un halo suave en salvia
  "focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100";

interface FieldProps {
  label: string;
  // mensaje de error del campo; si viene, el control se marca en rojo
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * envoltorio de un campo de formulario: etiqueta arriba, control y mensaje de error debajo.
 *
 * @param props label, error (opcional), className y el control como children
 * @returns el campo completo
 */
export const Field = ({ label, error, children, className }: FieldProps) => (
  <label className={cx("block", className)}>
    <span className="mb-1.5 block text-xs font-medium tracking-wide text-stone-600">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
  </label>
);

/**
 * input de texto o numero con el estilo del tema.
 *
 * @param props invalid (marca el borde en rojo) y cualquier atributo de un input
 * @returns el input
 */
export const Input = ({ className, invalid, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) => (
  <input className={cx(CONTROL, invalid && "border-red-400", className)} aria-invalid={invalid || undefined} {...rest} />
);

/**
 * select con el estilo del tema.
 *
 * @param props invalid y cualquier atributo de un select; las opciones van como children
 * @returns el select
 */
export const Select = ({ className, invalid, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) => (
  <select className={cx(CONTROL, "pr-8", invalid && "border-red-400", className)} aria-invalid={invalid || undefined} {...rest}>
    {children}
  </select>
);
