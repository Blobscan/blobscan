-- CreateTable
CREATE TABLE "all_time_metrics" (
    "id" SERIAL NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avg_blob_base_fee" DOUBLE PRECISION,
    "avg_blob_gas_price" DOUBLE PRECISION,
    "total_blob_base_fee" DECIMAL(65,30),
    "total_blob_gas_price" DECIMAL(100,0),
    "total_blocks" INTEGER,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION,
    "avg_blob_max_fee" DOUBLE PRECISION,
    "avg_blob_usage_size" DOUBLE PRECISION,
    "avg_max_blob_gas_fee" DOUBLE PRECISION,
    "total_blob_as_calldata_fee" DECIMAL(100,0),
    "total_blob_as_calldata_gas_used" DECIMAL(100,0),
    "total_blob_as_calldata_max_fee" DECIMAL(100,0),
    "total_blob_gas_used" DECIMAL(100,0),
    "total_blob_max_fee" DECIMAL(100,0),
    "total_blob_max_gas_fee" DECIMAL(100,0),
    "total_blobs" INTEGER,
    "total_blob_size" BIGINT,
    "total_blob_usage_size" BIGINT,
    "total_transactions" INTEGER,
    "total_unique_blobs" INTEGER,
    "total_unique_receivers" INTEGER,
    "total_unique_senders" INTEGER,
    "total_max_blob_gas_fee" DECIMAL(100,0),

    CONSTRAINT "all_time_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_metrics" (
    "id" SERIAL NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION,
    "avg_blob_gas_price" DOUBLE PRECISION,
    "total_blob_base_fee" DECIMAL(65,30),
    "total_blob_gas_price" DECIMAL(100,0),
    "total_blocks" INTEGER,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION,
    "avg_blob_max_fee" DOUBLE PRECISION,
    "avg_blob_usage_size" DOUBLE PRECISION,
    "avg_max_blob_gas_fee" DOUBLE PRECISION,
    "total_blob_as_calldata_fee" DECIMAL(100,0),
    "total_blob_as_calldata_gas_used" DECIMAL(100,0),
    "total_blob_as_calldata_max_fee" DECIMAL(100,0),
    "total_blob_gas_used" DECIMAL(100,0),
    "total_blob_max_fee" DECIMAL(100,0),
    "total_blob_max_gas_fee" DECIMAL(100,0),
    "total_blobs" INTEGER,
    "total_blob_size" BIGINT,
    "total_blob_usage_size" BIGINT,
    "total_transactions" INTEGER,
    "total_unique_blobs" INTEGER,
    "total_unique_receivers" INTEGER,
    "total_unique_senders" INTEGER,
    "total_max_blob_gas_fee" DECIMAL(100,0),

    CONSTRAINT "hourly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" SERIAL NOT NULL,
    "period_start" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION,
    "avg_blob_gas_price" DOUBLE PRECISION,
    "total_blob_base_fee" DECIMAL(65,30),
    "total_blob_gas_price" DECIMAL(100,0),
    "total_blocks" INTEGER,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION,
    "avg_blob_max_fee" DOUBLE PRECISION,
    "avg_blob_usage_size" DOUBLE PRECISION,
    "avg_max_blob_gas_fee" DOUBLE PRECISION,
    "total_blob_as_calldata_fee" DECIMAL(100,0),
    "total_blob_as_calldata_gas_used" DECIMAL(100,0),
    "total_blob_as_calldata_max_fee" DECIMAL(100,0),
    "total_blob_gas_used" DECIMAL(100,0),
    "total_blob_max_fee" DECIMAL(100,0),
    "total_blob_max_gas_fee" DECIMAL(100,0),
    "total_blobs" INTEGER,
    "total_blob_size" BIGINT,
    "total_blob_usage_size" BIGINT,
    "total_transactions" INTEGER,
    "total_unique_blobs" INTEGER,
    "total_unique_receivers" INTEGER,
    "total_unique_senders" INTEGER,
    "total_max_blob_gas_fee" DECIMAL(100,0),

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_metrics" (
    "id" SERIAL NOT NULL,
    "period_start" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION,
    "avg_blob_gas_price" DOUBLE PRECISION,
    "total_blob_base_fee" DECIMAL(65,30),
    "total_blob_gas_price" DECIMAL(100,0),
    "total_blocks" INTEGER,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION,
    "avg_blob_max_fee" DOUBLE PRECISION,
    "avg_blob_usage_size" DOUBLE PRECISION,
    "avg_max_blob_gas_fee" DOUBLE PRECISION,
    "total_blob_as_calldata_fee" DECIMAL(100,0),
    "total_blob_as_calldata_gas_used" DECIMAL(100,0),
    "total_blob_as_calldata_max_fee" DECIMAL(100,0),
    "total_blob_gas_used" DECIMAL(100,0),
    "total_blob_max_fee" DECIMAL(100,0),
    "total_blob_max_gas_fee" DECIMAL(100,0),
    "total_blobs" INTEGER,
    "total_blob_size" BIGINT,
    "total_blob_usage_size" BIGINT,
    "total_transactions" INTEGER,
    "total_unique_blobs" INTEGER,
    "total_unique_receivers" INTEGER,
    "total_unique_senders" INTEGER,
    "total_max_blob_gas_fee" DECIMAL(100,0),

    CONSTRAINT "weekly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_metrics" (
    "id" SERIAL NOT NULL,
    "period_start" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION,
    "avg_blob_gas_price" DOUBLE PRECISION,
    "total_blob_base_fee" DECIMAL(65,30),
    "total_blob_gas_price" DECIMAL(100,0),
    "total_blocks" INTEGER,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION,
    "avg_blob_max_fee" DOUBLE PRECISION,
    "avg_blob_usage_size" DOUBLE PRECISION,
    "avg_max_blob_gas_fee" DOUBLE PRECISION,
    "total_blob_as_calldata_fee" DECIMAL(100,0),
    "total_blob_as_calldata_gas_used" DECIMAL(100,0),
    "total_blob_as_calldata_max_fee" DECIMAL(100,0),
    "total_blob_gas_used" DECIMAL(100,0),
    "total_blob_max_fee" DECIMAL(100,0),
    "total_blob_max_gas_fee" DECIMAL(100,0),
    "total_blobs" INTEGER,
    "total_blob_size" BIGINT,
    "total_blob_usage_size" BIGINT,
    "total_transactions" INTEGER,
    "total_unique_blobs" INTEGER,
    "total_unique_receivers" INTEGER,
    "total_unique_senders" INTEGER,
    "total_max_blob_gas_fee" DECIMAL(100,0),

    CONSTRAINT "monthly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yearly_metrics" (
    "id" SERIAL NOT NULL,
    "period_start" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION,
    "avg_blob_gas_price" DOUBLE PRECISION,
    "total_blob_base_fee" DECIMAL(65,30),
    "total_blob_gas_price" DECIMAL(100,0),
    "total_blocks" INTEGER,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION,
    "avg_blob_max_fee" DOUBLE PRECISION,
    "avg_blob_usage_size" DOUBLE PRECISION,
    "avg_max_blob_gas_fee" DOUBLE PRECISION,
    "total_blob_as_calldata_fee" DECIMAL(100,0),
    "total_blob_as_calldata_gas_used" DECIMAL(100,0),
    "total_blob_as_calldata_max_fee" DECIMAL(100,0),
    "total_blob_gas_used" DECIMAL(100,0),
    "total_blob_max_fee" DECIMAL(100,0),
    "total_blob_max_gas_fee" DECIMAL(100,0),
    "total_blobs" INTEGER,
    "total_blob_size" BIGINT,
    "total_blob_usage_size" BIGINT,
    "total_transactions" INTEGER,
    "total_unique_blobs" INTEGER,
    "total_unique_receivers" INTEGER,
    "total_unique_senders" INTEGER,
    "total_max_blob_gas_fee" DECIMAL(100,0),

    CONSTRAINT "yearly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "all_time_metrics_category_rollup_key" ON "all_time_metrics"("category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_metrics_period_start_category_rollup_key" ON "hourly_metrics"("period_start", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_period_start_category_rollup_key" ON "daily_metrics"("period_start", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_metrics_period_start_category_rollup_key" ON "weekly_metrics"("period_start", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_metrics_period_start_category_rollup_key" ON "monthly_metrics"("period_start", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "yearly_metrics_period_start_category_rollup_key" ON "yearly_metrics"("period_start", "category", "rollup");
