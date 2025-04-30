import { DataSource } from 'typeorm';
import { User } from '../domain/entities/user';
import { Order } from '../domain/entities/order';
import { Trade } from '../domain/entities/trade';
require('dotenv').config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: process.env.DBPASS!,
  database: 'users_api',
  entities: [User,Order,Trade],
  synchronize: true, // Auto-create tables (for development only)
  logging: false
});