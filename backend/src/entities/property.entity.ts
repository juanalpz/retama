import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Agency } from './agency.entity';
import { PropertyPhoto } from './property-photo.entity';
import { PropertyTag } from './property-tag.entity';
import { PropertyStatusHistory } from './property-status-history.entity';
import { PropertyQuestion } from './property-question.entity';
import { PropertyQuestion } from './property-question.entity';
import { Visit } from './visit.entity';

@Entity("propiedades")
export class Property {
  @PrimaryGeneratedColumn({ name: 'id_propiedad' })
  id!: number;

  @ManyToOne(() => Agency, (agency) => agency.propiedades, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "id_inmobiliaria" })
  agency!: Agency;

  @OneToMany(() => PropertyPhoto, (photo) => photo.property)
  fotos!: PropertyPhoto[];

  @OneToMany(() => PropertyTag, (pt) => pt.property)
  tags!: PropertyTag[];

  @OneToMany(() => PropertyStatusHistory, (psh) => psh.property)
  historialEstados!: PropertyStatusHistory[];

  @OneToMany(() => PropertyQuestion, (pq) => pq.property)
  preguntas!: PropertyQuestion[];

  @OneToMany(() => Visit, (visit) => visit.property)
  visitas!: Visit[];

  @Column({ name: 'id_tipo_propiedad', type: "int", nullable: true })
  idTipoPropiedad!: number | null;

  @Column({ type: "varchar", length: 200 })
  titulo!: string;

  @Column({ type: "text", nullable: true })
  descripcion!: string | null;

  @Column({ type: "varchar", length: 20 })
  operacion!: string;

  @Column({ type: "int", nullable: true })
  ambientes!: number | null;

  @Column({ type: "int", nullable: true })
  dormitorios!: number | null;

  @Column({ type: "int", nullable: true })
  banios!: number | null;

  @Column({ name: 'superficie_cubierta_m2', type: "int", nullable: true })
  superficieCubiertaM2!: number | null;

  @Column({ name: 'superficie_total_m2', type: "int", nullable: true })
  superficieTotalM2!: number | null;

  @Column({ type: "float", nullable: true })
  precio!: number | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  moneda!: string | null;

  @Column({ name: 'direccion_linea1', type: "varchar", length: 100, nullable: true })
  direccionLinea1!: string | null;

  @Column({ name: 'barrio_zona', type: "varchar", length: 100, nullable: true })
  barrioZona!: string | null;

  @Column({ type: "varchar", length: 30, default: "BORRADOR" })
  estado!: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  updatedAt!: Date;
}