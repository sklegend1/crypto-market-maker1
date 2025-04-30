import { Order } from "../entities/order";
import { OrderRepository } from "../repositories/order-repository";


export class CreateExternalOrderUseCase {
    constructor(private orderRepository: OrderRepository) {}
  
    async execute(
      pair: string,
      type: 'buy' | 'sell',
      price: number,
      amount: number
    ): Promise<Order> {
      const order: Omit<Order, 'id'> = {
        pair,
        type,
        price,
        amount,
        initAmount:amount,
        status: 'open',
        timestamp: new Date(),
        source: 'external'
      };
      return this.orderRepository.create(order);
    }
  }