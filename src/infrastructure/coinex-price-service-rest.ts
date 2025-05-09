import axios from 'axios';

export interface MarketDepth {
    last:string;
    time:number;
}

export class CoinexPriceServiceRest {
    private latestPrice:number|null = null;
    private readonly baseUrl = 'https://api.coinex.com/v2/spot';
    private subscribers: ((price: number) => void)[] = [];

    constructor( private market:string){
        const getInterval = setInterval(()=>{
            this.getMarketLastPrice(this.market);
        },2000)
    }
    

    async getMarketLastPrice(market:string  ):Promise<void>{
        try {
            const response = await axios.get(`${this.baseUrl}/ticker`,{
                params:{
                    market
                }
            });

            if (response.data.code !== 0) {
                throw new Error(`CoinEx API error: ${response.data.message}`);
              }
              console.log('Coinex Info Response : ',response.data.data[0].last)
              const price = response.data.data[0].last;

              if(price){
                this.latestPrice = price
                this.subscribers.forEach((callback)=>{callback(price)})
              }
            
        } catch (error) {
            console.error(`Failed to fetch market info for ${market}:`, error);
            //throw error;
        }
    }


    getLatest():number|null{
        return this.latestPrice
    }

    onPriceChange(callback: (price: number) => void) {
        this.subscribers.push(callback);
      }

    public  setLastPrice(market:string, callback : (price:string)=>void){
        this.getMarketLastPrice(market)
    }
}