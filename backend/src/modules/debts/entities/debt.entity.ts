import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DebtStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

registerEnumType(DebtStatus, {
  name: 'DebtStatus',
  description: 'Estado de la deuda',
});

@ObjectType()
@Entity('debts')
export class Debt {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  description: string;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Field(() => DebtStatus)
  @Column({
    type: 'enum',
    enum: DebtStatus,
    default: DebtStatus.PENDING,
  })
  status: DebtStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  paidAt?: Date;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'debtorId' })
  debtor: User;

  @Column()
  debtorId: string;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'creditorId' })
  creditor: User;

  @Column()
  creditorId: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
