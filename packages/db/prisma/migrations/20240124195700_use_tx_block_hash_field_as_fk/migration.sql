/*
  Warnings:

  - You are about to drop the column `block_number` on the `transaction` table. All the data in the column will be lost.
  - Made the column `block_hash` on table `transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_block_number_fkey";

-- DropIndex
DROP INDEX "transaction_block_number_idx";

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "block_number",
ALTER COLUMN "block_hash" SET NOT NULL;

-- CreateIndex
CREATE INDEX "transaction_block_hash_idx" ON "transaction"("block_hash");

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_block_hash_fkey" FOREIGN KEY ("block_hash") REFERENCES "block"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
