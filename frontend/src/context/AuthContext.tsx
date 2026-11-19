/**
 * contexto de autenticacion: quien esta logueado y como entrar o salir.
 * la sesion se guarda en localStorage para que sobreviva a una recarga.
 */

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as authService from "../services/auth";
import { SESSION_EXPIRED_EVENT, clearSession, getStoredUser, getToken, saveSession } from "../services/session";
import type { User } from "../types/api";

export interface AuthContextValue {
  // vendedor logueado, o null si no hay sesion
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: authService.RegisterData) => Promise<void>;
  logout: () => void;
  // vuelve a pedir los datos del vendedor, por ejemplo despues de editar la inmobiliaria
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * proveedor de la sesion. envuelve a toda la app y va dentro del router,
 * porque al cerrar sesion navega al listado publico.
 *
 * @param props children, el arbol de componentes que puede leer la sesion
 * @returns el proveedor del contexto
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // se arranca con lo guardado para que una recarga no muestre al vendedor deslogueado
  const [user, setUser] = useState<User | null>(() => (getToken() ? getStoredUser() : null));
  const navigate = useNavigate();
  const location = useLocation();

  // al cargar la app se confirma con la api que el token guardado sigue siendo valido.
  // si no lo es, la capa http cierra la sesion y dispara el evento de abajo.
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    authService
      .getMe()
      .then((fresh) => {
        saveSession(token, fresh);
        setUser(fresh);
      })
      .catch(() => {
        // sin conexion se sigue con los datos guardados; un 401 ya cerro la sesion
      });
  }, []);

  // la capa http avisa por un evento cuando la api rechazo el token
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, usuario } = await authService.login(email, password);
    saveSession(token, usuario);
    setUser(usuario);
  }, []);

  const register = useCallback(async (data: authService.RegisterData) => {
    const { token, usuario } = await authService.register(data);
    saveSession(token, usuario);
    setUser(usuario);
  }, []);

  // salir tiene dos pasos. primero se navega al listado publico, marcando en el
  // estado de la navegacion que hay que cerrar la sesion. recien al llegar se
  // borra la sesion (efecto de abajo). si se borrara antes, la ruta protegida
  // veria que no hay usuario y mandaria al login en vez de al listado.
  const logout = useCallback(() => {
    navigate("/", { replace: true, state: { logout: true } });
  }, [navigate]);

  useEffect(() => {
    if ((location.state as { logout?: boolean } | null)?.logout) {
      clearSession();
      setUser(null);
      // se limpia la marca para que recargar la pagina no repita el cierre
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const fresh = await authService.getMe();
    saveSession(token, fresh);
    setUser(fresh);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, refreshUser }), [user, login, register, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
