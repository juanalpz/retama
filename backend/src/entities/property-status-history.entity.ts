import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Property } from "./property.entity";
import { PropertyStatus } from "./enums";

@Entity("property_status_history")
export class PropertyStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: PropertyStatus })
  fromStatus!: PropertyStatus;

  @Column({ type: "enum", enum: PropertyStatus })
  toStatus!: PropertyStatus;

  @ManyToOne(() => Property, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "property_id" })
  property!: Property;

  @CreateDateColumn()
  createdAt!: Date;
}