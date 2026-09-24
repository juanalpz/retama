import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Agency } from "./agency.entity";

@Entity("resenas")
export class Review {
  @PrimaryGeneratedColumn({ name: 'id_resena' })
  id!: number;

  @ManyToOne(() => Agency, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_inmobiliaria" })
  agency!: Agency;

  @Column({ name: 'nombre_autor', type: "varchar", length: 100 })
  nombreAutor!: string;

  @Column({ name: 'email_autor', type: "varchar", length: 150 })
  emailAutor!: string;

  @Column({ type: "smallint" })
  calificacion!: number;

  @Column({ type: "text", nullable: true })
  comentario!: string | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
