import { Entity,Column,PrimaryGeneratedColumn } from "typeorm";
import { number } from "zod";

@Entity('orders')
export class Order{
    @PrimaryGeneratedColumn()
    id!:number;

    @Column()
    pair!: string;

    @Column()
    type!: 'buy'|'sell';

    @Column('float')
    price!: number;

    @Column('float')
    amount!:number;

    @Column('float')
    initAmount!: number; // Initial amount of the order

    @Column()
    status!:'open' | 'filled' | 'cancelled';

    @Column()
    timestamp! : Date;

    @Column({ default: 'market-maker' })
    source!: 'market-maker' | 'external' | 'coinex'; // To distinguish orders
}