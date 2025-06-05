import { OrderSyncService } from './../services/order-sync-service';
import { TradeRepository } from './../repositories/trade-repository';
import { MatchOrderUseCase } from './match-orders';
import { OrderRepository } from './../repositories/order-repository';
import { Order } from '../entities/order';
import { CoinExPriceService } from '../../infrastructure/coinex-price-service';
import { CoinexDepthService } from '../../infrastructure/coinex-depth-service';
import { MarketAnalysisService } from '../services/market-analysis-service';
import { CoinexPriceServiceRest } from '../../infrastructure/coinex-price-service-rest';
import { AssetManagementService } from '../services/asset-management-service';

export class MarketMakerUseCase{
    private isProcessing = false;

    constructor (
        private orderRepository:OrderRepository,
        private priceService: CoinExPriceService,
        private matchOrderUseCase:MatchOrderUseCase,
        private assetManager:AssetManagementService,
        private depthService:CoinexDepthService,
        private orderSyncService:OrderSyncService,
        private marketAnalysisService: MarketAnalysisService,
        private priceServiceRest:CoinexPriceServiceRest
    ){

        
        // Update orders whenever price changes
        //     this.priceService.onPriceChange((price) => {
        //         const tOut = setTimeout(()=>{
        //             console.log('Tick !')
        //             this.depthService.getMarketDepth('BTCUSDT');
        //             this.execute('BTC/USDT', 0.1, 0.01,0.15);
                    
        //         },500)
                
        //   });

        //update orders from rest api
        this.priceServiceRest.onPriceChange((price) => {
                this.depthService.getMarketDepth('BTCUSDT');
                this.execute('BTC/USDT', 0.1, 0.001,0.15);
        });

    }

    async execute(pair:string, baseSpread: number , amount:number, priceDiffThreshold:number = 5): Promise<void>{
        if (this.isProcessing) {
            console.log('Skipping execution: another process is running');
            return; // Prevent concurrent executions
          }

        this.isProcessing = true
        try {
            // Sync CoinEx orders
            await this.orderSyncService.syncOrdersFromCoinEx(pair);

            // Calculate dynamic spread
            const spread = await this.marketAnalysisService.calculateDynamicSpread(pair);

            const currentPrice = this.priceServiceRest.getLatest();
            if (!currentPrice){
                throw new Error('No price data available')
            }

            // Run order matching after creating new orders
            await this.matchOrderUseCase.execute(pair);
            
            const lastOrders = await this.orderRepository.findOpenOrders(pair);
            let needToChange = (lastOrders.filter(o => o.source === 'market-maker').length === 0) ;
            
            //console.log(lastOrders)
            
            for(const order of lastOrders){
                
                if(order.source === 'market-maker' && currentPrice && (Math.abs(order.price - currentPrice) > (currentPrice * (priceDiffThreshold /100)) )){
                    console.log(`Cancelling order ${order.id}: price ${order.price} too far from ${currentPrice}`);
                    await this.orderRepository.cancelOldOrders(pair,0.1,'market-maker');
                    needToChange = true
                }
            }

            // Check if we need to create new market-maker orders
            const marketMakerOrders = lastOrders.filter(o => o.source === 'market-maker');
            const hasBuyOrder = marketMakerOrders.some(o => o.type === 'buy');
            const hasSellOrder = marketMakerOrders.some(o => o.type === 'sell');

            if (!hasBuyOrder || !hasSellOrder) {
                needToChange = true;
              }

            // Limit total open orders to 10
            await this.orderRepository.limitOpenOrders(pair, 20,'market-maker');

            if(needToChange){
                console.log(`Creating new orders for ${pair} at price ${currentPrice}`);
                await this.createOrders(pair,currentPrice,spread,amount,!hasBuyOrder,!hasSellOrder); 
            }

            
        }
        finally {
            this.isProcessing = false;
          }
        
    }

    private async createOrders(pair:string, currentPrice: number, spread: number , amount:number,createBuy:boolean,createSell:boolean){
        // Cancel old orders to keep orderbook clean
        //await this.orderRepository.cancelOldOrders(pair,60);
        // Simple market maker: create buy and sell orders with fixed spread
        const buyPrice = currentPrice * (1- (spread/100));
        const sellPrice = currentPrice * (1+ (spread/100));
        const asset1Balance = await this.assetManager.getBalance(pair.split('/')[0])
        const asset2Balance = await this.assetManager.getBalance(pair.split('/')[1])
        console.log(pair.split('/')[0]+' Balance : ',asset1Balance,pair.split('/')[1]+' Balance : ',asset2Balance)


        const buyOrder: Omit<Order,'id'> = {
            pair,
            type:'buy',
            price: buyPrice,
            amount,
            initAmount:amount,
            status:'open',
            timestamp:new Date(),
            source:'market-maker'
        };

        const sellOrder:Omit<Order,'id'> = {
            pair,
            type:'sell',
            price: sellPrice,
            amount,
            initAmount:amount,
            status:'open',
            timestamp:new Date(),
            source:'market-maker'
        };
        const inOrder = await this.orderRepository.findOpenOrders(pair);
        let inOrderUSDTs = 0 
        let inOrderBTCs = 0 
        inOrder.forEach((order)=>{
            if(order.source === 'market-maker'){
                if(order.type==='sell'){
                    inOrderBTCs +=order.amount
                }
                else{
                    inOrderUSDTs += order.amount*order.price
                }
            }
        })
        if(createBuy && ((asset2Balance - inOrderUSDTs)>buyOrder.amount)) {
            const orderSaved = await this.orderRepository.create(buyOrder)
        };
        if(createSell && ((asset1Balance-inOrderBTCs)>sellOrder.amount)) {
            const orderSaved = await this.orderRepository.create(sellOrder);
            
        }
    }
}