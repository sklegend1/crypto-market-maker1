import { Order } from "../entities/order";
import { OrderRepository } from "../repositories/order-repository";
import { CoinexDepthService, MarketDepth } from "../../infrastructure/coinex-depth-service";
import { AppDataSource } from "../../infrastructure/data-source";


export class OrderSyncService{
    constructor(
        private orderRepository:OrderRepository,
        private coinexDepthService:CoinexDepthService
    ){}

    async syncOrdersFromCoinEx(pair:string):Promise<void>{
        // Get market depth
        const depth:MarketDepth = await this.coinexDepthService.getMarketDepth(pair.replace('/',''));

        // Prepare orders from bids and asks
        const orders:Omit<Order, 'id'>[] = [];

        // Process bids (buy orders)
        for (const [price, amount] of depth.bids) {
            orders.push({
              pair,
              type: 'buy',
              price: parseFloat(price),
              amount: parseFloat(amount),
              initAmount: parseFloat(amount),
              status: 'open',
              source: 'coinex',
              timestamp: new Date(),
            });
          }

        // Process asks (sell orders)
        for (const [price, amount] of depth.asks) {
            orders.push({
              pair,
              type: 'sell',
              price: parseFloat(price),
              amount: parseFloat(amount),
              initAmount: parseFloat(amount),
              status: 'open',
              source: 'coinex',
              timestamp: new Date(),
            });
          }

        // Remove Old coinEx orders
        // await AppDataSource.getRepository(Order)
        //   .createQueryBuilder()
        //   .delete()
        //   .where('source = :source AND pair = :pair', { source: 'coinex', pair })
        //   .execute();

        // Insert new orders
        for (const order of orders) {
            
            await this.orderRepository.create(order);
        
        }
        console.log(`Synced ${orders.length} orders from CoinEx for ${pair}`);
          
    }
}