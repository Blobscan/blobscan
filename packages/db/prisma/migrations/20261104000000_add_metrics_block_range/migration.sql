-- Add the block range to the metrics tables: the first and the last block
-- number, slot, epoch and timestamp of the blocks of the period. For
-- all_time_metrics, the period is all the indexed blocks. Each row gets the
-- range of its own transactions, thus a category or a rollup row can have a
-- smaller range than the global row. The columns are NULL until Dagster
-- aggregates their partitions again. The epoch columns are NULL when the
-- blocks have no epoch.

-- all_time_metrics
ALTER TABLE "all_time_metrics"
    ADD COLUMN "first_block_number" INTEGER,
    ADD COLUMN "last_block_number" INTEGER,
    ADD COLUMN "first_slot" INTEGER,
    ADD COLUMN "last_slot" INTEGER,
    ADD COLUMN "first_epoch" INTEGER,
    ADD COLUMN "last_epoch" INTEGER,
    ADD COLUMN "first_block_timestamp" TIMESTAMP(3),
    ADD COLUMN "last_block_timestamp" TIMESTAMP(3);

-- hourly_metrics
ALTER TABLE "hourly_metrics"
    ADD COLUMN "first_block_number" INTEGER,
    ADD COLUMN "last_block_number" INTEGER,
    ADD COLUMN "first_slot" INTEGER,
    ADD COLUMN "last_slot" INTEGER,
    ADD COLUMN "first_epoch" INTEGER,
    ADD COLUMN "last_epoch" INTEGER,
    ADD COLUMN "first_block_timestamp" TIMESTAMP(3),
    ADD COLUMN "last_block_timestamp" TIMESTAMP(3);

-- daily_metrics
ALTER TABLE "daily_metrics"
    ADD COLUMN "first_block_number" INTEGER,
    ADD COLUMN "last_block_number" INTEGER,
    ADD COLUMN "first_slot" INTEGER,
    ADD COLUMN "last_slot" INTEGER,
    ADD COLUMN "first_epoch" INTEGER,
    ADD COLUMN "last_epoch" INTEGER,
    ADD COLUMN "first_block_timestamp" TIMESTAMP(3),
    ADD COLUMN "last_block_timestamp" TIMESTAMP(3);

-- weekly_metrics
ALTER TABLE "weekly_metrics"
    ADD COLUMN "first_block_number" INTEGER,
    ADD COLUMN "last_block_number" INTEGER,
    ADD COLUMN "first_slot" INTEGER,
    ADD COLUMN "last_slot" INTEGER,
    ADD COLUMN "first_epoch" INTEGER,
    ADD COLUMN "last_epoch" INTEGER,
    ADD COLUMN "first_block_timestamp" TIMESTAMP(3),
    ADD COLUMN "last_block_timestamp" TIMESTAMP(3);

-- monthly_metrics
ALTER TABLE "monthly_metrics"
    ADD COLUMN "first_block_number" INTEGER,
    ADD COLUMN "last_block_number" INTEGER,
    ADD COLUMN "first_slot" INTEGER,
    ADD COLUMN "last_slot" INTEGER,
    ADD COLUMN "first_epoch" INTEGER,
    ADD COLUMN "last_epoch" INTEGER,
    ADD COLUMN "first_block_timestamp" TIMESTAMP(3),
    ADD COLUMN "last_block_timestamp" TIMESTAMP(3);

-- yearly_metrics
ALTER TABLE "yearly_metrics"
    ADD COLUMN "first_block_number" INTEGER,
    ADD COLUMN "last_block_number" INTEGER,
    ADD COLUMN "first_slot" INTEGER,
    ADD COLUMN "last_slot" INTEGER,
    ADD COLUMN "first_epoch" INTEGER,
    ADD COLUMN "last_epoch" INTEGER,
    ADD COLUMN "first_block_timestamp" TIMESTAMP(3),
    ADD COLUMN "last_block_timestamp" TIMESTAMP(3);
