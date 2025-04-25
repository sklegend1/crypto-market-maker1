import { Order } from "../entities/order";
import { OrderRepository } from "../repositories/order-repository";

export class GetOrderbookUseCase{
    constructor(private orderRepository : OrderRepository){}

    async execute(pair: string):Promise<Order[]>{
        return this.orderRepository.findOpenOrders(pair)
    }
}