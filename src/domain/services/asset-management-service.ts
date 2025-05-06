import { AppDataSource } from "../../infrastructure/data-source";
import { Asset } from "../entities/assets";
import { AssetHistory } from "../entities/asset_history";
import { Commission } from "../entities/commission";

export class AssetManagementService {
    async getBalance(currency:string){
        const asset = await AppDataSource.getRepository(Asset).findOne({where : {currency}});
        return asset?asset.balance : 0 ;
    }

    async updateBalance(currency:string,amount:number,reason:string,tradeId?:number):Promise<void>{
        await AppDataSource.transaction( async (manager)=>{
            // Update asset balance
            const assetRepo = manager.getRepository(Asset);
            const asset = await assetRepo.findOne({where:{currency}});
            if(!asset){
                await assetRepo.insert({currency,balance:amount});
            }
            else{
                await assetRepo.update({currency},{balance:asset.balance + amount});
            }

            // Log change in asset_history
            await manager.getRepository(AssetHistory).insert({
                currency,
                amount,
                reason,
                tradeId,
                timestamp: new Date(),
            });
        })

    }

    async addCommission(tradeId: number,amount: number): Promise<void>{
        await AppDataSource.transaction(async (manager)=>{
            // Add to Commissions
            await manager.getRepository(Commission).insert({
                tradeId,
                amount,
                timestamp:new Date()
            });

            // Update USDT balance
            await this.updateBalance('USDT', amount, 'commission', tradeId);
        })
    }
}

