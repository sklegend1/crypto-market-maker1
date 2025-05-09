import { Order } from "../entities/order";

export interface OrderRepository {
    create(order:Omit<Order,'id'>):Promise<Order>;
    findOpenOrders(pair: string): Promise<Order[]>;
    updateStatus(id:number,status:Order['status']):Promise<void>;
    cancelOldOrders(pair:string,maxAgeSeconds:number,source:Order['source']):Promise<void>;
    limitOpenOrders(pair: string, maxOrders: number,source:Order['source']): Promise<void>;
    findBestBuyOrder(pair: string): Promise<Order | null>;
    findBestSellOrder(pair: string): Promise<Order | null>;
    updateAmount(id: number, amount: number): Promise<void>;
}