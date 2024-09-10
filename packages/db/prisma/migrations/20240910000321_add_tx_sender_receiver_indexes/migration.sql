-- DropIndex
DROP INDEX "transaction_block_timestamp_idx";

-- CreateIndex
CREATE INDEX "transaction_block_timestamp_category_rollup_block_number_in_idx" ON "transaction"("block_timestamp", "category", "rollup", "block_number", "index");

-- CreateIndex
CREATE INDEX "transaction_from_id_block_number_index_idx" ON "transaction"("from_id", "block_number", "index");

-- CreateIndex
CREATE INDEX "transaction_to_id_block_number_index_idx" ON "transaction"("to_id", "block_number", "index");
