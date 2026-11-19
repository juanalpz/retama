import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { Alert } from "../components/ui/Misc";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../hooks/useAuth";
import type { ApiError } from "../types/api";
import { AuthShell, PANEL_HOME } from "./LoginPage";
import { useSubmitLock } from "../hooks/useSubmitLock";

const EMPTY = { nombre: "", apellido: "", email: "", password: "", telefono: "", nombreFantasia: "" };

/**
 * valida el formulario de registro antes de enviarlo.
 *
 * @param form valores actuales del formulario
 * @returns un objeto con el mensaje de error de cada campo invalido (vacio si esta todo bien)
 */
const validate = (form: typeof EMPTY): Record<string, string> => {
  const errores: Record<string, string> = {};
  if (form.nombre.trim().length < 2) errores.nombre = "Ingresá tu nombre";
  if (form.apellido.trim().length < 2) errores.apellido = "Ingresá tu apellido";
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errores.email = "Ingresá un email válido";
  if (form.password.length < 6) errores.password = "La contraseña debe tener al menos 6 caracteres";
  if (form.telefono.trim() && form.telefono.trim().length < 6) errores.telefono = "El teléfono es muy corto";
  if (form.nombreFantasia.trim().length < 3) errores.nombreFantasia = "Ingresá el nombre de tu inmobiliaria";
  return errores;
};

/**
 * pagina de registro: crea la cuenta del vendedor y su inmobiliaria en el mismo paso.
 *
 * @returns la pagina
 */
export const RegisterPage = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, runLocked] = useSubmitLock();

  if (user) return <Navigate to={PANEL_HOME} replace />;

  // cambia un campo del formulario
  const set = (key: keyof typeof EMPTY) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const errores = validate(form);
    setFields(errores);
    setFormError(null);
    if (Object.keys(errores).length > 0) return;

    await runLocked(async () => {
      try {
        await register({ ...form, nombre: form.nombre.trim(), apellido: form.apellido.trim(), email: form.email.trim(), nombreFantasia: form.nombreFantasia.trim() });
        navigate(PANEL_HOME, { replace: true });
      } catch (err) {
        // un email o nombre de fantasia repetido (409) llega con el campo que fallo,
        // asi el mensaje aparece junto al input que corresponde
        const apiError = err as ApiError;
        setFields(apiError.fields);
        setFormError(Object.keys(apiError.fields).length > 0 ? null : apiError.message);
      }
    });
  };

  return (
    <AuthShell title="Sumá tu inmobiliaria a Retama" subtitle="Creás la cuenta y el perfil público en un solo paso, y empezás a publicar.">
      <h1 className="text-3xl tracking-tight text-ink">Crear cuenta</h1>
      <p className="mt-1 text-sm text-stone-600">Registrate y creá el perfil de tu inmobiliaria en un solo paso.</p>

      <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={fields.nombre}>
            <Input value={form.nombre} onChange={set("nombre")} invalid={Boolean(fields.nombre)} autoComplete="given-name" />
          </Field>
          <Field label="Apellido" error={fields.apellido}>
            <Input value={form.apellido} onChange={set("apellido")} invalid={Boolean(fields.apellido)} autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Email" error={fields.email}>
          <Input type="email" value={form.email} onChange={set("email")} invalid={Boolean(fields.email)} autoComplete="email" />
        </Field>
        <Field label="Contraseña" error={fields.password}>
          <PasswordInput value={form.password} onChange={set("password")} invalid={Boolean(fields.password)} autoComplete="new-password" />
        </Field>
        <Field label="Teléfono de contacto (opcional)" error={fields.telefono}>
          <Input type="tel" value={form.telefono} onChange={set("telefono")} invalid={Boolean(fields.telefono)} autoComplete="tel" />
        </Field>
        <Field label="Nombre de tu inmobiliaria" error={fields.nombreFantasia}>
          <Input value={form.nombreFantasia} onChange={set("nombreFantasia")} invalid={Boolean(fields.nombreFantasia)} placeholder="Ej. Inmobiliaria del Sol" />
        </Field>

        {formError && <Alert kind="error">{formError}</Alert>}

        <Button type="submit" loading={sending} className="w-full">
          {sending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-medium text-brand-700 underline underline-offset-4">
          Ingresá
        </Link>
      </p>
    </AuthShell>
  );
};
