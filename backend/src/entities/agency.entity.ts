import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Seller } from "./seller.entity";

@Entity("inmobiliarias")
export class Agency {
  @PrimaryGeneratedColumn({ name: 'id_inmobiliaria' })
  id!: number;

  @Column({ name: 'nombre_fantasia', unique: true, type: "varchar", length: 150 })
  nombreFantasia!: string;

  @Column({ type: "text", nullable: true })
  descripcion!: string | null;

  @Column({ name: 'logo_url', type: "text", nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'direccion_linea1', type: "varchar", length: 200, nullable: true })
  direccionLinea1!: string | null;

  @Column({ name: 'direccion_linea2', type: "varchar", length: 200, nullable: true })
  direccionLinea2!: string | null;

  @OneToOne(() => Seller, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_usuario" })
  seller!: Seller;

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt!: Date;
}