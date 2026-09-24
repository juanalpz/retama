import { Agency } from './agency.entity';
export declare class Property {
    id: number;
    agency: Agency;
    idTipoPropiedad: number | null;
    titulo: string;
    descripcion: string | null;
    operacion: string;
    ambientes: number | null;
    dormitorios: number | null;
    banios: number | null;
    superficieCubiertaM2: number | null;
    superficieTotalM2: number | null;
    precio: number | null;
    moneda: string | null;
    direccionLinea1: string | null;
    barrioZona: string | null;
    estado: string;
    createdAt: Date;
    updatedAt: Date;
}
