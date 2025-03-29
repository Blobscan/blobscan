/*
  Warnings:

  - You are about to alter the column `price` on the `eth_usd_price` table. The data in that column could be lost. The data in that column will be cast from `Decimal(100,0)` to `Decimal(18,8)`.

*/
-- AlterTable
ALTER TABLE "eth_usd_price" ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,8);

-- CreateTable
CREATE TABLE "eth_usd_price_feed_state" (
    "id" SERIAL NOT NULL,
    "latest_round_id" DECIMAL(100,0) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eth_usd_price_feed_state_pkey" PRIMARY KEY ("id")
);
