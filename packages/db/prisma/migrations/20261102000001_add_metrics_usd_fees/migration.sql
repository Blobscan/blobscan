-- Add the USD fee counters to the metrics tables. The columns are NULL until
-- Dagster aggregates their partitions again. total_usd_priced_transactions is
-- the count of the transactions that have a USD fee. Use it, not
-- total_transactions, to divide a USD total. They are DOUBLE PRECISION, not
-- DECIMAL: the API changes a DECIMAL value to a BigInt, and a USD value has a
-- fractional part.

-- all_time_metrics
ALTER TABLE "all_time_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_usd_priced_transactions" INTEGER;

-- hourly_metrics
ALTER TABLE "hourly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_usd_priced_transactions" INTEGER;

-- daily_metrics
ALTER TABLE "daily_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_usd_priced_transactions" INTEGER;

-- weekly_metrics
ALTER TABLE "weekly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_usd_priced_transactions" INTEGER;

-- monthly_metrics
ALTER TABLE "monthly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_usd_priced_transactions" INTEGER;

-- yearly_metrics
ALTER TABLE "yearly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_usd_priced_transactions" INTEGER;
