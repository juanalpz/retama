import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Agency } from "./agency.entity";

@Entity("inmobiliarias_correos")
export class AgencyEmail {
  @PrimaryGeneratedColumn({ name: 'id_correo_inmobiliaria' })
  id!: number;

  @ManyToOne(() => Agency, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_inmobiliaria" })
  agency!: Agency;

  @Column({ type: "varchar", length: 150 })
  correo!: string;

  @Column({ name: 'tipo_correo', type: "varchar", length: 30, nullable: true })
  tipoCorreo!: string | null;
}
