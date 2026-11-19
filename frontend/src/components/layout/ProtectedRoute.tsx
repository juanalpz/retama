import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";

/**
 * protege las pantallas del panel: sin sesion redirige al login y guarda la
 * ruta pedida, para volver a ella despues de ingresar.
 *
 * @param props children, la pantalla protegida
 * @returns la pantalla, o la redireccion al login
 */
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
};
