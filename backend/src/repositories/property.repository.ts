import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Property } from "../entities/property.entity";

class PropertyRepository {
  private get repository(): Repository<Property> {
    return AppDataSource.getRepository(Property);
  }

  findById(id: number): Promise<Property | null> {
    return this.repository.findOneBy({ id });
  }

  /**
   * Verifica si la inmobiliaria tiene propiedades en estado 'Publicada' o 'Reservada'
   */
  async hasActivePropertiesByAgency(agencyId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: [
        { agency: { id: agencyId }, estado: 'PUBLICADA' },
        { agency: { id: agencyId }, estado: 'RESERVADA' },
        { agency: { id: agencyId }, estado: 'Publicada' },
        { agency: { id: agencyId }, estado: 'Reservada' }
      ]
    });
    return count > 0;
  }
}

export const propertyRepository = new PropertyRepository();