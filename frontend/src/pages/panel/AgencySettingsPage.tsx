import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/panel/PageHeader";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Alert, Textarea } from "../../components/ui/Misc";
import { ConfirmDialog } from "../../components/ui/Modal";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import { addPhone, deleteMyAgency, deletePhone, getMyAgency, updateMyAgency } from "../../services/panel";
import type { ApiError } from "../../types/api";

/**
 * pantalla de datos de la inmobiliaria: edicion del perfil, telefonos de
 * contacto y eliminacion de la inmobiliaria.
 *
 * @returns la pantalla
 */
export const AgencySettingsPage = () => {
  const { logout, refreshUser } = useAuth();
  const { data: agency, error, reload } = useApi((signal) => getMyAgency(signal), []);

  const [form, setForm] = useState({ nombreFantasia: "", descripcion: "", direccionLinea1: "", logoUrl: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  const [telefono, setTelefono] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // telefono que espera confirmacion para ser quitado
  const [phoneToRemove, setPhoneToRemove] = useState<{ id: number; telefono: string } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // cuando llegan los datos se precarga el formulario
  useEffect(() => {
    if (agency) {
      setForm({
        nombreFantasia: agency.nombreFantasia,
        descripcion: agency.descripcion ?? "",
        direccionLinea1: agency.direccionLinea1 ?? "",
        logoUrl: agency.logoUrl ?? "",
      });
    }
  }, [agency]);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!agency) return <LoadingState message="Cargando tu inmobiliaria..." />;

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setSaved(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const errores: Record<string, string> = {};
    if (form.nombreFantasia.trim().length < 2) errores.nombreFantasia = "Ingresá el nombre de la inmobiliaria";
    setFields(errores);
    setFormError(null);
    setSaved(false);
    if (Object.keys(errores).length > 0) return;

    setSending(true);
    try {
      await updateMyAgency({
        nombreFantasia: form.nombreFantasia.trim(),
        descripcion: form.descripcion.trim(),
        direccionLinea1: form.direccionLinea1.trim(),
        logoUrl: form.logoUrl.trim(),
      });
      setSaved(true);
      // el encabezado del panel muestra el nombre: se actualiza la sesion
      await refreshUser();
    } catch (err) {
      // 409 si el nombre de fantasia ya lo usa otra inmobiliaria
      const apiError = err as ApiError;
      setFields(apiError.fields);
      setFormError(Object.keys(apiError.fields).length > 0 ? null : apiError.message);
    } finally {
      setSending(false);
    }
  };

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault();
    setPhoneError(null);
    try {
      await addPhone(telefono.trim());
      setTelefono("");
      reload();
    } catch (err) {
      setPhoneError((err as ApiError).fields.telefono ?? (err as ApiError).message);
    }
  };

  const removePhone = async (id: number) => {
    setPhoneError(null);
    setPhoneToRemove(null);
    try {
      await deletePhone(id);
      reload();
    } catch (err) {
      setPhoneError((err as ApiError).message);
    }
  };

  // si el back rechaza la eliminacion (409) se muestra el motivo en el dialogo
  const remove = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAgency();
      // sin inmobiliaria la cuenta no puede operar: se cierra la sesion y se vuelve al inicio
      logout();
    } catch (err) {
      setDeleteError((err as ApiError).message);
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Mi inmobiliaria"
        description="Estos datos se muestran en tu sitio público."
        actions={
          <Link to={`/inmobiliarias/${agency.id}`} className="text-sm font-medium text-brand-700 underline underline-offset-4">
            Ver sitio público
          </Link>
        }
      />

      <div className="grid gap-6">
        <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-stone-200 bg-white shadow-card p-4 sm:p-5">
          <Field label="Nombre de fantasía" error={fields.nombreFantasia}>
            <Input value={form.nombreFantasia} onChange={set("nombreFantasia")} invalid={Boolean(fields.nombreFantasia)} maxLength={150} />
          </Field>
          <Field label="Descripción" error={fields.descripcion}>
            <Textarea rows={3} value={form.descripcion} onChange={set("descripcion")} />
          </Field>
          <Field label="Dirección de la oficina (opcional)" error={fields.direccionLinea1}>
            <Input value={form.direccionLinea1} onChange={set("direccionLinea1")} maxLength={200} />
          </Field>
          <Field label="URL del logo (opcional)" error={fields.logoUrl}>
            <Input type="url" value={form.logoUrl} onChange={set("logoUrl")} invalid={Boolean(fields.logoUrl)} placeholder="https://..." />
          </Field>

          {formError && <Alert kind="error">{formError}</Alert>}
          {saved && <Alert kind="success">Los cambios se guardaron.</Alert>}

          <div>
            <Button type="submit" loading={sending}>
              {sending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>

        <section aria-labelledby="telefonos-titulo" className="rounded-2xl border border-stone-200 bg-white shadow-card p-4 sm:p-5">
          <h2 id="telefonos-titulo" className="text-base font-semibold text-ink">
            Teléfonos de contacto
          </h2>
          <ul className="mt-3 grid gap-2">
            {agency.telefonos?.length === 0 && <li className="text-sm text-stone-500">Todavía no cargaste teléfonos.</li>}
            {agency.telefonos?.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{item.telefono}</span>
                <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" onClick={() => setPhoneToRemove({ id: item.id, telefono: item.telefono })}>
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
          <form onSubmit={submitPhone} noValidate className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input type="tel" value={telefono} onChange={(event) => setTelefono(event.target.value)} placeholder="Nuevo teléfono" aria-label="Nuevo teléfono" />
            <Button type="submit" variant="secondary" className="shrink-0">
              Agregar
            </Button>
          </form>
          {phoneError && (
            <div className="mt-3">
              <Alert kind="error">{phoneError}</Alert>
            </div>
          )}
        </section>

        <section aria-labelledby="eliminar-titulo" className="rounded-xl border border-red-200 bg-white p-4 sm:p-5">
          <h2 id="eliminar-titulo" className="text-base font-semibold text-ink">
            Eliminar la inmobiliaria
          </h2>
          <p className="mt-1 text-sm text-stone-600">Se borran sus propiedades, consultas, visitas y reseñas. No se puede eliminar mientras tenga propiedades publicadas o reservadas.</p>
          <div className="mt-4">
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Eliminar inmobiliaria
            </Button>
          </div>
        </section>
      </div>

      {phoneToRemove && (
        <ConfirmDialog
          title="¿Quitar el teléfono?"
          description={`El ${phoneToRemove.telefono} deja de mostrarse en tu sitio público.`}
          confirmLabel="Quitar"
          danger
          onConfirm={() => removePhone(phoneToRemove.id)}
          onCancel={() => setPhoneToRemove(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar la inmobiliaria?"
          description={`Se va a borrar "${agency.nombreFantasia}" con todo su contenido. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          loading={deleting}
          error={deleteError}
          onConfirm={remove}
          onCancel={() => {
            setConfirmDelete(false);
            setDeleteError(null);
          }}
        />
      )}
    </>
  );
};
