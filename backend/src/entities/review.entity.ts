import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Agency } from "./agency.entity";

/**
 * reseña de un interesado sobre una inmobiliaria, con calificacion de 1 a 5.
 * tabla "resenias_inmobiliaria".
 */
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
