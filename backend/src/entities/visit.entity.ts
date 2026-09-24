import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";

@Entity("visitas")
export class Visit {
  @PrimaryGeneratedColumn({ name: 'id_visita' })
  id!: number;

  @ManyToOne(() => Property, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_propiedad" })
  property!: Property;

  @Column({ name: 'nombre_visitante', type: "varchar", length: 100 })
  nombreVisitante!: string;

  @Column({ name: 'apellido_visitante', type: "varchar", length: 100 })
  apellidoVisitante!: string;

  @Column({ name: 'telefono_visitante', type: "varchar", length: 50, nullable: true })
  telefonoVisitante!: string | null;

  @Column({ name: 'fecha_propuesta', type: "timestamp", nullable: true })
  fechaPropuesta!: Date | null;

  @Column({ name: 'mensaje_asociado', type: "text", nullable: true })
  mensajeAsociado!: string | null;

  @Column({ type: "varchar", length: 30, default: "PENDIENTE" })
  estado!: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
