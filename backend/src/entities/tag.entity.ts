import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn({ name: 'id_tag' })
  id!: number;

  @Column({ unique: true, type: "varchar", length: 50 })
  tag!: string;
}
