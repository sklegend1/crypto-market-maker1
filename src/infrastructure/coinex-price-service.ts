import WebSocket from "ws";
var pako = require('pako')
var crypto = require('crypto');

export class CoinExPriceService{
    private ws:WebSocket|null = null;
    private latestPrice : number | null = null;
    private onPriceUpdate:(price: number ) => void = () =>{};

    constructor(){
        //this.connect();
    }

    private connect(){
        this.ws = new WebSocket('wss://socket.coinex.com/v2/spot');

        
        

        this.ws.on('open',()=>{
            console.log('Connected to CoinEx WebSocket');
            const prepared_str = Date.now().toString();
            const secret_key = "046A4148422502BC0BF1495018D996DD7582E9825A72FF29"
            const signed_str = crypto
            .createHmac('sha256', Buffer.from(secret_key, 'latin1'))
            .update(Buffer.from(prepared_str, 'latin1'))
            .digest('hex')
            .toLowerCase();
            this.ws?.send(JSON.stringify({
               "method": "server.sign",
                "params": {
                    "access_id": "DE99F8F0B3274B59BB5F94A8D90F092C",
                    "signed_str": signed_str,
                    "timestamp": Date.now().toString()
                },
                "id": 1
            }));
            // Subscribe to BTC/USDT ticker
            this.ws?.send(JSON.stringify({
                method:'state.subscribe',
                params: {"market_list": ["BTCUSDT"]},
                id:1
            }));
        });

        this.ws.on('message', (data: WebSocket.Data) => {
            // The original utf8 string
            let originalString = data;

            // Create buffer object, specifying utf8 as encoding
            let bufferObj = data instanceof Buffer ? data : Buffer.from(data as ArrayBuffer);

            // Decompress gzip data
            const text = pako.ungzip(bufferObj, { to: 'string' });
            //console.log(text)
            const message = JSON.parse(text);
            if (message.method === 'state.update' && message.data.state_list[0].market === 'BTCUSDT') {
              const price = parseFloat(message.data.state_list[0].last); // Last price
              
              this.latestPrice = price;
              console.log("BTC Price : ", this.latestPrice)
              this.onPriceUpdate(price);
            }
          });
      
        this.ws.on('error', (error) => {
            console.error('CoinEx WebSocket error:', error);
        });
      
        this.ws.on('close', () => {
            console.log('CoinEx WebSocket closed, reconnecting...');
            setTimeout(() => this.connect(), 5000);
        });

    }

    public getLatestPrice(): number | null {
        return this.latestPrice;
      }
    
    public onPriceChange(callback: (price: number) => void) {
        //this.onPriceUpdate = callback;
    }
}