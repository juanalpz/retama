import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/panel/PageHeader";
import { PhotoManager } from "../../components/panel/PhotoManager";
import { PropertyForm } from "../../components/panel/PropertyForm";
import { Alert } from "../../components/ui/Misc";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { useTags } from "../../hooks/useTags";
import { createProperty, getMyProperty, updateProperty } from "../../services/panel";
import type { ApiError } from "../../types/api";
import { EMPTY_PROPERTY_FORM, toFormValues, toPayload, validateProperty, type PropertyFormValues } from "../../utils/propertyForm";
import { FINAL_PROPERTY_STATES, PROPERTY_STATUS_LABELS } from "../../utils/status";

const backLink = (
  <Link to="/panel/propiedades" className="text-sm text-stone-600 transition-colors duration-200 hover:text-brand-800">
    ← Volver a mis propiedades
  </Link>
);

/**
 * pantalla de alta de una propiedad. al crearla queda en borrador y se pasa a
 * la pantalla de edicion para cargarle las fotos.
 *
 * @returns la pantalla
 */
export const NewPropertyPage = () => {
  const navigate = useNavigate();
  const tags = useTags();
  const [values, setValues] = useState<PropertyFormValues>(EMPTY_PROPERTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const found = validateProperty(values);
    setErrors(found);
    setFormError(Object.keys(found).length > 0 ? "Revisá los campos marcados." : null);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const created = await createProperty(toPayload(values));
      navigate(`/panel/propiedades/${created.id}/editar`, { replace: true, state: { created: true } });
    } catch (err) {
      const apiError = err as ApiError;
      setErrors(apiError.fields);
      setFormError(apiError.message);
      setSending(false);
    }
  };

  return (
    <>
      {backLink}
      <div className="mt-3">
        <PageHeader title="Nueva propiedad" description="Se guarda como borrador. Después le agregás las fotos y la publicás." />
      </div>
      <PropertyForm values={values} errors={errors} formError={formError} tags={tags} sending={sending} submitLabel="Guardar borrador" onChange={setValues} onSubmit={submit} />
    </>
  );
};

/**
 * pantalla de edicion de una propiedad propia: el formulario precargado con
 * sus datos y la galeria de fotos.
 *
 * @returns la pantalla
 */
export const EditPropertyPage = () => {
  const { id = "" } = useParams();
  const location = useLocation();
  const tags = useTags();
  const { data: property, error, reload } = useApi((signal) => getMyProperty(id, signal), [id]);

  const [values, setValues] = useState<PropertyFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  // cuando llega la propiedad se precarga el formulario con sus datos actuales
  useEffect(() => {
    if (property) setValues(toFormValues(property));
  }, [property]);

  if (error) {
    return error.status === 404 ? <EmptyState title="No encontramos esa propiedad" action={backLink} /> : <ErrorState message={error.message} onRetry={reload} />;
  }
  if (!property || !values) return <LoadingState message="Cargando la propiedad..." />;

  // una propiedad cerrada no se puede editar
  if (FINAL_PROPERTY_STATES.includes(property.estado)) {
    return <EmptyState title={`Esta propiedad está ${PROPERTY_STATUS_LABELS[property.estado].toLowerCase()} y ya no se puede editar`} action={backLink} />;
  }

  const submit = async () => {
    const found = validateProperty(values);
    setErrors(found);
    setSaved(false);
    setFormError(Object.keys(found).length > 0 ? "Revisá los campos marcados." : null);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      await updateProperty(property.id, toPayload(values));
      setSaved(true);
    } catch (err) {
      // por ejemplo, 409 si la propiedad tiene visitas confirmadas pendientes
      const apiError = err as ApiError;
      setErrors(apiError.fields);
      setFormError(apiError.message);
    } finally {
      setSending(false);
    }
  };

  const recienCreada = Boolean((location.state as { created?: boolean } | null)?.created);

  return (
    <>
      {backLink}
      <div className="mt-3">
        <PageHeader title="Editar propiedad" description={`Estado actual: ${PROPERTY_STATUS_LABELS[property.estado]}`} />
      </div>

      <div className="grid gap-6">
        {recienCreada && !saved && <Alert kind="success">La propiedad se guardó como borrador. Agregale al menos una foto para poder publicarla.</Alert>}
        {saved && <Alert kind="success">Los cambios se guardaron.</Alert>}

        <PropertyForm
          values={values}
          errors={errors}
          formError={formError}
          tags={tags}
          sending={sending}
          submitLabel="Guardar cambios"
          onChange={(next) => {
            setValues(next);
            setSaved(false);
          }}
          onSubmit={submit}
        />

        <PhotoManager propertyId={property.id} />
      </div>
    </>
  );
};
