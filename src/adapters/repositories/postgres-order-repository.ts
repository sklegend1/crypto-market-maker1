
import { In, LessThan, MoreThan } from "typeorm";
import { Order } from "../../domain/entities/order";
import { OrderRepository } from "../../domain/repositories/order-repository";
import { AppDataSource } from "../../infrastructure/data-source";
import { Asset } from "../../domain/entities/assets";

export class PostgresOrderRepository implements OrderRepository{
    private repository = AppDataSource.getRepository(Order);
    private assets = AppDataSource.getRepository(Asset)

    async create(order: Omit<Order, "id">): Promise<Order> {
        const newOrder = this.repository.create({...order,timestamp : new Date()});
        // if(newOrder&&order.type==='buy'){
        //   const assetIns = await this.assets.findOne({where:{currency:order.pair.split('/')[1]}})
        //   if(assetIns?.balance){
        //     await this.assets.update({currency:order.pair},{balance:assetIns.balance-order.amount})
        //   }
        // }
        // else if(newOrder&&order.type==='sell'){
        //   const assetIns = await this.assets.findOne({where:{currency:order.pair.split('/')[0]}})
        //   if(assetIns?.balance){
        //     await this.assets.update({currency:order.pair},{balance:assetIns.balance-order.amount})
        //   }
        // }
        
        return this.repository.save(newOrder);
    }

    async findOpenOrders(pair: string): Promise<Order[]> {
        return this.repository.find({where :{pair:pair,status:'open'}});
    }

    async updateStatus(id: number, status: Order["status"]): Promise<void> {
        await this.repository.update(id,{status});
    }

    async cancelOldOrders(pair:string,maxAgeSeconds:number,source:Order['source']) :Promise<void>{
        const cutoff = new Date(Date.now() - (maxAgeSeconds*1000));
        await this.repository.update(
            {pair,status:'open',source,timestamp:LessThan(cutoff)},
            {status:'cancelled'}
        )
    }

    async limitOpenOrders(pair: string, maxOrders: number,source:Order['source']): Promise<void> {
        const openOrders = await this.repository.find({
          where: { pair, status: 'open' ,source },
          order: { timestamp: 'ASC' }
        });
        if (openOrders.length > maxOrders) {
          const ordersToCancel = openOrders.slice(0, openOrders.length - maxOrders);
          await this.repository.update(
            { id: In(ordersToCancel.map(o => o.id)) },
            { status: 'cancelled' }
          );
        }
      }

    async findBestBuyOrder(pair: string): Promise<Order | null> {
      const order = await this.repository.findOne({
        where: {pair,type:'buy',status:'open',amount:MoreThan(0)},
        order:{price:'DESC'}
      })
      return order|| null
    }

    async findBestSellOrder(pair: string): Promise<Order | null> {
      const order = await this.repository.findOne({
        where:{pair,type:'sell',status:'open',amount:MoreThan(0)},
        order:{price:'ASC'}
      })
      return order||null
    }

    async updateAmount(id: number, amount: number): Promise<void> {
      await this.repository.update(id,{amount})
    }
}