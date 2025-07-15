import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userEmail!: string;

  @Column({ nullable: true })
  service!: string;

  @Column({ nullable: true })
  amount!: string;

  @Column({ nullable: true })
  renewalDate!: string;

  @Column()
  emailId!: string;

  @Column()
  subject!: string;

  @Column()
  snippet!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
