import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";

@Entity("preguntas_propiedad")
export class PropertyQuestion {
  @PrimaryGeneratedColumn({ name: 'id_pregunta' })
  id!: number;

  @ManyToOne(() => Property, (property) => property.preguntas, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_propiedad" })
  property!: Property;

  @Column({ name: 'nombre_solicitante', type: "varchar", length: 100 })
  nombreSolicitante!: string;

  @Column({ type: "text" })
  pregunta!: string;

  @Column({ name: 'respuesta_vendedor', type: "text", nullable: true })
  respuestaVendedor!: string | null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
