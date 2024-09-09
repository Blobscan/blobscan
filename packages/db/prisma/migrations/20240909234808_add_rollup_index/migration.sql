-- DropIndex
DROP INDEX "transaction_category_idx";

-- CreateIndex
CREATE INDEX "transaction_category_rollup_block_number_index_idx" ON "transaction"("category", "rollup", "block_number", "index");
