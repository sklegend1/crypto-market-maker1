import { MigrationInterface, QueryRunner } from 'typeorm';

     export class CreateAssetsTables20250502 implements MigrationInterface {
       public async up(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.query(`
           CREATE TABLE assets (
             id SERIAL PRIMARY KEY,
             currency VARCHAR NOT NULL,
             balance FLOAT NOT NULL,
             UNIQUE (currency)
           );

           CREATE TABLE asset_history (
             id SERIAL PRIMARY KEY,
             currency VARCHAR NOT NULL,
             amount FLOAT NOT NULL,
             reason VARCHAR NOT NULL,
             trade_id INTEGER,
             timestamp TIMESTAMP NOT NULL
           );

           CREATE TABLE commissions (
             id SERIAL PRIMARY KEY,
             trade_id INTEGER NOT NULL REFERENCES trades(id),
             amount FLOAT NOT NULL,
             timestamp TIMESTAMP NOT NULL
           );

           INSERT INTO assets (currency, balance) VALUES ('USDT', 1000), ('BTC', 0.01);
         `);
       }

       public async down(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.query(`
           DROP TABLE commissions;
           DROP TABLE asset_history;
           DROP TABLE assets;
         `);
       }
     }