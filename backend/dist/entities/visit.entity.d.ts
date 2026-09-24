import { Property } from "./property.entity";
export declare class Visit {
    id: number;
    property: Property;
    nombreVisitante: string;
    apellidoVisitante: string;
    telefonoVisitante: string | null;
    fechaPropuesta: Date | null;
    mensajeAsociado: string | null;
    estado: string;
}
