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
}

export const propertyRepository = new PropertyRepository();