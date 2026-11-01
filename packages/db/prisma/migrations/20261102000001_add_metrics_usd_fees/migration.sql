-- Add the USD fee counters to the metrics tables. The columns are NULL until
-- Dagster aggregates their partitions again. They are DOUBLE PRECISION, not
-- DECIMAL: the API changes a DECIMAL value to a BigInt, and a USD value has a
-- fractional part.

-- all_time_metrics
ALTER TABLE "all_time_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION;

-- hourly_metrics
ALTER TABLE "hourly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION;

-- daily_metrics
ALTER TABLE "daily_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION;

-- weekly_metrics
ALTER TABLE "weekly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION;

-- monthly_metrics
ALTER TABLE "monthly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION;

-- yearly_metrics
ALTER TABLE "yearly_metrics"
    ADD COLUMN "total_blob_base_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    ADD COLUMN "total_blob_max_fee_usd" DOUBLE PRECISION;
