/** 
 * @fileoverview Repositorio de consultas analíticas para el Dashboard del Vendedor.
 */

import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";

class ReportRepository {
  /**
   * Cuenta la cantidad de propiedades que tiene el vendedor agrupadas por estado (Borrador, Publicada, etc).
   * 
   * @async
   * @param {number} sellerId - ID del vendedor
   * @returns {Promise<{ estado: string, cantidad: number }[]>} Arreglo con estados y su respectivo conteo
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
   * Obtiene la evolución mensual histórica sumando las propiedades publicadas vs las cerradas (vendidas/alquiladas).
   * Agrupa los resultados por mes usando la fecha de los logs de cambio de estado.
   * 
   * @async
   * @param {number} sellerId - ID del vendedor
   * @returns {Promise<{ mes: string, publicaciones: number, cierres: number }[]>} Arreglo ordenado por mes
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
   * Calcula el tiempo promedio que las propiedades del vendedor permanecen en el mercado.
   * Se define como la diferencia en días entre el pase a estado 'PUBLICADA' y 'VENDIDA' o 'ALQUILADA'.
   * 
   * @async
   * @param {number} sellerId - ID del vendedor
   * @returns {Promise<number | null>} Promedio de días en el mercado (con 2 decimales) o null si no hay datos
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
