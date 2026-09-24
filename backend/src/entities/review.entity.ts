import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Agency } from "./agency.entity";

@Entity("resenias_inmobiliaria")
export class Review {
  @PrimaryGeneratedColumn({ name: 'id_resenia' })
  id!: number;

  @ManyToOne(() => Agency, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_inmobiliaria" })
  agency!: Agency;

  @Column({ name: 'nombre_solicitante', type: "varchar", length: 100 })
  nombreSolicitante!: string;

  @Column({ name: 'resenia', type: "text" })
  resenia!: string;

  @Column({ type: "int" })
  calificacion!: number;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
