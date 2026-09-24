import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";

@Entity("comentarios")
export class Comment {
  @PrimaryGeneratedColumn({ name: 'id_comentario' })
  id!: number;

  @ManyToOne(() => Property, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_propiedad" })
  property!: Property;

  @Column({ name: 'tipo_comentario', type: "varchar", length: 50, nullable: true })
  tipoComentario!: string | null;

  @Column({ type: "varchar", length: 100 })
  nombre!: string;

  @Column({ type: "varchar", length: 150 })
  email!: string;

  @Column({ type: "text" })
  comentario!: string;

  @Column({ name: 'respuesta_vendedor', type: "text", nullable: true })
  respuestaVendedor!: string | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
