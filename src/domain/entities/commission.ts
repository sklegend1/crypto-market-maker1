import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('commissions')
export class Commission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  tradeId!: number; // Related trade ID

  @Column('float')
  amount!: number; // Commission in USDT

  @Column()
  timestamp!: Date;
}