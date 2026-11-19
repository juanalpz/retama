import { useState, type InputHTMLAttributes } from "react";
import { Input } from "./Field";

/**
 * input de contraseña con un boton para mostrarla u ocultarla.
 *
 * @param props invalid y cualquier atributo de un input (menos type)
 * @returns el input con su boton
 */
export const PasswordInput = ({ invalid, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { invalid?: boolean }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} invalid={invalid} className="pr-20" {...rest} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-brand-700 transition-colors duration-200 hover:text-brand-500"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
};
