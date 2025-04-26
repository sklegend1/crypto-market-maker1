import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  pair!: string; // e.g., "BTC/USDT"

  @Column('float')
  price!: number;

  @Column('float')
  amount!: number;

  @Column()
  buyOrderId!: number;

  @Column()
  sellOrderId!: number;

  @Column()
  timestamp!: Date;
}