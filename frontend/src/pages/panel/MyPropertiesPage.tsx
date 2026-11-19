import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/panel/PageHeader";
import { PropertyRow } from "../../components/panel/PropertyRow";
import { Select } from "../../components/ui/Field";
import { Alert } from "../../components/ui/Misc";
import { ConfirmDialog } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useUnread } from "../../context/UnreadContext";
import { useApi } from "../../hooks/useApi";
import { cancelProperty, changePropertyStatus, listMyProperties } from "../../services/panel";
import type { ApiError, EstadoPropiedad, Property } from "../../types/api";
import { PROPERTY_STATUS_LABELS, type StatusAction } from "../../utils/status";

// accion que espera confirmacion: un cambio de estado o una baja
type Pending = { property: Property; action: StatusAction<EstadoPropiedad> | "baja" };

/**
 * pantalla "mis propiedades": listado de las propiedades del vendedor con su
 * estado y las acciones del ciclo de vida. el filtro y la pagina van en la url.
 *
 * @returns la pantalla
 */
export const MyPropertiesPage = () => {
  const [params, setParams] = useSearchParams();
  const estado = params.get("estado") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data, loading, error, reload } = useApi((signal) => listMyProperties({ estado, page }, signal), [estado, page]);
  const { refresh: refreshUnread } = useUnread();

  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  // error de la ultima accion; si el back rechaza, el estado en pantalla no cambia
  const [actionError, setActionError] = useState<string | null>(null);

  // ejecuta un cambio de estado o una baja y, si sale bien, vuelve a pedir el listado
  const run = async (property: Property, action: StatusAction<EstadoPropiedad> | "baja") => {
    setBusyId(property.id);
    setActionError(null);
    try {
      if (action === "baja") await cancelProperty(property.id);
      else await changePropertyStatus(property.id, action.to);
      setPending(null);
      reload();
      // un cambio de estado genera actividad: se actualiza el contador
      refreshUnread();
    } catch (err) {
      setActionError((err as ApiError).message);
    } finally {
      setBusyId(null);
    }
  };

  // las acciones que cierran la operacion piden confirmacion; el resto se ejecuta directo
  const onAction = (property: Property, action: StatusAction<EstadoPropiedad>) => {
    setActionError(null);
    if (action.confirm) setPending({ property, action });
    else run(property, action);
  };

  const setFilter = (value: string) => setParams(value ? { estado: value } : {});
  const setPage = (next: number) => setParams({ ...(estado ? { estado } : {}), ...(next > 1 ? { page: String(next) } : {}) });

  return (
    <>
      <PageHeader
        title="Mis propiedades"
        actions={
          <>
            <Select aria-label="Filtrar por estado" className="h-9 w-auto" value={estado} onChange={(event) => setFilter(event.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Link to="/panel/propiedades/nueva" className="inline-flex h-9 items-center rounded-lg bg-brand-700 px-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-800">
              Nueva propiedad
            </Link>
          </>
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
        <LoadingState message="Cargando tus propiedades..." />
      ) : data.data.length === 0 ? (
        <EmptyState
          title={estado ? "No tenés propiedades en ese estado" : "Todavía no cargaste propiedades"}
          description={estado ? undefined : "Creá tu primera propiedad. Queda en borrador hasta que la publiques."}
        />
      ) : (
        <>
          <ul className={loading ? "grid gap-3 opacity-60" : "grid gap-3"} aria-busy={loading}>
            {data.data.map((property) => (
              <PropertyRow key={property.id} property={property} busy={busyId === property.id} onAction={onAction} onCancel={(target) => setPending({ property: target, action: "baja" })} />
            ))}
          </ul>
          <div className="mt-6">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
          </div>
        </>
      )}

      {pending && (
        <ConfirmDialog
          title={pending.action === "baja" ? "¿Dar de baja la propiedad?" : `¿${pending.action.label}?`}
          description={
            pending.action === "baja"
              ? `"${pending.property.titulo}" va a pasar a Cancelada y no se va a poder volver a publicar.`
              : `"${pending.property.titulo}": ${pending.action.confirm}`
          }
          confirmLabel={pending.action === "baja" ? "Dar de baja" : pending.action.label}
          danger={pending.action === "baja"}
          loading={busyId === pending.property.id}
          error={actionError}
          onConfirm={() => run(pending.property, pending.action)}
          onCancel={() => {
            setPending(null);
            setActionError(null);
          }}
        />
      )}
    </>
  );
};
