import type { ReactNode } from "react";
import { PageHeader } from "../../components/panel/PageHeader";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/States";
import { useApi } from "../../hooks/useApi";
import { getAverageTimeOnMarket, getMonthlyEvolution, getStatusSummary, type MonthlyEvolution, type StatusCount } from "../../services/panel";
import type { ApiError } from "../../types/api";
import { PROPERTY_STATUS_LABELS } from "../../utils/status";

interface ReportCardProps {
  title: string;
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  children: ReactNode;
}

/**
 * tarjeta de un indicador. cada una maneja su propia carga y su propio error,
 * asi si un indicador falla los otros se muestran igual.
 *
 * @param props title, loading, error, onRetry y el contenido como children
 * @returns la tarjeta
 */
const ReportCard = ({ title, loading, error, onRetry, children }: ReportCardProps) => (
  <section className="rounded-2xl border border-stone-200 bg-white shadow-card p-4 sm:p-5">
    <h2 className="font-serif text-xl text-ink">{title}</h2>
    <div className="mt-4">
      {error ? (
        <div role="alert" className="text-sm text-red-700">
          <p>{error.message}</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-stone-500">
          <Spinner /> Cargando...
        </div>
      ) : (
        children
      )}
    </div>
  </section>
);

/**
 * nombre corto de un mes a partir del formato de la api.
 *
 * @param mes mes como "2026-11"
 * @returns el mes como "nov 26"
 */
const monthLabel = (mes: string): string => {
  const [year, month] = mes.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
};

/**
 * grafico de barras hecho con css: por cada mes, una barra de publicaciones y otra de cierres.
 *
 * @param props data, la evolucion mensual
 * @returns el grafico con su leyenda
 */
const MonthlyChart = ({ data }: { data: MonthlyEvolution[] }) => {
  // la barra mas alta ocupa todo el alto; el resto es proporcional
  const max = Math.max(1, ...data.flatMap((item) => [item.publicaciones, item.cierres]));

  return (
    <div>
      <div className="flex h-40 items-end gap-4 overflow-x-auto border-b border-stone-200 pb-px">
        {data.map((item) => (
          <div key={item.mes} className="flex h-full min-w-12 flex-1 items-end justify-center gap-1">
            <div className="flex h-full w-5 flex-col items-center justify-end">
              <span className="text-xs text-stone-600">{item.publicaciones}</span>
              <div className="w-full rounded-t bg-brand-300" style={{ height: `${(item.publicaciones / max) * 85}%` }} />
            </div>
            <div className="flex h-full w-5 flex-col items-center justify-end">
              <span className="text-xs text-stone-600">{item.cierres}</span>
              <div className="w-full rounded-t bg-brand-700" style={{ height: `${(item.cierres / max) * 85}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-4">
        {data.map((item) => (
          <span key={item.mes} className="min-w-12 flex-1 text-center text-xs text-stone-500">
            {monthLabel(item.mes)}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-600">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-brand-300" /> Publicaciones nuevas
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-brand-700" /> Ventas y alquileres
        </span>
      </div>
    </div>
  );
};

/**
 * pantalla de reportes: propiedades por estado, publicaciones y cierres por
 * mes, y tiempo promedio en mercado. los tres indicadores se piden en paralelo.
 *
 * @returns la pantalla
 */
export const ReportsPage = () => {
  const status = useApi((signal) => getStatusSummary(signal), []);
  const monthly = useApi((signal) => getMonthlyEvolution(signal), []);
  const time = useApi((signal) => getAverageTimeOnMarket(signal), []);

  // el borrador no es un estado de mercado: se deja fuera de las tarjetas
  const visibles: StatusCount[] = (status.data ?? []).filter((item) => item.estado !== "BORRADOR");

  return (
    <>
      <PageHeader title="Reportes" description="Indicadores de tu inmobiliaria." />

      <div className="grid gap-5">
        <ReportCard title="Propiedades por estado" loading={status.loading} error={status.error} onRetry={status.reload}>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {visibles.map((item, index) => (
              // la primera tarjeta (publicadas) va destacada en verde bosque
              <div key={item.estado} className={index === 0 ? "rounded-2xl bg-brand-700 px-4 py-4 text-white" : "rounded-2xl bg-stone-200 px-4 py-4 text-ink"}>
                <dt className={index === 0 ? "text-xs uppercase tracking-wider text-brand-200" : "text-xs uppercase tracking-wider text-stone-600"}>{PROPERTY_STATUS_LABELS[item.estado]}</dt>
                <dd className="mt-1 font-serif text-4xl">{item.cantidad}</dd>
              </div>
            ))}
          </dl>
        </ReportCard>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <ReportCard title="Publicaciones y ventas/alquileres por mes" loading={monthly.loading} error={monthly.error} onRetry={monthly.reload}>
            {monthly.data && monthly.data.length > 0 ? <MonthlyChart data={monthly.data} /> : <p className="py-4 text-sm text-stone-500">Todavía no hay movimientos para mostrar.</p>}
          </ReportCard>

          <ReportCard title="Tiempo promedio en mercado" loading={time.loading} error={time.error} onRetry={time.reload}>
            {/* sin ventas ni alquileres no hay promedio: se muestra un texto, nunca "NaN dias" */}
            {time.data === null || time.data === undefined ? (
              <p className="py-4 text-sm text-stone-500">Todavía no vendiste ni alquilaste ninguna propiedad.</p>
            ) : (
              <>
                <p className="font-serif text-5xl text-ink">
                  {Math.round(time.data)} <span className="text-base font-normal text-stone-500">{Math.round(time.data) === 1 ? "día" : "días"}</span>
                </p>
                <p className="mt-2 text-xs text-stone-500">Desde que se publica una propiedad hasta que se vende o alquila.</p>
              </>
            )}
          </ReportCard>
        </div>
      </div>
    </>
  );
};
