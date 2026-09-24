import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";

@Entity("propiedades_fotos")
export class PropertyPhoto {
  @PrimaryGeneratedColumn({ name: 'id_foto' })
  id!: number;

  @ManyToOne(() => Property, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_propiedad" })
  property!: Property;

  @Column({ type: "text" })
  url!: string;

  @Column({ type: "int", default: 0 })
  orden!: number;

  @Column({ name: 'es_portada', type: "boolean", default: false })
  esPortada!: boolean;
}
