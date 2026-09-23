import { Seller } from "./seller.entity";
export declare class Agency {
    id: number;
    name: string;
    description: string;
    logoUrl: string | null;
    contactPhone: string;
    contactEmail: string;
    officeAddress: string | null;
    seller: Seller;
    createdAt: Date;
}
