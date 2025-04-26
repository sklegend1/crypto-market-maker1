import { OrderRepository } from './../repositories/order-repository';
import { Order } from "../entities/order";
import { Trade } from "../entities/trade";
import { TradeRepository } from '../repositories/trade-repository';


export class MatchOrderUseCase{
    constructor(
        private orderRepository:OrderRepository,
        private tradeRepository:TradeRepository
    ){}

    async execute(pair:string):Promise<void>{
        console.log("Matching Started")
        while(true){
            const buyOrder = await this.orderRepository.findBestBuyOrder(pair);
            const sellOrder = await this.orderRepository.findBestSellOrder(pair);

            if(!buyOrder || !sellOrder){
                console.log("Match not found !")
                break; // Match not found !
            }

            if (buyOrder.price >= sellOrder.price){
                //Match found ! time to create a trade
                const tradePrice = (buyOrder.price + sellOrder.price) /2;
                const tradeAmount = Math.min(buyOrder.amount,sellOrder.amount);

                const trade:Omit<Trade,'id'> = {
                    pair,
                    price:tradePrice,
                    amount:tradeAmount,
                    buyOrderId:buyOrder.id,
                    sellOrderId:sellOrder.id,
                    timestamp:new Date()
                }

                await this.tradeRepository.create(trade);

                //Update orders
                await this.orderRepository.updateStatus(buyOrder.id,'filled');
                await this.orderRepository.updateStatus(sellOrder.id,'filled');

                console.log(`Matched trade: ${pair} at ${tradePrice}, amount ${tradeAmount}`);

                if(sellOrder.source === 'market-maker'){
                   const newSell:Omit<Order,'id'>  = {
                        pair,
                        price:trade.price*1.005,
                        amount:sellOrder.amount,
                        type:sellOrder.type,
                        source:'market-maker',
                        timestamp:new Date(),
                        status:'open'
                   }
                   await this.orderRepository.create(newSell); 
                }
                    
                else if(buyOrder.source === 'market-maker') {
                    const newBuy:Omit<Order,'id'>  = {
                        pair,
                        price:trade.price*0.995,
                        amount:buyOrder.amount,
                        type:buyOrder.type,
                        source:'market-maker',
                        timestamp:new Date(),
                        status:'open'
                   }
                   await this.orderRepository.create(newBuy); 
                }

            }
            else{
                console.log(`Match is impossible => Buy Price: ${buyOrder.price} , Sell Price: ${sellOrder.price}`)
                break;
            }

        }
    }
}