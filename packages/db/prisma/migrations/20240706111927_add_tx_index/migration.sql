-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "index" INTEGER;

-- CreateIndex
CREATE INDEX "transaction_block_number_index_idx" ON "transaction"("block_number", "index");
