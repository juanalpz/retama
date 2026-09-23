import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("sellers")
export class Seller {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  fullName!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255 })
  passwordHash!: string;

  @Column({ type: "varchar", nullable: true, length: 40 })
  phone!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}