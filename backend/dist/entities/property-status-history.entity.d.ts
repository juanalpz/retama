import { Property } from "./property.entity";
export declare class PropertyStatusHistory {
    id: number;
    property: Property;
    estadoViejo: string;
    estadoNuevo: string;
    fechaCambio: Date;
}
