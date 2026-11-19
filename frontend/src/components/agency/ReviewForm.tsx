import { useState, type FormEvent } from "react";
import { createReview } from "../../services/agencies";
import type { ApiError, Review } from "../../types/api";
import { cx } from "../../utils/format";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { Alert, Textarea } from "../ui/Misc";
import { useSubmitLock } from "../../hooks/useSubmitLock";

interface ReviewFormProps {
  agencyId: number;
  // se llama con la reseña creada para sumarla al listado sin recargar
  onCreated: (review: Review) => void;
}

/**
 * formulario para dejar una reseña sobre una inmobiliaria: nombre, contenido
 * y calificacion de 1 a 5 estrellas.
 *
 * @param props agencyId y onCreated
 * @returns el formulario
 */
export const ReviewForm = ({ agencyId, onCreated }: ReviewFormProps) => {
  const [nombre, setNombre] = useState("");
  const [texto, setTexto] = useState("");
  const [calificacion, setCalificacion] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, runLocked] = useSubmitLock();

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    // sin contenido o sin calificacion el pedido no sale
    const errores: Record<string, string> = {};
    if (!nombre.trim()) errores.nombreSolicitante = "Decinos tu nombre";
    if (!texto.trim()) errores.resenia = "Contanos cómo fue tu experiencia";
    if (calificacion < 1) errores.calificacion = "Elegí una calificación";
    setFields(errores);
    setFormError(null);
    if (Object.keys(errores).length > 0) return;

    await runLocked(async () => {
      try {
        const review = await createReview(agencyId, { nombreSolicitante: nombre.trim(), resenia: texto.trim(), calificacion });
        onCreated(review);
        setTexto("");
        setCalificacion(0);
      } catch (err) {
        const apiError = err as ApiError;
        setFields(apiError.fields);
        setFormError(apiError.message);
      }
    });
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 rounded-2xl border border-stone-200 bg-white shadow-card p-4">
      <p className="text-sm font-medium text-ink">Dejá tu reseña</p>

      <div>
        <span className="mb-1.5 block text-xs font-medium text-stone-600">Calificación</span>
        <div role="radiogroup" aria-label="Calificación" className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={calificacion === n}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              onClick={() => setCalificacion(n)}
              className={cx("h-9 w-9 rounded-lg text-xl transition-colors duration-200 hover:bg-brand-50", n <= calificacion ? "text-brand-500" : "text-stone-300")}
            >
              ★
            </button>
          ))}
        </div>
        {fields.calificacion && <span className="mt-1 block text-xs text-red-700">{fields.calificacion}</span>}
      </div>

      <Field label="Tu nombre" error={fields.nombreSolicitante}>
        <Input value={nombre} onChange={(event) => setNombre(event.target.value)} invalid={Boolean(fields.nombreSolicitante)} maxLength={100} autoComplete="name" />
      </Field>
      <Field label="Tu opinión" error={fields.resenia}>
        <Textarea rows={3} value={texto} onChange={(event) => setTexto(event.target.value)} invalid={Boolean(fields.resenia)} maxLength={2000} />
      </Field>

      {formError && <Alert kind="error">{formError}</Alert>}

      <div>
        <Button type="submit" loading={sending}>
          {sending ? "Enviando..." : "Publicar reseña"}
        </Button>
      </div>
    </form>
  );
};
