import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../../utils/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  // muestra el boton deshabilitado mientras se espera una respuesta
  loading?: boolean;
  children: ReactNode;
}

// clases de cada variante. los estados usan solo un cambio de color, sin sombras ni escalas.
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  secondary: "border border-stone-300 bg-white text-ink hover:border-brand-700 hover:text-brand-700",
  ghost: "text-brand-700 hover:bg-brand-100",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  // para usar sobre fondos verde bosque
  light: "bg-white text-brand-800 hover:bg-brand-100",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
};

/**
 * boton de la app, con las variantes de estilo del tema.
 *
 * @param props variant (primary por defecto), size, loading y cualquier atributo de un button
 * @returns el boton
 */
export const Button = ({ variant = "primary", size = "md", loading = false, className, disabled, children, type = "button", ...rest }: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cx(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors duration-200",
      "disabled:cursor-not-allowed disabled:opacity-60",
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);
