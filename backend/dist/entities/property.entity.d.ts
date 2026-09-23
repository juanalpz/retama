import { Agency } from './agency.entity';
import { OperationType, PropertyStatus, PropertyType } from './enum';
export declare class Property {
    id: number;
    title: string;
    description: string;
    type: PropertyType;
    operation: OperationType;
    price: string;
    currency: "ARS" | "USD";
    address: string;
    area: string;
    coveredAreaM2: string | null;
    totalAreaM2: string;
    rooms: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    ageYears: number | null;
    tags: string[];
    status: PropertyStatus;
    agency: Agency;
    createdAt: Date;
    updatedAt: Date;
}
