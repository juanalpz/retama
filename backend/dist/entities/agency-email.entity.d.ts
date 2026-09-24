import { Agency } from "./agency.entity";
export declare class AgencyEmail {
    id: number;
    agency: Agency;
    correo: string;
    tipoCorreo: string | null;
}
