/*
  Warnings:

  - You are about to alter the column `price` on the `eth_usd_price` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(100,0)`.
  - A unique constraint covering the columns `[timestamp]` on the table `eth_usd_price` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "eth_usd_price" ALTER COLUMN "price" SET DATA TYPE DECIMAL(100,0);

-- CreateIndex
CREATE UNIQUE INDEX "eth_usd_price_timestamp_key" ON "eth_usd_price"("timestamp");
