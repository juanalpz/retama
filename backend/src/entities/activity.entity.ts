import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Seller } from "./seller.entity";

/**
 * Entidad de actividad/notificación in-app para el feed del vendedor.
 * Cada registro representa un evento relevante (nueva consulta, nueva visita,
 * nueva reseña, cambio de estado) que el vendedor puede ver en su dashboard.
 */
@Entity("actividades")
export class Activity {
  @PrimaryGeneratedColumn({ name: 'id_actividad' })
  id!: number;

  @ManyToOne(() => Seller, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "vendedor_id" })
  seller!: Seller;

  @Column({ type: "varchar", length: 30 })
  tipo!: string;

  @Column({ name: 'referencia_id', type: "int" })
  referenciaId!: number;

  @Column({ name: 'referencia_tipo', type: "varchar", length: 50 })
  referenciaTipo!: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  mensaje!: string | null;

  @Column({ type: "boolean", default: false })
  leido!: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;
}
