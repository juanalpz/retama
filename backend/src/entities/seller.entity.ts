import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("usuarios")
export class Seller {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id!: number;

  @Column({ type: "varchar", length: 100 })
  nombre!: string;

  @Column({ type: "varchar", length: 100 })
  apellido!: string;

  @Column({ unique: true, type: "varchar", length: 150 })
  email!: string;

  @Column({ name: 'password_hash', type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ type: "varchar", length: 20 })
  rol!: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt!: Date;
}