/**
 * consultas de agregacion para el dashboard de reportes.
 * cada una filtra por el vendedor, asi solo ve los datos de su inmobiliaria.
 */

import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";
import { PropertyStatusHistory } from "../entities/property-status-history.entity";

class ReportRepository {
  /**
   * cuenta las propiedades del vendedor agrupadas por su estado actual.
   *
   * @param sellerId id del vendedor
   * @returns una lista de { estado, cantidad }; solo trae los estados que tienen al menos una propiedad
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
   * cuenta, por mes, las publicaciones nuevas y los cierres a partir del historial de estados.
   * una publicacion nueva es el paso de borrador a publicada (republicar no cuenta)
   * y un cierre es el paso a vendida o alquilada.
   *
   * @param sellerId id del vendedor
   * @returns una lista de { mes, publicaciones, cierres } ordenada por mes, con el mes en formato AAAA-MM
   */
  async getEvolutionByMonth(sellerId: number): Promise<{ mes: string, publicaciones: number, cierres: number }[]> {
    const qb = AppDataSource.getRepository(PropertyStatusHistory).createQueryBuilder('history')
      .select("TO_CHAR(history.fecha_cambio, 'YYYY-MM')", 'mes')
      // una publicacion nueva es el paso de borrador a publicada. volver a publicar
      // una propiedad pausada no cuenta como publicacion nueva.
      .addSelect("SUM(CASE WHEN history.estado_nuevo = 'PUBLICADA' AND history.estado_viejo = 'BORRADOR' THEN 1 ELSE 0 END)", 'publicaciones')
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
   * calcula el tiempo promedio en mercado con el historial de estados: los dias
   * entre la primera publicacion de cada propiedad y su venta o alquiler.
   *
   * @param sellerId id del vendedor
   * @returns el promedio en dias con dos decimales, o null si todavia no hubo cierres
   */
  async getAverageTimeOnMarket(sellerId: number): Promise<number | null> {
    // por cada propiedad se toma la primera vez que se publico y el momento del cierre.
    // si se pauso y se volvio a publicar se sigue contando desde la primera publicacion,
    // asi cada propiedad entra una sola vez en el promedio.
    const query = `
      SELECT AVG(EXTRACT(EPOCH FROM (cierre.fecha - publicacion.fecha)) / 86400) AS "diasPromedio"
      FROM propiedades p
      JOIN inmobiliarias a ON p.id_inmobiliaria = a.id_inmobiliaria
      JOIN (
        SELECT id_propiedad, MIN(fecha_cambio) AS fecha
        FROM propiedades_cambios_logs
        WHERE estado_nuevo = 'PUBLICADA'
        GROUP BY id_propiedad
      ) publicacion ON publicacion.id_propiedad = p.id_propiedad
      JOIN (
        SELECT id_propiedad, MIN(fecha_cambio) AS fecha
        FROM propiedades_cambios_logs
        WHERE estado_nuevo IN ('VENDIDA', 'ALQUILADA')
        GROUP BY id_propiedad
      ) cierre ON cierre.id_propiedad = p.id_propiedad
      WHERE a.id_usuario = $1
        AND cierre.fecha > publicacion.fecha
    `;
    const result = await AppDataSource.query(query, [sellerId]);
    if (result.length > 0 && result[0].diasPromedio !== null) {
      return Number(Number(result[0].diasPromedio).toFixed(2));
    }
    return null;
  }
}

export const reportRepository = new ReportRepository();
