import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1747074781224 implements MigrationInterface {
    name = 'CreateUsersTable1747074781224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "pair" character varying NOT NULL, "type" character varying NOT NULL, "price" double precision NOT NULL, "amount" double precision NOT NULL, "initAmount" double precision NOT NULL, "status" character varying NOT NULL, "timestamp" TIMESTAMP NOT NULL, "source" character varying NOT NULL DEFAULT 'market-maker', CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trades" ("id" SERIAL NOT NULL, "pair" character varying NOT NULL, "price" double precision NOT NULL, "amount" double precision NOT NULL, "buyOrderId" integer NOT NULL, "sellOrderId" integer NOT NULL, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_c6d7c36a837411ba5194dc58595" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "commissions" ("id" SERIAL NOT NULL, "tradeId" integer NOT NULL, "amount" double precision NOT NULL, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_2701379966e2e670bb5ff0ae78e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "assets" ("id" SERIAL NOT NULL, "currency" character varying NOT NULL, "balance" double precision NOT NULL, CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "asset_history" ("id" SERIAL NOT NULL, "currency" character varying NOT NULL, "amount" double precision NOT NULL, "reason" character varying NOT NULL, "tradeId" integer NOT NULL, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_409e5fb8b4b5b0252accb6bc435" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "asset_history"`);
        await queryRunner.query(`DROP TABLE "assets"`);
        await queryRunner.query(`DROP TABLE "commissions"`);
        await queryRunner.query(`DROP TABLE "trades"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
