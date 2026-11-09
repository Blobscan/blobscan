-- Add the metrics of each address: hourly (kept 30 days), daily, weekly,
-- monthly, yearly and all time (closed days only). Dagster writes these
-- tables. The weekly and monthly rows come from the daily rows, the yearly
-- rows come from the monthly rows, and the all-time rows come from the closed
-- years, months and days, as for the network metrics. See
-- docs/specs/address-metrics.md.
-- CreateTable
CREATE TABLE "address_hourly_metrics" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee_usd" DOUBLE PRECISION,
    "sent_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "sent_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_first_block_timestamp" TIMESTAMP(3),
    "sent_last_block_timestamp" TIMESTAMP(3),
    "received_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "received_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "received_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_base_fee_usd" DOUBLE PRECISION,
    "received_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "received_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_first_block_timestamp" TIMESTAMP(3),
    "received_last_block_timestamp" TIMESTAMP(3),
    "self_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "self_total_blobs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "address_hourly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_daily_metrics" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee_usd" DOUBLE PRECISION,
    "sent_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "sent_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_first_block_timestamp" TIMESTAMP(3),
    "sent_last_block_timestamp" TIMESTAMP(3),
    "received_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "received_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "received_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_base_fee_usd" DOUBLE PRECISION,
    "received_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "received_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_first_block_timestamp" TIMESTAMP(3),
    "received_last_block_timestamp" TIMESTAMP(3),
    "self_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "self_total_blobs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "address_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_weekly_metrics" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee_usd" DOUBLE PRECISION,
    "sent_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "sent_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_first_block_timestamp" TIMESTAMP(3),
    "sent_last_block_timestamp" TIMESTAMP(3),
    "received_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "received_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "received_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_base_fee_usd" DOUBLE PRECISION,
    "received_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "received_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_first_block_timestamp" TIMESTAMP(3),
    "received_last_block_timestamp" TIMESTAMP(3),
    "self_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "self_total_blobs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "address_weekly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_monthly_metrics" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee_usd" DOUBLE PRECISION,
    "sent_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "sent_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_first_block_timestamp" TIMESTAMP(3),
    "sent_last_block_timestamp" TIMESTAMP(3),
    "received_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "received_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "received_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_base_fee_usd" DOUBLE PRECISION,
    "received_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "received_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_first_block_timestamp" TIMESTAMP(3),
    "received_last_block_timestamp" TIMESTAMP(3),
    "self_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "self_total_blobs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "address_monthly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_yearly_metrics" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee_usd" DOUBLE PRECISION,
    "sent_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "sent_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_first_block_timestamp" TIMESTAMP(3),
    "sent_last_block_timestamp" TIMESTAMP(3),
    "received_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "received_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "received_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_base_fee_usd" DOUBLE PRECISION,
    "received_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "received_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_first_block_timestamp" TIMESTAMP(3),
    "received_last_block_timestamp" TIMESTAMP(3),
    "self_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "self_total_blobs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "address_yearly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address_all_time_metrics" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "aggregated_until" DATE NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "sent_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "sent_total_blob_base_fee_usd" DOUBLE PRECISION,
    "sent_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "sent_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "sent_first_block_timestamp" TIMESTAMP(3),
    "sent_last_block_timestamp" TIMESTAMP(3),
    "received_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_total_blobs" INTEGER NOT NULL DEFAULT 0,
    "received_total_blob_usage_size" BIGINT NOT NULL DEFAULT 0,
    "received_total_blob_base_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
    "received_total_blob_base_fee_usd" DOUBLE PRECISION,
    "received_total_blob_as_calldata_fee_usd" DOUBLE PRECISION,
    "received_total_usd_priced_transactions" INTEGER NOT NULL DEFAULT 0,
    "received_first_block_timestamp" TIMESTAMP(3),
    "received_last_block_timestamp" TIMESTAMP(3),
    "self_total_transactions" INTEGER NOT NULL DEFAULT 0,
    "self_total_blobs" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "address_all_time_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "address_hourly_metrics_period_start_idx" ON "address_hourly_metrics"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "address_hourly_metrics_address_period_start_key" ON "address_hourly_metrics"("address", "period_start");

-- CreateIndex
CREATE INDEX "address_daily_metrics_period_start_idx" ON "address_daily_metrics"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "address_daily_metrics_address_period_start_key" ON "address_daily_metrics"("address", "period_start");

-- CreateIndex
CREATE INDEX "address_weekly_metrics_period_start_idx" ON "address_weekly_metrics"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "address_weekly_metrics_address_period_start_key" ON "address_weekly_metrics"("address", "period_start");

-- CreateIndex
CREATE INDEX "address_monthly_metrics_period_start_idx" ON "address_monthly_metrics"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "address_monthly_metrics_address_period_start_key" ON "address_monthly_metrics"("address", "period_start");

-- CreateIndex
CREATE INDEX "address_yearly_metrics_period_start_idx" ON "address_yearly_metrics"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "address_yearly_metrics_address_period_start_key" ON "address_yearly_metrics"("address", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "address_all_time_metrics_address_key" ON "address_all_time_metrics"("address");
