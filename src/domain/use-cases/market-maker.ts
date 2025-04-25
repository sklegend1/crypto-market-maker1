import { OrderRepository } from './../repositories/order-repository';
import { Order } from '../entities/order';
import { CoinExPriceService } from '../../infrastructure/coinex-price-service';

export class MarketMakerUseCase{
    private isProcessing = false;

    constructor (
        private orderRepository:OrderRepository,
        private priceService: CoinExPriceService
    ){
        // Update orders whenever price changes
        this.priceService.onPriceChange((price) => {
            this.execute('BTC/USDT', 0.1, 0.01,0.15);
      });
    }

    async execute(pair:string, spread: number , amount:number, priceDiffThreshold:number = 5): Promise<void>{
        if (this.isProcessing) {
            console.log('Skipping execution: another process is running');
            return; // Prevent concurrent executions
          }

        this.isProcessing = true
        try {
            const currentPrice = this.priceService.getLatestPrice();
            if (!currentPrice){
                throw new Error('No price data available')
            }
            const lastOrders = await this.orderRepository.findOpenOrders(pair);
            let needToChange = (lastOrders.length === 0) ;
            
            //console.log(lastOrders)
            
            for(const order of lastOrders){
                if(currentPrice && (Math.abs(order.price - currentPrice) > (currentPrice * (priceDiffThreshold /100)) )){
                    console.log(`Cancelling order ${order.id}: price ${order.price} too far from ${currentPrice}`);
                    await this.orderRepository.cancelOldOrders(pair,0.1);
                    needToChange = true
                }
            }

            // Limit total open orders to 10
            await this.orderRepository.limitOpenOrders(pair, 10);

            if(needToChange){
                console.log(`Creating new orders for ${pair} at price ${currentPrice}`);
                await this.createOrders(pair,currentPrice,spread,amount); 
            }
        }
        finally {
            this.isProcessing = false;
          }
        
    }

    private async createOrders(pair:string, currentPrice: number, spread: number , amount:number){
        // Cancel old orders to keep orderbook clean
        //await this.orderRepository.cancelOldOrders(pair,60);
        // Simple market maker: create buy and sell orders with fixed spread
        const buyPrice = currentPrice * (1- (spread/100));
        const sellPrice = currentPrice * (1+ (spread/100));
        

        const buyOrder: Omit<Order,'id'> = {
            pair,
            type:'buy',
            price: buyPrice,
            amount,
            status:'open',
            timestamp:new Date()
        };

        const sellOrder:Omit<Order,'id'> = {
            pair,
            type:'sell',
            price: sellPrice,
            amount,
            status:'open',
            timestamp:new Date()
        };

        await this.orderRepository.create(buyOrder);
        await this.orderRepository.create(sellOrder);
    }
}