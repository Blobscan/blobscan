-- DropIndex
DROP INDEX "transaction_block_timestamp_category_rollup_block_number_in_idx";

-- DropIndex
DROP INDEX "transaction_from_id_block_number_index_idx";

-- DropIndex
DROP INDEX "transaction_to_id_block_number_index_idx";

-- CreateIndex
CREATE INDEX "transaction_block_timestamp_index_idx" ON "transaction"("block_timestamp", "index");

-- CreateIndex
CREATE INDEX "transaction_category_rollup_block_timestamp_index_idx" ON "transaction"("category", "rollup", "block_timestamp", "index");

-- CreateIndex
CREATE INDEX "transaction_from_id_block_timestamp_index_idx" ON "transaction"("from_id", "block_timestamp", "index");

-- CreateIndex
CREATE INDEX "transaction_to_id_block_timestamp_index_idx" ON "transaction"("to_id", "block_timestamp", "index");
