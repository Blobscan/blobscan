-- Drop the inserted_at indexes: no application query filters or orders by
-- inserted_at, and production statistics (idx_scan = 0 with stats never
-- reset) show they have never been used, while occupying ~635 MB combined.

-- DropIndex
DROP INDEX IF EXISTS "address_inserted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "blob_inserted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "block_inserted_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "transaction_inserted_at_idx";
