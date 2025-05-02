import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_history')
export class AssetHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  currency!: string; // e.g., 'USDT', 'BTC'

  @Column('float')
  amount!: number; // Change amount (positive or negative)

  @Column()
  reason!: string; // e.g., 'trade', 'commission'

  @Column()
  tradeId?: number; // Related trade ID (if applicable)

  @Column()
  timestamp!: Date;
}