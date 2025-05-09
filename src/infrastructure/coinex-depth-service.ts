import axios from 'axios';

export interface MarketDepth {
    last:string;
    time:number;
    asks:[string,string][];
    bids:[string,string][];
}

export class CoinexDepthService {
    private readonly baseUrl = 'https://api.coinex.com/v2/spot';

    async getMarketDepth(market:string , limit:number = 5,interval:string='0.01'):Promise<MarketDepth | null>{
        try {
            const response = await axios.get(`${this.baseUrl}/depth`,{
                params:{
                    market,
                    limit,
                    interval
                }
            });

            if (response.data.code !== 0) {
                throw new Error(`CoinEx API error: ${response.data.message}`);
              }
              console.log('Coinex Depth Response : ',response.data.data.depth.updated_at)
              return response.data.data.depth;
            
        } catch (error) {
            console.error(`Failed to fetch market depth for ${market}:`, error);
            //throw error;
            return null
        }
    }
}