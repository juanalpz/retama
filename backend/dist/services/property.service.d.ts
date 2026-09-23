import { Property } from "../entities/property.entity";
declare class PropertyService {
    getById(id: number): Promise<Property | null>;
}
export declare const propertyService: PropertyService;
export {};
