import { Property } from "./property.entity";
export declare class Comment {
    id: number;
    property: Property;
    tipoComentario: string | null;
    nombre: string;
    comentario: string;
    respuestaVendedor: string | null;
    fechaCreacion: Date;
}
