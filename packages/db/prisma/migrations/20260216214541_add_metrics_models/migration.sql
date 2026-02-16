-- CreateTable
CREATE TABLE "all_time_metrics" (
    "id" SERIAL NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avg_blob_base_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_gas_price" DOUBLE PRECISION NOT NULL,
    "total_blob_gas_price" DECIMAL(100,0) NOT NULL,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_usage_size" DOUBLE PRECISION NOT NULL,
    "avg_max_blob_gas_fee" DOUBLE PRECISION NOT NULL,
    "total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_max_gas_fees" DECIMAL(100,0) NOT NULL,
    "total_blobs" INTEGER NOT NULL,
    "total_blob_size" BIGINT NOT NULL,
    "total_blob_usage_size" BIGINT NOT NULL,
    "total_blocks" INTEGER NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_unique_blobs" INTEGER NOT NULL,
    "total_unique_receivers" INTEGER NOT NULL,
    "total_unique_senders" INTEGER NOT NULL,

    CONSTRAINT "all_time_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hourly_metrics" (
    "id" SERIAL NOT NULL,
    "periodStart" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_gas_price" DOUBLE PRECISION NOT NULL,
    "total_blob_gas_price" DECIMAL(100,0) NOT NULL,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_usage_size" DOUBLE PRECISION NOT NULL,
    "avg_max_blob_gas_fee" DOUBLE PRECISION NOT NULL,
    "total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_max_gas_fees" DECIMAL(100,0) NOT NULL,
    "total_blobs" INTEGER NOT NULL,
    "total_blob_size" BIGINT NOT NULL,
    "total_blob_usage_size" BIGINT NOT NULL,
    "total_blocks" INTEGER NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_unique_blobs" INTEGER NOT NULL,
    "total_unique_receivers" INTEGER NOT NULL,
    "total_unique_senders" INTEGER NOT NULL,

    CONSTRAINT "hourly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_metrics" (
    "id" SERIAL NOT NULL,
    "periodStart" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_gas_price" DOUBLE PRECISION NOT NULL,
    "total_blob_gas_price" DECIMAL(100,0) NOT NULL,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_usage_size" DOUBLE PRECISION NOT NULL,
    "avg_max_blob_gas_fee" DOUBLE PRECISION NOT NULL,
    "total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_max_gas_fees" DECIMAL(100,0) NOT NULL,
    "total_blobs" INTEGER NOT NULL,
    "total_blob_size" BIGINT NOT NULL,
    "total_blob_usage_size" BIGINT NOT NULL,
    "total_blocks" INTEGER NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_unique_blobs" INTEGER NOT NULL,
    "total_unique_receivers" INTEGER NOT NULL,
    "total_unique_senders" INTEGER NOT NULL,

    CONSTRAINT "weekly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_metrics" (
    "id" SERIAL NOT NULL,
    "periodStart" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_gas_price" DOUBLE PRECISION NOT NULL,
    "total_blob_gas_price" DECIMAL(100,0) NOT NULL,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_usage_size" DOUBLE PRECISION NOT NULL,
    "avg_max_blob_gas_fee" DOUBLE PRECISION NOT NULL,
    "total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_max_gas_fees" DECIMAL(100,0) NOT NULL,
    "total_blobs" INTEGER NOT NULL,
    "total_blob_size" BIGINT NOT NULL,
    "total_blob_usage_size" BIGINT NOT NULL,
    "total_blocks" INTEGER NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_unique_blobs" INTEGER NOT NULL,
    "total_unique_receivers" INTEGER NOT NULL,
    "total_unique_senders" INTEGER NOT NULL,

    CONSTRAINT "monthly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yearly_metrics" (
    "id" SERIAL NOT NULL,
    "periodStart" DATE NOT NULL,
    "category" "category",
    "rollup" "rollup",
    "avg_blob_base_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_gas_price" DOUBLE PRECISION NOT NULL,
    "total_blob_gas_price" DECIMAL(100,0) NOT NULL,
    "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_as_calldata_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_max_fee" DOUBLE PRECISION NOT NULL,
    "avg_blob_usage_size" DOUBLE PRECISION NOT NULL,
    "avg_max_blob_gas_fee" DOUBLE PRECISION NOT NULL,
    "total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_as_calldata_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_fee" DECIMAL(100,0) NOT NULL,
    "total_blob_gas_used" DECIMAL(100,0) NOT NULL,
    "total_blob_max_fees" DECIMAL(100,0) NOT NULL,
    "total_blob_max_gas_fees" DECIMAL(100,0) NOT NULL,
    "total_blobs" INTEGER NOT NULL,
    "total_blob_size" BIGINT NOT NULL,
    "total_blob_usage_size" BIGINT NOT NULL,
    "total_blocks" INTEGER NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_unique_blobs" INTEGER NOT NULL,
    "total_unique_receivers" INTEGER NOT NULL,
    "total_unique_senders" INTEGER NOT NULL,

    CONSTRAINT "yearly_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "all_time_metrics_category_rollup_key" ON "all_time_metrics"("category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "hourly_metrics_periodStart_category_rollup_key" ON "hourly_metrics"("periodStart", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_metrics_periodStart_category_rollup_key" ON "weekly_metrics"("periodStart", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_metrics_periodStart_category_rollup_key" ON "monthly_metrics"("periodStart", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "yearly_metrics_periodStart_category_rollup_key" ON "yearly_metrics"("periodStart", "category", "rollup");
