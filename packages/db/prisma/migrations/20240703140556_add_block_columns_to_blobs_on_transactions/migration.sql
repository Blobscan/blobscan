-- AlterTable
ALTER TABLE "blobs_on_transactions" ADD COLUMN     "block_hash" TEXT,
ADD COLUMN     "block_number" INTEGER,
ADD COLUMN     "block_timestamp" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "blobs_on_transactions_block_hash_idx" ON "blobs_on_transactions"("block_hash");

-- CreateIndex
CREATE INDEX "blobs_on_transactions_block_number_idx" ON "blobs_on_transactions"("block_number");

-- CreateIndex
CREATE INDEX "blobs_on_transactions_block_timestamp_idx" ON "blobs_on_transactions"("block_timestamp");

-- AddForeignKey
ALTER TABLE "blobs_on_transactions" ADD CONSTRAINT "blobs_on_transactions_block_hash_fkey" FOREIGN KEY ("block_hash") REFERENCES "block"("hash") ON DELETE SET NULL ON UPDATE CASCADE;
