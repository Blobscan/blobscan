-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "block_number" INTEGER,
ADD COLUMN     "block_timestamp" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "transaction_block_number_idx" ON "transaction"("block_number");

-- CreateIndex
CREATE INDEX "transaction_block_timestamp_idx" ON "transaction"("block_timestamp");
