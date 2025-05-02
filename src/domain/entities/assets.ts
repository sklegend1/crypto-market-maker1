import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  currency!: string; // e.g., 'USDT', 'BTC'

  @Column('float')
  balance!: number; // Current balance
}