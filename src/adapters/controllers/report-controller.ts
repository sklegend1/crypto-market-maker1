import { ProfitLossService } from '../../domain/services/profit-loss-service';
import { AssetManagementService } from '../../domain/services/asset-management-service';

export class ReportController {
  constructor(
    private profitLossService: ProfitLossService,
    private assetManagementService: AssetManagementService
  ) {}

  async getReport(): Promise<{
    balances: { USDT: number; BTC: number };
    profitLoss: { totalValue: number; initialValue: number; profitLoss: number; commissions: number };
  }> {
    const usdtBalance = await this.assetManagementService.getBalance('USDT');
    const btcBalance = await this.assetManagementService.getBalance('BTC');
    const profitLoss = await this.profitLossService.calculateProfitLoss();

    return {
      balances: { USDT: usdtBalance, BTC: btcBalance },
      profitLoss,
    };
  }
}