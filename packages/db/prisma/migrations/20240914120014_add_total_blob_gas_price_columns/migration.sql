/*
  Warnings:

  - You are about to drop the column `total_blob_max_gas_fees` on the `transaction_daily_stats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "block_overall_stats" ADD COLUMN     "total_blob_gas_price" DECIMAL(100,0) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transaction_daily_stats" DROP COLUMN "total_blob_max_gas_fees";

-- AlterTable
ALTER TABLE "transaction_overall_stats" ADD COLUMN     "total_blob_gas_price" DECIMAL(100,0) NOT NULL DEFAULT 0;
