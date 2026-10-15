-- Turn the metrics averages into stored generated columns: each one is
-- total / count of the same row, so the aggregation SQL only has to maintain
-- the totals. Postgres can't convert an existing column, so they're dropped
-- and re-added; existing rows are filled from their totals on ADD COLUMN.
-- The cast to numeric avoids integer division (e.g. BIGINT / INTEGER).

-- all_time_metrics
ALTER TABLE "all_time_metrics"
    DROP COLUMN "avg_blob_base_fee",
    DROP COLUMN "avg_blob_gas_price",
    DROP COLUMN "avg_blob_as_calldata_fee",
    DROP COLUMN "avg_blob_as_calldata_max_fee",
    DROP COLUMN "avg_blob_max_fee",
    DROP COLUMN "avg_blob_usage_size",
    DROP COLUMN "avg_max_blob_gas_fee";

ALTER TABLE "all_time_metrics"
    ADD COLUMN "avg_blob_base_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_base_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_gas_price" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_gas_price"::NUMERIC / NULLIF("total_blocks", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_usage_size" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_usage_size"::NUMERIC / NULLIF("total_blobs", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_max_blob_gas_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_max_blob_gas_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED;

-- hourly_metrics
ALTER TABLE "hourly_metrics"
    DROP COLUMN "avg_blob_base_fee",
    DROP COLUMN "avg_blob_gas_price",
    DROP COLUMN "avg_blob_as_calldata_fee",
    DROP COLUMN "avg_blob_as_calldata_max_fee",
    DROP COLUMN "avg_blob_max_fee",
    DROP COLUMN "avg_blob_usage_size",
    DROP COLUMN "avg_max_blob_gas_fee";

ALTER TABLE "hourly_metrics"
    ADD COLUMN "avg_blob_base_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_base_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_gas_price" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_gas_price"::NUMERIC / NULLIF("total_blocks", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_usage_size" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_usage_size"::NUMERIC / NULLIF("total_blobs", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_max_blob_gas_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_max_blob_gas_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED;

-- daily_metrics
ALTER TABLE "daily_metrics"
    DROP COLUMN "avg_blob_base_fee",
    DROP COLUMN "avg_blob_gas_price",
    DROP COLUMN "avg_blob_as_calldata_fee",
    DROP COLUMN "avg_blob_as_calldata_max_fee",
    DROP COLUMN "avg_blob_max_fee",
    DROP COLUMN "avg_blob_usage_size",
    DROP COLUMN "avg_max_blob_gas_fee";

ALTER TABLE "daily_metrics"
    ADD COLUMN "avg_blob_base_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_base_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_gas_price" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_gas_price"::NUMERIC / NULLIF("total_blocks", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_usage_size" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_usage_size"::NUMERIC / NULLIF("total_blobs", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_max_blob_gas_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_max_blob_gas_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED;

-- weekly_metrics
ALTER TABLE "weekly_metrics"
    DROP COLUMN "avg_blob_base_fee",
    DROP COLUMN "avg_blob_gas_price",
    DROP COLUMN "avg_blob_as_calldata_fee",
    DROP COLUMN "avg_blob_as_calldata_max_fee",
    DROP COLUMN "avg_blob_max_fee",
    DROP COLUMN "avg_blob_usage_size",
    DROP COLUMN "avg_max_blob_gas_fee";

ALTER TABLE "weekly_metrics"
    ADD COLUMN "avg_blob_base_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_base_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_gas_price" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_gas_price"::NUMERIC / NULLIF("total_blocks", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_usage_size" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_usage_size"::NUMERIC / NULLIF("total_blobs", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_max_blob_gas_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_max_blob_gas_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED;

-- monthly_metrics
ALTER TABLE "monthly_metrics"
    DROP COLUMN "avg_blob_base_fee",
    DROP COLUMN "avg_blob_gas_price",
    DROP COLUMN "avg_blob_as_calldata_fee",
    DROP COLUMN "avg_blob_as_calldata_max_fee",
    DROP COLUMN "avg_blob_max_fee",
    DROP COLUMN "avg_blob_usage_size",
    DROP COLUMN "avg_max_blob_gas_fee";

ALTER TABLE "monthly_metrics"
    ADD COLUMN "avg_blob_base_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_base_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_gas_price" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_gas_price"::NUMERIC / NULLIF("total_blocks", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_usage_size" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_usage_size"::NUMERIC / NULLIF("total_blobs", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_max_blob_gas_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_max_blob_gas_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED;

-- yearly_metrics
ALTER TABLE "yearly_metrics"
    DROP COLUMN "avg_blob_base_fee",
    DROP COLUMN "avg_blob_gas_price",
    DROP COLUMN "avg_blob_as_calldata_fee",
    DROP COLUMN "avg_blob_as_calldata_max_fee",
    DROP COLUMN "avg_blob_max_fee",
    DROP COLUMN "avg_blob_usage_size",
    DROP COLUMN "avg_max_blob_gas_fee";

ALTER TABLE "yearly_metrics"
    ADD COLUMN "avg_blob_base_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_base_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_gas_price" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_gas_price"::NUMERIC / NULLIF("total_blocks", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_as_calldata_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_as_calldata_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_max_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_max_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_blob_usage_size" DOUBLE PRECISION GENERATED ALWAYS AS (("total_blob_usage_size"::NUMERIC / NULLIF("total_blobs", 0))::DOUBLE PRECISION) STORED,
    ADD COLUMN "avg_max_blob_gas_fee" DOUBLE PRECISION GENERATED ALWAYS AS (("total_max_blob_gas_fee"::NUMERIC / NULLIF("total_transactions", 0))::DOUBLE PRECISION) STORED;
