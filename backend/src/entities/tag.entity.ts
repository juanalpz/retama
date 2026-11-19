import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * tag o amenity que puede tener una propiedad (pileta, cochera, etc). tabla "tags".
 */
@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn({ name: 'id_tag' })
  id!: number;

  @Column({ unique: true, type: "varchar", length: 50 })
  tag!: string;
}
