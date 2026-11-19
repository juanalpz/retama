import type { FormEvent } from "react";
import type { Tag } from "../../types/api";
import { cx } from "../../utils/format";
import type { PropertyFormValues } from "../../utils/propertyForm";
import { Button } from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { Alert, Textarea } from "../ui/Misc";

interface PropertyFormProps {
  values: PropertyFormValues;
  // mensajes de error por campo, del cliente o de la api
  errors: Record<string, string>;
  formError: string | null;
  tags: Tag[];
  sending: boolean;
  submitLabel: string;
  onChange: (values: PropertyFormValues) => void;
  onSubmit: () => void;
}

/**
 * formulario de alta y edicion de una propiedad, con todos los campos del
 * enunciado. si el tipo es terreno oculta superficie cubierta, ambientes,
 * dormitorios y baños. no guarda nada por su cuenta: avisa los cambios y el
 * envio a la pagina que lo usa.
 *
 * @param props values, errors, formError, tags, sending, submitLabel, onChange y onSubmit
 * @returns el formulario
 */
export const PropertyForm = ({ values, errors, formError, tags, sending, submitLabel, onChange, onSubmit }: PropertyFormProps) => {
  const esTerreno = values.tipoPropiedad === "TERRENO";

  // arma el handler de cambio de un campo de texto
  const set = (key: Exclude<keyof PropertyFormValues, "tags">) => (event: { target: { value: string } }) => onChange({ ...values, [key]: event.target.value });

  // agrega o quita un amenity de la seleccion
  const toggleTag = (id: number) => onChange({ ...values, tags: values.tags.includes(id) ? values.tags.filter((tag) => tag !== id) : [...values.tags, id] });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  // props comunes de un input numerico
  const numeric = (key: Exclude<keyof PropertyFormValues, "tags">) => ({
    inputMode: "numeric" as const,
    value: values[key],
    onChange: set(key),
    invalid: Boolean(errors[key]),
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-stone-200 bg-white shadow-card p-4 sm:p-5">
      <Field label="Título" error={errors.titulo}>
        <Input value={values.titulo} onChange={set("titulo")} invalid={Boolean(errors.titulo)} maxLength={200} placeholder="Depto 2 ambientes con vista al mar" />
      </Field>
      <Field label="Descripción" error={errors.descripcion}>
        <Textarea rows={4} value={values.descripcion} onChange={set("descripcion")} invalid={Boolean(errors.descripcion)} />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Tipo" error={errors.tipoPropiedad}>
          <Select value={values.tipoPropiedad} onChange={set("tipoPropiedad")}>
            <option value="CASA">Casa</option>
            <option value="DEPARTAMENTO">Departamento</option>
            <option value="TERRENO">Terreno</option>
            <option value="COMERCIAL">Local</option>
          </Select>
        </Field>
        <Field label="Operación" error={errors.operacion}>
          <Select value={values.operacion} onChange={set("operacion")}>
            <option value="VENTA">Venta</option>
            <option value="ALQUILER">Alquiler</option>
          </Select>
        </Field>
        <Field label="Precio" error={errors.precio}>
          <Input {...numeric("precio")} />
        </Field>
        <Field label="Moneda" error={errors.moneda}>
          <Select value={values.moneda} onChange={set("moneda")}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dirección (calle y altura)" error={errors.direccionLinea1}>
          <Input value={values.direccionLinea1} onChange={set("direccionLinea1")} invalid={Boolean(errors.direccionLinea1)} maxLength={100} />
        </Field>
        <Field label="Zona o barrio" error={errors.barrioZona}>
          <Input value={values.barrioZona} onChange={set("barrioZona")} invalid={Boolean(errors.barrioZona)} maxLength={100} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label={esTerreno ? "Superficie del terreno (m²)" : "Superficie total (m²)"} error={errors.superficieTotalM2}>
          <Input {...numeric("superficieTotalM2")} />
        </Field>
        {/* estos campos no aplican a un terreno */}
        {!esTerreno && (
          <>
            <Field label="Superficie cubierta (m²)" error={errors.superficieCubiertaM2}>
              <Input {...numeric("superficieCubiertaM2")} />
            </Field>
            <Field label="Ambientes (opcional)" error={errors.ambientes}>
              <Input {...numeric("ambientes")} />
            </Field>
            <Field label="Dormitorios (opcional)" error={errors.dormitorios}>
              <Input {...numeric("dormitorios")} />
            </Field>
            <Field label="Baños (opcional)" error={errors.banios}>
              <Input {...numeric("banios")} />
            </Field>
          </>
        )}
        <Field label="Antigüedad en años (opcional)" error={errors.antiguedad}>
          <Input {...numeric("antiguedad")} />
        </Field>
      </div>

      {tags.length > 0 && (
        <div>
          <span className="mb-1.5 block text-xs font-medium text-stone-600">Amenities</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const activo = values.tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => toggleTag(tag.id)}
                  className={cx(
                    "h-8 rounded-full border px-3 text-xs transition-colors duration-200",
                    activo ? "border-brand-700 bg-brand-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-brand-600 hover:text-brand-800",
                  )}
                >
                  {tag.tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {formError && <Alert kind="error">{formError}</Alert>}

      <div>
        <Button type="submit" loading={sending}>
          {sending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};
