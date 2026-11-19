import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * vendedor: el usuario que inicia sesion y administra una inmobiliaria.
 * tabla "usuarios". el email es unico.
 */
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

  // select: false hace que el hash no venga en ninguna consulta salvo que se pida
  // a proposito (solo lo necesita el login). asi no puede filtrarse en una respuesta.
  @Column({ name: 'password_hash', type: "varchar", length: 255, select: false })
  passwordHash!: string;

  @Column({ type: "varchar", length: 20 })
  rol!: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt!: Date;
}