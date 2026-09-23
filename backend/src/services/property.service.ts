import { propertyRepository } from "../repositories/property.repository";
import { Property } from "../entities/property.entity";

class PropertyService {
  getById(id: number): Promise<Property | null> {
    return propertyRepository.findById(id);
  }
}

export const propertyService = new PropertyService();