-- Add the time of the last update to the metrics tables. Dagster sets it each
-- time it aggregates a period. The API gives it for the current period, which
-- Dagster updates during the period. The existing rows get the time of this
-- migration. all_time_metrics already has this column.

-- hourly_metrics
ALTER TABLE "hourly_metrics"
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- daily_metrics
ALTER TABLE "daily_metrics"
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- weekly_metrics
ALTER TABLE "weekly_metrics"
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- monthly_metrics
ALTER TABLE "monthly_metrics"
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- yearly_metrics
ALTER TABLE "yearly_metrics"
    ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
