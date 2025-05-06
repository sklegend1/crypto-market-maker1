import { OrderRepository } from './../repositories/order-repository';
import { Order } from "../entities/order";
import { Trade } from "../entities/trade";
import { TradeRepository } from '../repositories/trade-repository';
import { AppDataSource } from '../../infrastructure/data-source';
import { AssetManagementService } from '../services/asset-management-service';


export class MatchOrderUseCase{
    constructor(
        private orderRepository:OrderRepository,
        private tradeRepository:TradeRepository,
        private assetManagementService: AssetManagementService
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
                // Check if both orders are market-maker
                if (buyOrder.source === 'market-maker' && sellOrder.source === 'market-maker') {
                    console.log('Skipping match: both orders are market-maker');
                    break; // Prevent market-maker orders from matching each other
                }

                await AppDataSource.transaction(async transactionalEntityManager =>{

                
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

                const savedTrade = await transactionalEntityManager.getRepository(Trade).save(trade);


                // Calculate commission (0.1% of trade value) if either order is coinex or external
                const tradeValue = tradePrice * tradeAmount;
                const commissionRate = 0.001; // 0.1%
                let commission = 0;
                if (buyOrder.source !== 'market-maker' || sellOrder.source !== 'market-maker') {
                  commission = tradeValue * commissionRate;
                  await this.assetManagementService.addCommission(savedTrade.id, commission);
                }
                //Update orders
                // Update assets for market-maker orders
                if (buyOrder.source === 'market-maker') {
                  // Market-maker buys: increase BTC, decrease USDT
                  await this.assetManagementService.updateBalance('BTC', tradeAmount, 'trade', savedTrade.id);
                  await this.assetManagementService.updateBalance('USDT', -tradeValue, 'trade', savedTrade.id);
                }
                if (sellOrder.source === 'market-maker') {
                  // Market-maker sells: decrease BTC, increase USDT
                  await this.assetManagementService.updateBalance('BTC', -tradeAmount, 'trade', savedTrade.id);
                  await this.assetManagementService.updateBalance('USDT', tradeValue, 'trade', savedTrade.id);
                }

                // Update order amounts and statuses
                const buyRemaining = buyOrder.amount - tradeAmount;
                const sellRemaining = sellOrder.amount - tradeAmount;
                console.log(`Buy remaining: ${buyRemaining}, Sell remaining: ${sellRemaining}`);

                if (buyRemaining <= 0) {
                    await transactionalEntityManager.getRepository(Order).update(buyOrder.id, {status:'filled',amount:0});
                    console.log(`Buy order ${buyOrder.id} marked as filled`);
                  } else {
                    await transactionalEntityManager.getRepository(Order).update(buyOrder.id, {amount:buyRemaining});
                    console.log(`Buy order ${buyOrder.id} updated amount to ${buyRemaining}`);
                  }
                
                if (sellRemaining <= 0) {
                    await transactionalEntityManager.getRepository(Order).update(sellOrder.id, {status:'filled',amount:0});
                    console.log(`Sell order ${sellOrder.id} marked as filled`);
                } else {
                    await transactionalEntityManager.getRepository(Order).update(sellOrder.id, {amount:sellRemaining});
                    console.log(`Sell order ${sellOrder.id} updated amount to ${sellRemaining}`);
                }
                // Refresh orders to get updated status and amount
                const updatedBuyOrder = await transactionalEntityManager.getRepository(Order).findOne({ where: { id: buyOrder.id } });
                const updatedSellOrder = await transactionalEntityManager.getRepository(Order).findOne({ where: { id: sellOrder.id } });

                // Validate volumes with updated orders
                await this.validateOrderVolume(updatedBuyOrder!, transactionalEntityManager);
                await this.validateOrderVolume(updatedSellOrder!, transactionalEntityManager);
            })

                //console.log(`Matched trade: ${pair} at ${tradePrice}, amount ${tradeAmount}`);
                console.log(`Matched trade: ${pair} at ${(buyOrder.price + sellOrder.price) / 2}, amount ${Math.min(buyOrder.amount, sellOrder.amount)}`);
            }
            else{
                console.log(`Match is impossible => Buy Price: ${buyOrder.price} , Sell Price: ${sellOrder.price}`)
                break;
            }

            

        }
    }

    private async validateOrderVolume(order: Order, manager: any) {
        // Calculate total traded amount for buy and sell trades separately
        const buyTradeSum = await manager.getRepository(Trade).createQueryBuilder('trade')
          .select('SUM(trade.amount)', 'total')
          .where('trade.buyOrderId = :id', { id: order.id })
          .getRawOne();
    
        const sellTradeSum = await manager.getRepository(Trade).createQueryBuilder('trade')
          .select('SUM(trade.amount)', 'total')
          .where('trade.sellOrderId = :id', { id: order.id })
          .getRawOne();
    
        const buyTradedAmount = buyTradeSum.total || 0;
        const sellTradedAmount = sellTradeSum.total || 0;
        const tradedAmount = buyTradedAmount + sellTradedAmount;
    
        // Calculate expected remaining amount
        const expectedRemaining = order.initAmount - tradedAmount;
    
        // Tolerance for floating-point errors
        const TOLERANCE = 0.00000001;
    
        // Validate based on order status
        let isValid = false;
        if (order.status === 'filled') {
          // For filled orders, amount and expectedRemaining should be 0
          isValid = Math.abs(order.amount) < TOLERANCE && Math.abs(expectedRemaining) < TOLERANCE;
        } else if (order.status === 'open') {
          // For open orders, amount should match expectedRemaining
          isValid = Math.abs(expectedRemaining - order.amount) < TOLERANCE;
        } else if (order.status === 'cancelled') {
          // For cancelled orders, tradedAmount should be consistent with initAmount - amount
          isValid = Math.abs(order.initAmount - order.amount - tradedAmount) < TOLERANCE;
        }
    
        // Log detailed validation result
        if (!isValid) {
          console.error(
            `Volume mismatch for order ${order.id}: ` +
            `status=${order.status}, initAmount=${order.initAmount}, ` +
            `amount=${order.amount}, traded=${tradedAmount}, ` +
            `buyTraded=${buyTradedAmount}, sellTraded=${sellTradedAmount}, ` +
            `expectedRemaining=${expectedRemaining}`
          );
        } else {
          console.log(
            `Volume validated for order ${order.id}: ` +
            `status=${order.status}, initAmount=${order.initAmount}, ` +
            `amount=${order.amount}, traded=${tradedAmount}, ` +
            `buyTraded=${buyTradedAmount}, sellTraded=${sellTradedAmount}`
          );
        }
      }
}