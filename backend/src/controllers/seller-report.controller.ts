/** 
 * @fileoverview Controlador de Reportes y Analíticas del Dashboard del Vendedor.
 * Genera estadísticas y métricas clave sobre el rendimiento de la inmobiliaria,
 * incluyendo el estado del pipeline de propiedades, evolución de consultas
 * y tiempos promedio en el mercado.
 */

import type { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

// =================================================================================
// ENDPOINTS: REPORTES Y ANALÍTICAS (Dashboard Vendedor)
// =================================================================================

class SellerReportController {
  /**
   * Obtiene el reporte general (dashboard principal) con estadísticas del vendedor.
   * 
   * Devuelve un resumen consolidado de métricas clave, incluyendo:
   * - Desglose de propiedades por estado (Borrador, Publicada, Reservada, etc.)
   * - Tráfico de los últimos 30 días (consultas y visitas)
   * - Tiempo promedio en mercado (días desde publicación hasta venta)
   * 
   * @async
   * @param {Request} request - Petición HTTP (extendida con req.user por el middleware de auth).
   * @param {Response} response - Respuesta HTTP de Express.
   * @returns {Promise<void>} Respuesta HTTP 200 con el objeto JSON del DashboardReport o HTTP 401/500.
   * 
   * @example
   * GET /api/vendedor/reportes
   * Headers: { "Authorization": "Bearer <TOKEN>" }
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
