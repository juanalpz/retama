import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";

/**
 * da acceso a la sesion desde cualquier componente.
 *
 * @returns { user, login, register, logout, refreshUser }
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth tiene que usarse dentro de AuthProvider");
  }
  return context;
};
