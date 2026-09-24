/** 
 * @fileoverview Controlador para la generación de reportes y estadísticas del Dashboard del Vendedor.
 */

import type { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

class SellerReportController {
  /**
   * Obtiene las estadísticas analíticas del vendedor.
   * Devuelve métricas sobre propiedades agrupadas por estado, evolución mensual y tiempo promedio en mercado.
   * 
   * @async
   * @param {Request} request - Petición HTTP (debe contener req.user con el id del vendedor)
   * @param {Response} response - Respuesta HTTP
   * @returns {Promise<void>} Responde con un JSON conteniendo el DashboardReport
   * 
   * @example
   * GET /api/vendedor/reportes
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
