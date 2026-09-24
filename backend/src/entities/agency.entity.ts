import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Seller } from "./seller.entity";
import { AgencyPhone } from "./agency-phone.entity";
import { AgencyEmail } from "./agency-email.entity";
import { Property } from "./property.entity";
import { Review } from "./review.entity";

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

  @OneToMany(() => AgencyPhone, (phone) => phone.agency)
  telefonos!: AgencyPhone[];

  @OneToMany(() => AgencyEmail, (email) => email.agency)
  correos!: AgencyEmail[];

  @OneToMany(() => Property, (property) => property.agency)
  propiedades!: Property[];

  @OneToMany(() => Review, (review) => review.agency)
  resenas!: Review[];

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt!: Date;
}