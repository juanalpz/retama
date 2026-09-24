import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";

@Entity("propiedades_cambios_logs")
export class PropertyStatusHistory {
  @PrimaryGeneratedColumn({ name: 'id_log' })
  id!: number;

  @ManyToOne(() => Property, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_propiedad" })
  property!: Property;

  @Column({ name: 'estado_viejo', type: "varchar", length: 30 })
  estadoViejo!: string;

  @Column({ name: 'estado_nuevo', type: "varchar", length: 30 })
  estadoNuevo!: string;

  @CreateDateColumn({ name: 'fecha_cambio' })
  fechaCambio!: Date;
}