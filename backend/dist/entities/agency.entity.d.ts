import { Seller } from "./seller.entity";
export declare class Agency {
    id: number;
    nombreFantasia: string;
    descripcion: string | null;
    logoUrl: string | null;
    direccionLinea1: string | null;
    direccionLinea2: string | null;
    seller: Seller;
    createdAt: Date;
}
