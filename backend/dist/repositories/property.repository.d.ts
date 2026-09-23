import { Property } from "../entities/property.entity";
declare class PropertyRepository {
    private get repository();
    findById(id: number): Promise<Property | null>;
}
export declare const propertyRepository: PropertyRepository;
export {};
