import { Trade } from "../../domain/entities/trade";
import { TradeRepository } from "../../domain/repositories/trade-repository";
import { AppDataSource } from "../../infrastructure/data-source";

export class PostgresTradeRepository implements TradeRepository{
    private repository = AppDataSource.getRepository(Trade);

    async create(trade: Omit<Trade, "id">): Promise<Trade> {
        const newTrade = this.repository.create(trade)
        return this.repository.save(newTrade)
    }
}