import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/panel/PageHeader";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import { useUnread } from "../../context/UnreadContext";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import { listActivity, markActivityRead, markAllActivityRead } from "../../services/panel";
import type { Activity } from "../../types/api";
import { timeAgo } from "../../utils/dates";
import { cx } from "../../utils/format";

/**
 * pantalla del feed de actividad: novedades de la inmobiliaria, la mas
 * reciente primero. al abrir una novedad se marca como leida y se va a la
 * pantalla donde esta lo que la origino.
 *
 * @returns la pantalla
 */
export const ActivityPage = () => {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unread, refresh } = useUnread();

  const { data, loading, error, reload, setData } = useApi((signal) => listActivity(page, signal), [page]);
  const [markingAll, setMarkingAll] = useState(false);

  /**
   * pantalla a la que lleva una novedad segun lo que la origino.
   *
   * @param activity novedad del feed
   * @returns la ruta de destino
   */
  const destination = (activity: Activity): string => {
    switch (activity.referenciaTipo) {
      case "pregunta":
        return "/panel/consultas?ver=todas";
      case "visita":
        return "/panel/visitas?estado=TODAS";
      case "resenia":
        return user?.inmobiliaria ? `/inmobiliarias/${user.inmobiliaria.id}` : "/panel/actividad";
      default:
        return "/panel/propiedades";
    }
  };

  // marca la novedad como leida (si no lo estaba), actualiza el contador y navega
  const open = async (activity: Activity) => {
    if (!activity.leido) {
      setData((current) => (current ? { ...current, data: current.data.map((item) => (item.id === activity.id ? { ...item, leido: true } : item)) } : current));
      try {
        await markActivityRead(activity.id);
      } finally {
        refresh();
      }
    }
    navigate(destination(activity));
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await markAllActivityRead();
      setData((current) => (current ? { ...current, data: current.data.map((item) => ({ ...item, leido: true })) } : current));
    } finally {
      refresh();
      setMarkingAll(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Actividad"
        description={unread > 0 ? `${unread} ${unread === 1 ? "novedad sin leer" : "novedades sin leer"}` : "Estás al día"}
        actions={
          unread > 0 ? (
            <Button variant="secondary" size="sm" loading={markingAll} onClick={markAll}>
              Marcar todas como leídas
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data ? (
        <LoadingState message="Cargando actividad..." />
      ) : data.data.length === 0 ? (
        <EmptyState title="Todavía no hay actividad" description="Acá vas a ver las consultas, visitas y reseñas nuevas." />
      ) : (
        <>
          <ul className={cx("divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-card", loading && "opacity-60")} aria-busy={loading}>
            {data.data.map((activity) => (
              <li key={activity.id}>
                <button type="button" onClick={() => open(activity)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-stone-50">
                  {/* punto lleno: sin leer. punto vacio: leida */}
                  <span aria-hidden="true" className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", activity.leido ? "border border-stone-300" : "bg-brand-600")} />
                  <span className="min-w-0 flex-1">
                    <span className={cx("block text-sm", activity.leido ? "text-stone-600" : "font-medium text-ink")}>{activity.mensaje}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {timeAgo(activity.fechaCreacion)}
                      {activity.leido ? " · leída" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => setParams(next > 1 ? { page: String(next) } : {})} />
          </div>
        </>
      )}
    </>
  );
};
