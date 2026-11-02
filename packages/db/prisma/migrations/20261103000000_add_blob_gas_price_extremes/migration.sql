-- Add the maximum and the minimum blob gas price to the metrics tables. These
-- are global-only metrics: only the row without a category and a rollup has
-- values, the same as avg_blob_gas_price.
-- The columns use the same type as block.blob_gas_price.
-- The new columns are nullable and have no default. Thus, Postgres does not
-- rewrite the tables.

-- all_time_metrics
ALTER TABLE "all_time_metrics"
    ADD COLUMN "max_blob_gas_price" DECIMAL(100,0),
    ADD COLUMN "min_blob_gas_price" DECIMAL(100,0);

-- hourly_metrics
ALTER TABLE "hourly_metrics"
    ADD COLUMN "max_blob_gas_price" DECIMAL(100,0),
    ADD COLUMN "min_blob_gas_price" DECIMAL(100,0);

-- daily_metrics
ALTER TABLE "daily_metrics"
    ADD COLUMN "max_blob_gas_price" DECIMAL(100,0),
    ADD COLUMN "min_blob_gas_price" DECIMAL(100,0);

-- weekly_metrics
ALTER TABLE "weekly_metrics"
    ADD COLUMN "max_blob_gas_price" DECIMAL(100,0),
    ADD COLUMN "min_blob_gas_price" DECIMAL(100,0);

-- monthly_metrics
ALTER TABLE "monthly_metrics"
    ADD COLUMN "max_blob_gas_price" DECIMAL(100,0),
    ADD COLUMN "min_blob_gas_price" DECIMAL(100,0);

-- yearly_metrics
ALTER TABLE "yearly_metrics"
    ADD COLUMN "max_blob_gas_price" DECIMAL(100,0),
    ADD COLUMN "min_blob_gas_price" DECIMAL(100,0);
