import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";

/**
 * solicitud de un interesado para visitar una propiedad. tabla "visitas".
 * el campo estado sigue la maquina de estados de visit.schema.ts.
 */
@Entity("visitas")
export class Visit {
  @PrimaryGeneratedColumn({ name: 'id_visita' })
  id!: number;

  @ManyToOne(() => Property, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_propiedad" })
  property!: Property;

  @Column({ name: 'nombre_visitante', type: "varchar", length: 100 })
  nombreVisitante!: string;

  // el enunciado solo pide nombre y telefono, por eso el apellido es opcional
  @Column({ name: 'apellido_visitante', type: "varchar", length: 100, nullable: true })
  apellidoVisitante!: string | null;

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
