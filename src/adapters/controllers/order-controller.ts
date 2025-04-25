import {Request ,  Response } from 'express';
import { MarketMakerUseCase } from '../../domain/use-cases/market-maker';
import { GetOrderbookUseCase } from '../../domain/use-cases/get-orderbook';

export class OrderController{
    constructor (
        private marketMakerUseCase:MarketMakerUseCase,
        private getOrderbookUseCase:GetOrderbookUseCase
    ){}

    async runMarketMaker(req:Request,res:Response){
        try {
            const {pair,spread,amount} = req.body;
            await this.marketMakerUseCase.execute(pair,spread,amount);
            res.status(201).json({message:'Orders created'});
            
        } catch (error) {
            if(error instanceof Error){
                res.status(400).json({message: error.message});
            }
            else{
                res.status(400).json({message:'Unknown error'})
            }
        }
    }

    async getOrderBook(req:Request,res:Response){
        try {
            const pair = req.query.pair as string || 'BTC/USDT';
            const orders = await this.getOrderbookUseCase.execute(pair);
            res.json(orders)
        } catch (error) {
            if(error instanceof Error){
                res.status(500).json({message: error.message});
            }
            else{
                res.status(400).json({message:'Unknown error'})
            }
        }
    }
}