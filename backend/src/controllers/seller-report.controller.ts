import type { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

class SellerReportController {
  /**
   * @route GET /api/vendedor/reportes
   * @description Obtiene las estadísticas analíticas del vendedor (propiedades por estado, evolución mensual, tiempo en mercado).
   */
  async getDashboardReport(request: Request, response: Response): Promise<void> {
    const req = request as AuthenticatedRequest;
    const sellerId = req.user?.id;
    if (!sellerId) {
      response.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const report = await reportService.getSellerDashboardReport(sellerId);
      response.json(report);
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Error generating report" });
    }
  }
}

export const sellerReportController = new SellerReportController();
