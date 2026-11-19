import { useState } from "react";
import { Link } from "react-router-dom";
import { getMyProperty } from "../../services/panel";
import type { EstadoPropiedad, Property, StatusHistory } from "../../types/api";
import { formatDateTime } from "../../utils/dates";
import { OPERACION_LABELS, coverUrl, formatPrice } from "../../utils/format";
import { FINAL_PROPERTY_STATES, PROPERTY_STATUS_LABELS, canCancelProperty, propertyActions, type StatusAction } from "../../utils/status";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/Misc";

interface PropertyRowProps {
  property: Property;
  // id de la propiedad que tiene una accion en curso, para deshabilitar sus botones
  busy: boolean;
  onAction: (property: Property, action: StatusAction<EstadoPropiedad>) => void;
  onCancel: (property: Property) => void;
}

/**
 * fila de una propiedad en "mis propiedades": datos principales, estado y
 * solo las acciones que su estado admite. permite ver el historial de estados.
 *
 * @param props property, busy, onAction (cambio de estado) y onCancel (dar de baja)
 * @returns la fila
 */
export const PropertyRow = ({ property, busy, onAction, onCancel }: PropertyRowProps) => {
  // historial de estados: null hasta que se pide verlo
  const [history, setHistory] = useState<StatusHistory[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const foto = coverUrl(property);

  // el historial se pide la primera vez que se abre y cada vez que se vuelve a abrir
  const toggleHistory = async () => {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    setHistoryOpen(true);
    try {
      const detalle = await getMyProperty(property.id);
      setHistory(detalle.historialEstados ?? []);
    } catch {
      setHistory([]);
    }
  };

  return (
    <li className="rounded-2xl border border-stone-200 bg-white shadow-card p-4">
      <div className="flex gap-4">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-stone-100">
          {foto ? <img src={foto} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-stone-400">Sin foto</div>}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="min-w-0 text-sm font-medium text-ink">{property.titulo}</h2>
            <StatusBadge status={property.estado} label={PROPERTY_STATUS_LABELS[property.estado]} />
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {OPERACION_LABELS[property.operacion]} · {formatPrice(property.precio, property.moneda, property.operacion)}
          </p>
          {property.barrioZona && <p className="text-xs text-stone-500">{property.barrioZona}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        {/* una propiedad vendida, alquilada o cancelada no ofrece editar */}
        {!FINAL_PROPERTY_STATES.includes(property.estado) && (
          <Link
            to={`/panel/propiedades/${property.id}/editar`}
            className="inline-flex h-9 items-center rounded-lg border border-stone-300 px-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-brand-600 hover:text-brand-800"
          >
            Editar
          </Link>
        )}
        {propertyActions(property.estado, property.operacion).map((action) => (
          <Button key={action.to} variant="secondary" size="sm" disabled={busy} onClick={() => onAction(property, action)}>
            {action.label}
          </Button>
        ))}
        {canCancelProperty(property.estado) && (
          <Button variant="danger" size="sm" disabled={busy} onClick={() => onCancel(property)}>
            Dar de baja
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={toggleHistory} aria-expanded={historyOpen}>
          {historyOpen ? "Ocultar historial" : "Historial"}
        </Button>
        {property.estado !== "BORRADOR" && (
          <Link to={`/propiedades/${property.id}`} className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-brand-800 transition-colors duration-200 hover:bg-brand-50">
            Ver publicación
          </Link>
        )}
      </div>

      {historyOpen && (
        <div className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-600">
          {history === null ? (
            "Cargando historial..."
          ) : history.length === 0 ? (
            "Todavía no tuvo cambios de estado."
          ) : (
            <ol className="grid gap-1">
              {history.map((item) => (
                <li key={item.id}>
                  {formatDateTime(item.fechaCambio)} · {PROPERTY_STATUS_LABELS[item.estadoViejo]} → {PROPERTY_STATUS_LABELS[item.estadoNuevo]}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </li>
  );
};
