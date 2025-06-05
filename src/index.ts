import { OrderRepository } from './domain/repositories/order-repository';
import { UpdateUserUseCase } from './domain/use-cases/update-user';
import { UserRepository } from './domain/repositories/user-repository';
import express from "express";
import expressWs from 'express-ws';
import { InMemoryUserRepository } from "./adapters/repositories/in-memory-user-repository";
import { UserController } from "./adapters/controllers/user-controller";
import { GetUsersUseCase } from "./domain/use-cases/get-users";
import { GetUserByIdUseCase } from "./domain/use-cases/get-user-by-id";
import { CreateUserUseCase } from "./domain/use-cases/create-user";
import { DeleteUserUseCase } from './domain/use-cases/delete-user';
import { PostgresUserRepository } from './adapters/repositories/postgres-user-repository';
import { AppDataSource } from './infrastructure/data-source';
import { error } from 'console';

//Market Maker Imports
import { PostgresOrderRepository } from './adapters/repositories/postgres-order-repository';
import { OrderController } from './adapters/controllers/order-controller';
import { MarketMakerUseCase } from './domain/use-cases/market-maker';
import { CoinExPriceService } from './infrastructure/coinex-price-service';
import { GetOrderbookUseCase } from './domain/use-cases/get-orderbook';
import { PostgresTradeRepository } from './adapters/repositories/postgres-trade-repository';
import { MatchOrderUseCase } from './domain/use-cases/match-orders';
import { CreateExternalOrderUseCase } from './domain/use-cases/create-external-order';
import { CoinexDepthService } from './infrastructure/coinex-depth-service';
import { OrderSyncService } from './domain/services/order-sync-service';
import { MarketAnalysisService } from './domain/services/market-analysis-service';
import { ReportController } from './adapters/controllers/report-controller';
import { AssetManagementService } from './domain/services/asset-management-service';
import { ProfitLossService } from './domain/services/profit-loss-service';
import { CoinexPriceServiceRest } from './infrastructure/coinex-price-service-rest';
import { authMiddleware,AuthRequest } from './infrastructure/middlewares/auth-middleware';

const appBase = express();
const wsInstance = expressWs(appBase)
const app = wsInstance.app;
app.use(express.json());

AppDataSource.initialize().then(()=>{
    console.log('Database connected');
    //const userRepository = new PostgresUserRepository();
    // const getUsersUseCase = new GetUsersUseCase(userRepository);
    // const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
    // const createUserUseCase = new CreateUserUseCase(userRepository);
    // const updateUserUseCase = new UpdateUserUseCase(userRepository);
    // const deleteUserUseCase = new DeleteUserUseCase(userRepository);
    const userController = new UserController();
    
    const depthService = new CoinexDepthService();
    
    const orderRepository = new PostgresOrderRepository();
    const tradeRepository = new PostgresTradeRepository();
    const priceService = new CoinExPriceService();
    const btcPriceService= new CoinexPriceServiceRest('BTCUSDT');
    const getOrderbookUseCase = new GetOrderbookUseCase(orderRepository);
    const assetManagementService = new AssetManagementService();
    const profitLossService = new ProfitLossService(btcPriceService);
    const reportController = new ReportController(profitLossService, assetManagementService);

    const matchOrderUseCase = new MatchOrderUseCase(orderRepository, tradeRepository,assetManagementService);
    const orderSync = new OrderSyncService(orderRepository,depthService);
    const marketAnalysis = new MarketAnalysisService(orderRepository);
    const marketMakerUseCase = new MarketMakerUseCase(orderRepository,priceService,matchOrderUseCase,
        assetManagementService,depthService,orderSync,marketAnalysis,btcPriceService);
    const createExternalOrderUseCase = new CreateExternalOrderUseCase(orderRepository);
    const orderController = new OrderController(marketMakerUseCase,getOrderbookUseCase,matchOrderUseCase,createExternalOrderUseCase);

    
    //   //old user api
    // app.get('/users',(req,res)=>userController.getUsers(req,res));
    // app.get('/users/:id',(req,res)=>userController.getUserById(req,res));
    // app.post('/users',(req,res)=>userController.createUser(req,res));
    // app.put('/users/:id',(req,res)=>userController.updateUser(req,res));
    // app.delete('/users/:id',(req,res)=>userController.deleteUser(req,res));

    // User Routes
    app.post('/signup', userController.signup.bind(userController));
    app.post('/login', userController.login.bind(userController));
    app.get('/profile', authMiddleware, userController.getProfile.bind(userController));

    // Market Maker Routes
    app.post('/market-maker',(req,res)=>orderController.runMarketMaker(req,res));
    app.get('/orderbook' , (req,res)=>orderController.getOrderBook(req,res));
    app.post('/match-orders', (req, res) => orderController.matchOrders(req, res));
    app.post('/external-order', (req, res) => orderController.createExternalOrder(req, res));
    app.get('/report', async (req, res) => {
        try {
          const report = await reportController.getReport();
          res.json(report);
        } catch (error) {
          console.error('Error generating report:', error);
          res.status(500).json({ error: 'Failed to generate report' });
        }
      });


    app.listen(3000,()=>{
        console.log('Server running on http://localhost:3000');
    })

}).catch((error)=>{
    console.error('Database connection error:', error);
})
