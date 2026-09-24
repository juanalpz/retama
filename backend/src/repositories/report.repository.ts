import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";

class ReportRepository {
  /**
   * Obtiene la cantidad de propiedades agrupadas por estado actual.
   */
  async getPropertiesByStatus(sellerId: number): Promise<{ estado: string, cantidad: number }[]> {
    const qb = AppDataSource.getRepository(Property).createQueryBuilder('property')
      .select('property.estado', 'estado')
      .addSelect('COUNT(property.id_propiedad)', 'cantidad')
      .innerJoin('property.agency', 'agency')
      .innerJoin('agency.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId })
      .groupBy('property.estado');

    const raw = await qb.getRawMany();
    return raw.map(r => ({ estado: r.estado, cantidad: Number(r.cantidad) }));
  }

  /**
   * Obtiene la evolución mensual de propiedades publicadas y vendidas/alquiladas.
   */
  async getEvolutionByMonth(sellerId: number): Promise<{ mes: string, publicaciones: number, cierres: number }[]> {
    const qb = AppDataSource.getRepository(PropertyStatusHistory).createQueryBuilder('history')
      .select("TO_CHAR(history.fecha_cambio, 'YYYY-MM')", 'mes')
      .addSelect("SUM(CASE WHEN history.estado_nuevo = 'PUBLICADA' THEN 1 ELSE 0 END)", 'publicaciones')
      .addSelect("SUM(CASE WHEN history.estado_nuevo IN ('VENDIDA', 'ALQUILADA') THEN 1 ELSE 0 END)", 'cierres')
      .innerJoin('history.property', 'property')
      .innerJoin('property.agency', 'agency')
      .innerJoin('agency.seller', 'seller')
      .where('seller.id = :sellerId', { sellerId })
      .groupBy("TO_CHAR(history.fecha_cambio, 'YYYY-MM')")
      .orderBy("mes", 'ASC');

    const raw = await qb.getRawMany();
    return raw.map(r => ({
      mes: r.mes,
      publicaciones: Number(r.publicaciones),
      cierres: Number(r.cierres)
    }));
  }

  /**
   * Obtiene el tiempo promedio en el mercado (días entre Publicada y Vendida/Alquilada).
   */
  async getAverageTimeOnMarket(sellerId: number): Promise<number | null> {
    const query = `
      SELECT AVG(EXTRACT(EPOCH FROM (h_end.fecha_cambio - h_start.fecha_cambio))/86400) as "diasPromedio"
      FROM propiedades p
      JOIN inmobiliarias a ON p.id_inmobiliaria = a.id_inmobiliaria
      JOIN propiedades_cambios_logs h_start ON h_start.id_propiedad = p.id_propiedad AND h_start.estado_nuevo = 'PUBLICADA'
      JOIN propiedades_cambios_logs h_end ON h_end.id_propiedad = p.id_propiedad AND h_end.estado_nuevo IN ('VENDIDA', 'ALQUILADA')
      WHERE a.id_usuario = $1
        AND h_end.fecha_cambio > h_start.fecha_cambio
    `;
    const result = await AppDataSource.query(query, [sellerId]);
    if (result.length > 0 && result[0].diasPromedio !== null) {
      return Number(Number(result[0].diasPromedio).toFixed(2));
    }
    return null;
  }
}

export const reportRepository = new ReportRepository();
