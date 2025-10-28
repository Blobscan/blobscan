-- AlterEnum
ALTER TYPE "blob_storage" ADD VALUE 'swarmycloud';

-- CreateIndex
CREATE INDEX "blobs_on_transactions_tx_hash_blob_hash_idx" ON "blobs_on_transactions"("tx_hash", "blob_hash");

-- CreateIndex
CREATE INDEX "blobs_on_transactions_block_timestamp_tx_hash_idx" ON "blobs_on_transactions"("block_timestamp", "tx_hash");

-- CreateIndex
CREATE INDEX "transaction_from_id_block_timestamp_idx" ON "transaction"("from_id", "block_timestamp");
