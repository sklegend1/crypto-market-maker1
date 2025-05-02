import { OrderRepository } from "../repositories/order-repository";
import { AppDataSource } from '../../infrastructure/data-source';
import { Order } from "../entities/order";

export class MarketAnalysisService {
  constructor(private orderRepository: OrderRepository) {}

  async calculateDynamicSpread(pair: string): Promise<number> {
    // Get best bid and ask from orders
    const bestBid = await this.orderRepository.findBestBuyOrder(pair);
    const bestAsk = await this.orderRepository.findBestSellOrder(pair);

    if (!bestBid || !bestAsk) {
      return 0.001; // Default spread if no orders
    }

    // Calculate market spread
    const marketSpread = (bestAsk.price - bestBid.price) / bestBid.price;

    // Calculate total depth (sum of amounts in bids and asks)
    const depthSum = await AppDataSource.getRepository(Order)
      .createQueryBuilder('order')
      .select('SUM(order.amount)', 'total')
      .where('order.pair = :pair AND order.status = :status', { pair, status: 'open' })
      .getRawOne();

    const totalDepth = depthSum.total || 0;

    // Dynamic spread: wider if market spread is large or depth is low
    const baseSpread = 0.001; // 0.1%
    const spreadFactor = marketSpread * (1000 / (totalDepth + 1)); // Adjust based on depth
    const dynamicSpread = baseSpread + spreadFactor;

    return Math.min(Math.max(dynamicSpread, 0.0005), 0.01); // Clamp between 0.05% and 1%
  }
}