import { Property } from "./property.entity";
import { PropertyStatus } from "./enum";
export declare class PropertyStatusHistory {
    id: number;
    fromStatus: PropertyStatus;
    toStatus: PropertyStatus;
    property: Property;
    createdAt: Date;
}
