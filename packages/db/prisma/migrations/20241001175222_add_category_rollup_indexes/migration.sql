-- CreateIndex
CREATE INDEX "blobs_on_transactions_category_rollup_block_timestamp_tx_in_idx" ON "blobs_on_transactions"("category", "rollup", "block_timestamp", "tx_index", "index");

-- CreateIndex
CREATE INDEX "blobs_on_transactions_category_rollup_block_number_tx_index_idx" ON "blobs_on_transactions"("category", "rollup", "block_number", "tx_index", "index");
