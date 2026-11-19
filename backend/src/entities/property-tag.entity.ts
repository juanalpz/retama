import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";
import { Tag } from "./tag.entity";

/**
 * relacion entre una propiedad y un tag. tabla intermedia "propiedades_tags".
 */
@Entity("propiedades_tags")
export class PropertyTag {
  @PrimaryGeneratedColumn({ name: 'id_propiedad_tag' })
  id!: number;

  @ManyToOne(() => Property, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_propiedad" })
  property!: Property;

  @ManyToOne(() => Tag, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_tag" })
  tag!: Tag;
}
