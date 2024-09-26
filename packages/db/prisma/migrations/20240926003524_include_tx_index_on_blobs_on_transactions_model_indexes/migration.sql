-- DropIndex
DROP INDEX "blobs_on_transactions_block_number_idx";

-- DropIndex
DROP INDEX "blobs_on_transactions_block_timestamp_idx";

-- CreateIndex
CREATE INDEX "blobs_on_transactions_block_timestamp_tx_index_index_idx" ON "blobs_on_transactions"("block_timestamp", "tx_index", "index");

-- CreateIndex
CREATE INDEX "blobs_on_transactions_block_number_tx_index_index_idx" ON "blobs_on_transactions"("block_number", "tx_index", "index");
