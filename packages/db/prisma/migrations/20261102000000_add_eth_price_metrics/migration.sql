-- Add the ETH price metrics to the metrics tables. These are global-only
-- metrics: only the row without a category and a rollup has values.
-- avg_eth_price is a stored generated column, the same as the other averages
-- (see 20261016000000_generate_metrics_averages).
-- The columns are DOUBLE PRECISION, not DECIMAL: the API changes a DECIMAL
-- value to a BigInt, and a price has a fractional part.

-- A stored generated column makes Postgres rewrite the table. The metrics
-- tables are small, but the migration uses one transaction and a lock timeout.
-- Thus, it stops if a writer holds a lock on a metrics table for too long, and
-- Postgres then cancels all the changes.
BEGIN;

SET LOCAL lock_timeout = '10s';

-- all_time_metrics
ALTER TABLE "all_time_metrics"
    ADD COLUMN "total_eth_price" DOUBLE PRECISION,
    ADD COLUMN "total_eth_price_count" INTEGER,
    ADD COLUMN "max_eth_price" DOUBLE PRECISION,
    ADD COLUMN "min_eth_price" DOUBLE PRECISION,
    ADD COLUMN "avg_eth_price" DOUBLE PRECISION GENERATED ALWAYS AS ("total_eth_price" / NULLIF("total_eth_price_count", 0)) STORED;

-- hourly_metrics
ALTER TABLE "hourly_metrics"
    ADD COLUMN "total_eth_price" DOUBLE PRECISION,
    ADD COLUMN "total_eth_price_count" INTEGER,
    ADD COLUMN "max_eth_price" DOUBLE PRECISION,
    ADD COLUMN "min_eth_price" DOUBLE PRECISION,
    ADD COLUMN "avg_eth_price" DOUBLE PRECISION GENERATED ALWAYS AS ("total_eth_price" / NULLIF("total_eth_price_count", 0)) STORED;

-- daily_metrics
ALTER TABLE "daily_metrics"
    ADD COLUMN "total_eth_price" DOUBLE PRECISION,
    ADD COLUMN "total_eth_price_count" INTEGER,
    ADD COLUMN "max_eth_price" DOUBLE PRECISION,
    ADD COLUMN "min_eth_price" DOUBLE PRECISION,
    ADD COLUMN "avg_eth_price" DOUBLE PRECISION GENERATED ALWAYS AS ("total_eth_price" / NULLIF("total_eth_price_count", 0)) STORED;

-- weekly_metrics
ALTER TABLE "weekly_metrics"
    ADD COLUMN "total_eth_price" DOUBLE PRECISION,
    ADD COLUMN "total_eth_price_count" INTEGER,
    ADD COLUMN "max_eth_price" DOUBLE PRECISION,
    ADD COLUMN "min_eth_price" DOUBLE PRECISION,
    ADD COLUMN "avg_eth_price" DOUBLE PRECISION GENERATED ALWAYS AS ("total_eth_price" / NULLIF("total_eth_price_count", 0)) STORED;

-- monthly_metrics
ALTER TABLE "monthly_metrics"
    ADD COLUMN "total_eth_price" DOUBLE PRECISION,
    ADD COLUMN "total_eth_price_count" INTEGER,
    ADD COLUMN "max_eth_price" DOUBLE PRECISION,
    ADD COLUMN "min_eth_price" DOUBLE PRECISION,
    ADD COLUMN "avg_eth_price" DOUBLE PRECISION GENERATED ALWAYS AS ("total_eth_price" / NULLIF("total_eth_price_count", 0)) STORED;

-- yearly_metrics
ALTER TABLE "yearly_metrics"
    ADD COLUMN "total_eth_price" DOUBLE PRECISION,
    ADD COLUMN "total_eth_price_count" INTEGER,
    ADD COLUMN "max_eth_price" DOUBLE PRECISION,
    ADD COLUMN "min_eth_price" DOUBLE PRECISION,
    ADD COLUMN "avg_eth_price" DOUBLE PRECISION GENERATED ALWAYS AS ("total_eth_price" / NULLIF("total_eth_price_count", 0)) STORED;

COMMIT;
