import { Trade } from "../entities/trade";

export interface TradeRepository{
    create(trade: Omit<Trade,'id'>): Promise<Trade>;
}