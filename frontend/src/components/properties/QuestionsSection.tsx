import { useState, type FormEvent } from "react";
import { useApi } from "../../hooks/useApi";
import { createQuestion, listQuestions } from "../../services/agencies";
import type { ApiError, Question } from "../../types/api";
import { timeAgo } from "../../utils/dates";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { Alert, Textarea } from "../ui/Misc";
import { ErrorState, LoadingState } from "../ui/States";
import { useSubmitLock } from "../../hooks/useSubmitLock";

/**
 * una consulta con la respuesta del vendedor debajo, si la tiene.
 *
 * @param props question, la consulta a mostrar
 * @returns el item de la lista
 */
const QuestionItem = ({ question }: { question: Question }) => (
  <li className="py-4">
    <p className="text-sm text-ink">{question.pregunta}</p>
    <p className="mt-1 text-xs text-stone-500">
      {question.nombreSolicitante} · {timeAgo(question.fechaCreacion)}
    </p>
    {question.respuestaVendedor && (
      <div className="mt-3 border-l-2 border-brand-300 pl-3">
        <p className="text-xs font-medium text-brand-800">Respuesta de la inmobiliaria</p>
        <p className="mt-0.5 text-sm text-stone-700">{question.respuestaVendedor}</p>
      </div>
    )}
  </li>
);

/**
 * seccion de consultas del detalle de una propiedad: el listado con sus
 * respuestas y el formulario para dejar una consulta nueva.
 *
 * @param props propertyId, id de la propiedad
 * @returns la seccion
 */
export const QuestionsSection = ({ propertyId }: { propertyId: number }) => {
  const { data, loading, error, reload, setData } = useApi((signal) => listQuestions(propertyId, signal), [propertyId]);

  const [nombre, setNombre] = useState("");
  const [pregunta, setPregunta] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, runLocked] = useSubmitLock();

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    // se valida antes de enviar: sin nombre o sin contenido el pedido no sale
    const errores: Record<string, string> = {};
    if (!nombre.trim()) errores.nombreSolicitante = "Decinos tu nombre";
    if (!pregunta.trim()) errores.pregunta = "Escribí tu consulta";
    setFields(errores);
    setFormError(null);
    if (Object.keys(errores).length > 0) return;

    await runLocked(async () => {
      try {
        const nueva = await createQuestion(propertyId, { nombreSolicitante: nombre.trim(), pregunta: pregunta.trim() });
        // la consulta nueva aparece primera sin volver a pedir el listado
        setData((current) => (current ? { ...current, data: [nueva, ...current.data], total: current.total + 1 } : current));
        setPregunta("");
      } catch (err) {
        const apiError = err as ApiError;
        setFields(apiError.fields);
        setFormError(apiError.message);
      }
    });
  };

  return (
    <section aria-labelledby="consultas-titulo">
      <h2 id="consultas-titulo" className="font-serif text-2xl text-ink">
        Consultas
      </h2>

      <form onSubmit={submit} noValidate className="mt-4 grid gap-3 rounded-2xl border border-stone-200 bg-white shadow-card p-4">
        <Field label="Tu nombre" error={fields.nombreSolicitante}>
          <Input value={nombre} onChange={(event) => setNombre(event.target.value)} invalid={Boolean(fields.nombreSolicitante)} maxLength={100} autoComplete="name" />
        </Field>
        <Field label="Tu consulta" error={fields.pregunta}>
          <Textarea rows={3} value={pregunta} onChange={(event) => setPregunta(event.target.value)} invalid={Boolean(fields.pregunta)} maxLength={2000} placeholder="¿Admite mascotas? ¿Tiene expensas?" />
        </Field>
        {formError && <Alert kind="error">{formError}</Alert>}
        <div>
          <Button type="submit" loading={sending}>
            {sending ? "Enviando..." : "Enviar consulta"}
          </Button>
        </div>
      </form>

      <div className="mt-4">
        {error ? (
          <ErrorState message={error.message} onRetry={reload} />
        ) : loading && !data ? (
          <LoadingState message="Cargando consultas..." />
        ) : data && data.data.length === 0 ? (
          <p className="py-6 text-sm text-stone-500">Todavía no hay consultas. Sé el primero en preguntar.</p>
        ) : (
          <ul className="divide-y divide-stone-200">{data?.data.map((question) => <QuestionItem key={question.id} question={question} />)}</ul>
        )}
      </div>
    </section>
  );
};
