/*
  Warnings:

  - Made the column `block_hash` on table `blobs_on_transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `block_number` on table `blobs_on_transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `block_timestamp` on table `blobs_on_transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "blobs_on_transactions" DROP CONSTRAINT "blobs_on_transactions_block_hash_fkey";

-- AlterTable
ALTER TABLE "blobs_on_transactions" ALTER COLUMN "block_hash" SET NOT NULL,
ALTER COLUMN "block_number" SET NOT NULL,
ALTER COLUMN "block_timestamp" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "blobs_on_transactions" ADD CONSTRAINT "blobs_on_transactions_block_hash_fkey" FOREIGN KEY ("block_hash") REFERENCES "block"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
