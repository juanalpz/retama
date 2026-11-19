import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { Alert } from "../components/ui/Misc";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../hooks/useAuth";
import type { ApiError } from "../types/api";
import { useSubmitLock } from "../hooks/useSubmitLock";

// pantalla a la que se entra despues del login si no se venia de otra
export const PANEL_HOME = "/panel/propiedades";

/**
 * marco visual de las pantallas de ingreso y registro: una foto con una frase
 * a la izquierda (solo en escritorio) y el formulario a la derecha.
 *
 * @param props title y subtitle del panel de la foto, y el formulario como children
 * @returns el marco con el formulario adentro
 */
export const AuthShell = ({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) => (
  <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
    <div className="grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-card lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
      <div className="relative isolate hidden overflow-hidden bg-brand-900 p-10 lg:flex lg:flex-col lg:justify-end">
        <img src="/fotos/foto-20.jpg" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-900 via-brand-900/70 to-brand-900/20" />
        <p className="font-serif text-3xl leading-tight text-white">{title}</p>
        <p className="mt-3 text-brand-100">{subtitle}</p>
      </div>
      <div className="p-6 sm:p-10">{children}</div>
    </div>
  </div>
);

/**
 * pagina de ingreso del vendedor. si llego aca desde una pantalla protegida,
 * despues del login vuelve a esa pantalla.
 *
 * @returns la pagina
 */
export const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ruta que se queria visitar antes de que pidieran iniciar sesion
  const from = (location.state as { from?: string } | null)?.from ?? PANEL_HOME;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, runLocked] = useSubmitLock();

  // con la sesion ya iniciada no tiene sentido mostrar el formulario
  if (user) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const errores: Record<string, string> = {};
    if (!email.trim()) errores.email = "Ingresá tu email";
    if (!password) errores.password = "Ingresá tu contraseña";
    setFields(errores);
    setFormError(null);
    if (Object.keys(errores).length > 0) return;

    await runLocked(async () => {
      try {
        await login(email.trim(), password);
        navigate(from, { replace: true });
      } catch (err) {
        // el email ingresado no se borra: solo se muestra el error
        const apiError = err as ApiError;
        setFields(apiError.fields);
        setFormError(apiError.status === 401 ? "El email o la contraseña no son correctos." : apiError.message);
      }
    });
  };

  return (
    <AuthShell title="Tu inmobiliaria, ordenada" subtitle="Publicá propiedades, respondé consultas y coordiná visitas desde un solo panel.">
      <h1 className="text-3xl tracking-tight text-ink">Ingresar</h1>
      <p className="mt-1 text-sm text-stone-600">Accedé al panel de tu inmobiliaria.</p>

      <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
        <Field label="Email" error={fields.email}>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} invalid={Boolean(fields.email)} autoComplete="email" />
        </Field>
        <Field label="Contraseña" error={fields.password}>
          <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} invalid={Boolean(fields.password)} autoComplete="current-password" />
        </Field>

        {formError && <Alert kind="error">{formError}</Alert>}

        <Button type="submit" loading={sending} className="w-full">
          {sending ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        ¿No tenés cuenta?{" "}
        <Link to="/registro" className="font-medium text-brand-700 underline underline-offset-4">
          Registrate
        </Link>
      </p>
    </AuthShell>
  );
};
