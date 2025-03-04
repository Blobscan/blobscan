/*
  Warnings:

  - You are about to drop the column `rollup` on the `transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "transaction_category_rollup_block_number_index_idx";

-- DropIndex
DROP INDEX "transaction_category_rollup_block_timestamp_index_idx";

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "rollup";
