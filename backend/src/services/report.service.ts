import { reportRepository } from "../repositories/report.repository";

export interface DashboardReport {
  propiedadesPorEstado: { estado: string, cantidad: number }[];
  evolucionMensual: { mes: string, publicaciones: number, cierres: number }[];
  tiempoPromedioMercadoDias: number | null;
}

class ReportService {
  /**
   * Recopila todas las métricas analíticas para el vendedor.
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
