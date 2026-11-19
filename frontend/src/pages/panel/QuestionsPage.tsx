import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/panel/PageHeader";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
import { StatusBadge, Textarea } from "../../components/ui/Misc";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { listMyQuestions, replyQuestion } from "../../services/panel";
import type { ApiError, Question } from "../../types/api";
import { timeAgo } from "../../utils/dates";
import { groupByProperty } from "../../utils/group";

interface QuestionItemProps {
  question: Question;
  // se llama con la consulta ya respondida para actualizarla en pantalla
  onReplied: (question: Question) => void;
}

/**
 * una consulta recibida. si esta pendiente muestra el campo para responderla;
 * si ya tiene respuesta la muestra y no permite responder de nuevo.
 *
 * @param props question y onReplied
 * @returns el item de la lista
 */
const QuestionItem = ({ question, onReplied }: QuestionItemProps) => {
  const [respuesta, setRespuesta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!respuesta.trim()) {
      setError("Escribí la respuesta");
      return;
    }
    setSending(true);
    setError(null);
    try {
      onReplied(await replyQuestion(question.id, respuesta.trim()));
    } catch (err) {
      setError((err as ApiError).fields.respuestaVendedor ?? (err as ApiError).message);
      setSending(false);
    }
  };

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-ink">{question.pregunta}</p>
          <p className="mt-1 text-xs text-stone-500">
            {question.nombreSolicitante} · {timeAgo(question.fechaCreacion)}
          </p>
        </div>
        <StatusBadge status={question.respuestaVendedor ? "CONFIRMADA" : "PENDIENTE"} label={question.respuestaVendedor ? "Respondida" : "Pendiente"} />
      </div>

      {question.respuestaVendedor ? (
        <div className="mt-3 border-l-2 border-brand-300 pl-3">
          <p className="text-xs font-medium text-brand-800">Tu respuesta</p>
          <p className="mt-0.5 text-sm text-stone-700">{question.respuestaVendedor}</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-3 grid gap-2">
          <Textarea rows={2} value={respuesta} onChange={(event) => setRespuesta(event.target.value)} invalid={Boolean(error)} maxLength={2000} placeholder="Escribí tu respuesta" aria-label="Respuesta" />
          {error && <span className="text-xs text-red-700">{error}</span>}
          <div>
            <Button type="submit" size="sm" loading={sending}>
              {sending ? "Enviando..." : "Responder"}
            </Button>
          </div>
        </form>
      )}
    </li>
  );
};

/**
 * pantalla de consultas recibidas, agrupadas por propiedad. permite filtrar
 * las pendientes y responder cada una en el lugar.
 *
 * @returns la pantalla
 */
export const QuestionsPage = () => {
  const [params, setParams] = useSearchParams();
  const soloPendientes = params.get("ver") !== "todas";

  const { data, loading, error, reload, setData } = useApi((signal) => listMyQuestions(soloPendientes, signal), [soloPendientes]);

  // la consulta respondida se marca en el momento, sin volver a pedir el listado
  const markReplied = (replied: Question) => {
    setData((current) =>
      current ? { ...current, data: current.data.map((item) => (item.id === replied.id ? { ...item, respuestaVendedor: replied.respuestaVendedor } : item)) } : current,
    );
  };

  return (
    <>
      <PageHeader
        title="Consultas"
        actions={
          <Select aria-label="Filtrar consultas" className="h-9 w-auto" value={soloPendientes ? "pendientes" : "todas"} onChange={(event) => setParams(event.target.value === "todas" ? { ver: "todas" } : {})}>
            <option value="pendientes">Pendientes</option>
            <option value="todas">Todas</option>
          </Select>
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data ? (
        <LoadingState message="Cargando consultas..." />
      ) : data.data.length === 0 ? (
        <EmptyState title={soloPendientes ? "No tenés consultas pendientes" : "Todavía no recibiste consultas"} />
      ) : (
        <div className={loading ? "grid gap-5 opacity-60" : "grid gap-5"} aria-busy={loading}>
          {groupByProperty(data.data).map((group) => (
            <section key={group.id} className="rounded-2xl border border-stone-200 bg-white shadow-card">
              <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-medium text-ink">{group.titulo}</h2>
              <ul className="divide-y divide-stone-100">
                {group.items.map((question) => (
                  <QuestionItem key={question.id} question={question} onReplied={markReplied} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
};
