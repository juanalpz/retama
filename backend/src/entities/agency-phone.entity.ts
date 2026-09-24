import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Agency } from "./agency.entity";

@Entity("inmobiliarias_telefonos")
export class AgencyPhone {
  @PrimaryGeneratedColumn({ name: 'id_telefono_inmobiliaria' })
  id!: number;

  @ManyToOne(() => Agency, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_inmobiliaria" })
  agency!: Agency;

  @Column({ type: "varchar", length: 50 })
  telefono!: string;

  @Column({ name: 'tipo_telefono', type: "varchar", length: 30, nullable: true })
  tipoTelefono!: string | null;
}
