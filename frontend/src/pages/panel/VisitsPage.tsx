import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/panel/PageHeader";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
import { Alert, StatusBadge } from "../../components/ui/Misc";
import { ConfirmDialog } from "../../components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { listMyVisits, updateVisitStatus } from "../../services/panel";
import type { ApiError, EstadoVisita, Visit } from "../../types/api";
import { formatDateTime } from "../../utils/dates";
import { groupByProperty } from "../../utils/group";
import { VISIT_STATUS_LABELS, visitActions, type StatusAction } from "../../utils/status";

type Pending = { visit: Visit; action: StatusAction<EstadoVisita> };

/**
 * pantalla de solicitudes de visita: listado agrupado por propiedad con los
 * datos de contacto de quien la pidio y las acciones que admite cada estado.
 *
 * @returns la pantalla
 */
export const VisitsPage = () => {
  const [params, setParams] = useSearchParams();
  // por defecto se muestran las pendientes, que son las que piden una accion
  const estado = params.get("estado") ?? "PENDIENTE";

  const { data, loading, error, reload, setData } = useApi((signal) => listMyVisits(estado === "TODAS" ? "" : estado, signal), [estado]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // cambia el estado de una visita y la actualiza en pantalla sin recargar el listado
  const run = async (visit: Visit, action: StatusAction<EstadoVisita>) => {
    setBusyId(visit.id);
    setActionError(null);
    try {
      const updated = await updateVisitStatus(visit.id, action.to);
      setData((current) => (current ? { ...current, data: current.data.map((item) => (item.id === visit.id ? { ...item, estado: updated.estado } : item)) } : current));
      setPending(null);
    } catch (err) {
      setActionError((err as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  const onAction = (visit: Visit, action: StatusAction<EstadoVisita>) => {
    setActionError(null);
    if (action.confirm) setPending({ visit, action });
    else run(visit, action);
  };

  return (
    <>
      <PageHeader
        title="Solicitudes de visita"
        actions={
          <Select aria-label="Filtrar por estado" className="h-9 w-auto" value={estado} onChange={(event) => setParams({ estado: event.target.value })}>
            <option value="PENDIENTE">Pendientes</option>
            <option value="CONFIRMADA">Confirmadas</option>
            <option value="TODAS">Todas</option>
          </Select>
        }
      />

      {actionError && !pending && (
        <div className="mb-4">
          <Alert kind="error">{actionError}</Alert>
        </div>
      )}

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data ? (
        <LoadingState message="Cargando visitas..." />
      ) : data.data.length === 0 ? (
        <EmptyState title={estado === "TODAS" ? "Todavía no recibiste solicitudes de visita" : "No hay visitas en ese estado"} />
      ) : (
        <div className={loading ? "grid gap-5 opacity-60" : "grid gap-5"} aria-busy={loading}>
          {groupByProperty(data.data).map((group) => (
            <section key={group.id} className="rounded-2xl border border-stone-200 bg-white shadow-card">
              <h2 className="border-b border-stone-200 px-4 py-3 text-sm font-medium text-ink">{group.titulo}</h2>
              <ul className="divide-y divide-stone-100">
                {group.items.map((visit) => (
                  <li key={visit.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 text-sm">
                        <p className="font-medium text-ink">{[visit.nombreVisitante, visit.apellidoVisitante].filter(Boolean).join(" ")}</p>
                        <a href={`tel:${visit.telefonoVisitante}`} className="text-brand-700 underline underline-offset-4">
                          {visit.telefonoVisitante}
                        </a>
                        <p className="mt-1 text-stone-600">{formatDateTime(visit.fechaPropuesta)}</p>
                        {visit.mensajeAsociado && <p className="mt-1 text-stone-500">"{visit.mensajeAsociado}"</p>}
                      </div>
                      <StatusBadge status={visit.estado} label={VISIT_STATUS_LABELS[visit.estado]} />
                    </div>

                    {/* una visita rechazada, cancelada o realizada no ofrece mas acciones */}
                    {visitActions(visit.estado).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {visitActions(visit.estado).map((action) => (
                          <Button key={action.to} variant={action.confirm ? "danger" : "secondary"} size="sm" disabled={busyId === visit.id} onClick={() => onAction(visit, action)}>
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title={`¿${pending.action.label} la visita?`}
          description={pending.action.confirm ?? ""}
          confirmLabel={pending.action.label}
          danger
          loading={busyId === pending.visit.id}
          error={actionError}
          onConfirm={() => run(pending.visit, pending.action)}
          onCancel={() => {
            setPending(null);
            setActionError(null);
          }}
        />
      )}
    </>
  );
};
