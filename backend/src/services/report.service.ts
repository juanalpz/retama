/** 
 * @fileoverview Servicio para la lógica de negocio de los reportes analíticos del Vendedor.
 */

import { reportRepository } from "../repositories/report.repository";

export interface DashboardReport {
  propiedadesPorEstado: { estado: string, cantidad: number }[];
  evolucionMensual: { mes: string, publicaciones: number, cierres: number }[];
  tiempoPromedioMercadoDias: number | null;
}

class ReportService {
  /**
   * Recopila todas las métricas analíticas para el dashboard del vendedor.
   * Ejecuta en paralelo las consultas de estados, evolución mensual y tiempo promedio.
   * 
   * @async
   * @param {number} sellerId - ID del vendedor
   * @returns {Promise<DashboardReport>} Objeto con todas las métricas consolidadas
   */
  async getSellerDashboardReport(sellerId: number): Promise<DashboardReport> {
    const [propiedadesPorEstado, evolucionMensual, tiempoPromedio] = await Promise.all([
      reportRepository.getPropertiesByStatus(sellerId),
      reportRepository.getEvolutionByMonth(sellerId),
      reportRepository.getAverageTimeOnMarket(sellerId)
    ]);

    return {
      propiedadesPorEstado,
      evolucionMensual,
      tiempoPromedioMercadoDias: tiempoPromedio
    };
  }
}

export const reportService = new ReportService();
