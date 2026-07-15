-- Convert the inserted_at B-tree indexes to BRIN. inserted_at is nearly
-- monotonically increasing on these append-mostly tables, so a BRIN index
-- provides equivalent range-scan pruning at a small fraction of the size
-- and with near-zero write overhead.

-- DropIndex
DROP INDEX IF EXISTS "address_inserted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "blob_inserted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "block_inserted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "transaction_inserted_at_idx";

-- CreateIndex
CREATE INDEX "address_inserted_at_idx" ON "address" USING BRIN ("inserted_at");

-- CreateIndex
CREATE INDEX "blob_inserted_at_idx" ON "blob" USING BRIN ("inserted_at");

-- CreateIndex
CREATE INDEX "block_inserted_at_idx" ON "block" USING BRIN ("inserted_at");

-- CreateIndex
CREATE INDEX "transaction_inserted_at_idx" ON "transaction" USING BRIN ("inserted_at");
