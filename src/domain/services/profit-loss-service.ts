import { AppDataSource } from '../../infrastructure/data-source';
import { Asset } from '../entities/assets';
import { Commission } from '../entities/commission';
import { CoinExPriceService } from '../../infrastructure/coinex-price-service';

export class ProfitLossService {
  constructor(private priceService: CoinExPriceService) {}

  async calculateProfitLoss(): Promise<{
    totalValue: number;
    initialValue: number;
    profitLoss: number;
    commissions: number;
  }> {
    // Initial values
    const initialUSDT = 100000;
    const initialBTC = 1;

    // Current balances
    const usdtBalance = await AppDataSource.getRepository(Asset)
      .findOne({ where: { currency: 'USDT' } })
      .then((asset) => asset?.balance || 0);
    const btcBalance = await AppDataSource.getRepository(Asset)
      .findOne({ where: { currency: 'BTC' } })
      .then((asset) => asset?.balance || 0);

    // Current BTC price
    const btcPrice = this.priceService.getLatestPrice() || 95000;

    // Total value
    const totalValue = usdtBalance + btcBalance * btcPrice;
    const initialValue = initialUSDT + initialBTC * btcPrice;

    // Commissions
    const commissions = await AppDataSource.getRepository(Commission)
      .createQueryBuilder('commission')
      .select('SUM(commission.amount)', 'total')
      .getRawOne()
      .then((result) => result.total || 0);

    return {
      totalValue,
      initialValue,
      profitLoss: totalValue - initialValue + commissions,
      commissions,
    };
  }
}