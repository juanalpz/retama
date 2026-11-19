/**
 * controlador del dashboard de reportes del vendedor.
 * hay una ruta por indicador y una que devuelve los tres juntos.
 * todas pasan antes por authenticateToken, asi que req.user siempre existe.
 * si algo falla, el error lo resuelve el manejador central.
 */

import type { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

class SellerReportController {
  /**
   * GET /api/vendedor/reportes
   * devuelve los tres indicadores de la inmobiliaria del vendedor en una sola respuesta.
   *
   * @param request req.user (vendedor del token)
   * @param response respuesta http
   * @returns 200 con { propiedadesPorEstado, evolucionMensual, tiempoPromedioMercadoDias }
   */
  async getDashboardReport(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const report = await reportService.getSellerDashboardReport(sellerId);
    response.json(report);
  }

  /**
   * GET /api/vendedor/reportes/por-estado
   * cantidad de propiedades por estado actual.
   *
   * @param request req.user (vendedor del token)
   * @param response respuesta http
   * @returns 200 con { propiedadesPorEstado }, una lista de { estado, cantidad } con los siete estados
   */
  async getStatusSummary(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const propiedadesPorEstado = await reportService.getStatusSummary(sellerId);
    response.json({ propiedadesPorEstado });
  }

  /**
   * GET /api/vendedor/reportes/mensual
   * publicaciones nuevas y ventas/alquileres concretados por mes.
   *
   * @param request req.user (vendedor del token)
   * @param response respuesta http
   * @returns 200 con { evolucionMensual }, una lista de { mes, publicaciones, cierres }
   */
  async getMonthlyEvolution(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const evolucionMensual = await reportService.getMonthlyEvolution(sellerId);
    response.json({ evolucionMensual });
  }

  /**
   * GET /api/vendedor/reportes/tiempo-en-mercado
   * tiempo promedio en mercado, en dias.
   *
   * @param request req.user (vendedor del token)
   * @param response respuesta http
   * @returns 200 con { tiempoPromedioMercadoDias }; es null si todavia no hubo cierres
   */
  async getAverageTimeOnMarket(request: Request, response: Response): Promise<void> {
    const sellerId = Number((request as AuthenticatedRequest).user?.id);
    const tiempoPromedioMercadoDias = await reportService.getAverageTimeOnMarket(sellerId);
    response.json({ tiempoPromedioMercadoDias });
  }
}

export const sellerReportController = new SellerReportController();
