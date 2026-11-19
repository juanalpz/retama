/**
 * dashboard de reportes del vendedor.
 * cada indicador tiene su propia funcion para que el front pueda pedirlos por
 * separado; getSellerDashboardReport los junta en una sola respuesta.
 */

import { reportRepository } from "../repositories/report.repository";
import { PROPERTY_STATES } from "../schemas/property.schema";

export interface StatusCount {
  estado: string;
  cantidad: number;
}

export interface MonthlyEvolution {
  mes: string;
  publicaciones: number;
  cierres: number;
}

export interface DashboardReport {
  propiedadesPorEstado: StatusCount[];
  evolucionMensual: MonthlyEvolution[];
  tiempoPromedioMercadoDias: number | null;
}

class ReportService {
  /**
   * cantidad de propiedades del vendedor por estado actual.
   * la consulta solo trae los estados que tienen propiedades, asi que el resto se
   * completa con cero para que el front pueda mostrar siempre todas las tarjetas.
   *
   * @param sellerId id del vendedor autenticado
   * @returns una lista de { estado, cantidad } con los siete estados, en el orden del ciclo de vida
   */
  async getStatusSummary(sellerId: number): Promise<StatusCount[]> {
    const porEstado = await reportRepository.getPropertiesByStatus(sellerId);

    return PROPERTY_STATES.map((estado) => ({
      estado,
      cantidad: porEstado.find((fila) => fila.estado === estado)?.cantidad ?? 0,
    }));
  }

  /**
   * publicaciones nuevas y ventas/alquileres concretados por mes.
   *
   * @param sellerId id del vendedor autenticado
   * @returns una lista de { mes, publicaciones, cierres } ordenada por mes; solo trae los meses con movimiento
   */
  getMonthlyEvolution(sellerId: number): Promise<MonthlyEvolution[]> {
    return reportRepository.getEvolutionByMonth(sellerId);
  }

  /**
   * tiempo promedio en mercado: dias entre la primera publicacion de cada
   * propiedad y su venta o alquiler.
   *
   * @param sellerId id del vendedor autenticado
   * @returns el promedio en dias, o null si todavia no hubo cierres
   */
  getAverageTimeOnMarket(sellerId: number): Promise<number | null> {
    return reportRepository.getAverageTimeOnMarket(sellerId);
  }

  /**
   * arma los tres indicadores juntos, con las tres consultas en paralelo.
   *
   * @param sellerId id del vendedor autenticado
   * @returns { propiedadesPorEstado, evolucionMensual, tiempoPromedioMercadoDias }; el tiempo promedio es null si todavia no hubo cierres
   */
  async getSellerDashboardReport(sellerId: number): Promise<DashboardReport> {
    const [propiedadesPorEstado, evolucionMensual, tiempoPromedioMercadoDias] = await Promise.all([
      this.getStatusSummary(sellerId),
      this.getMonthlyEvolution(sellerId),
      this.getAverageTimeOnMarket(sellerId)
    ]);

    return { propiedadesPorEstado, evolucionMensual, tiempoPromedioMercadoDias };
  }
}

export const reportService = new ReportService();
