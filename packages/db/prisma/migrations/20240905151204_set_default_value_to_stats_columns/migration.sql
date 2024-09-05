-- AlterTable
ALTER TABLE "blob_daily_stats" ALTER COLUMN "total_blobs" SET DEFAULT 0,
ALTER COLUMN "total_unique_blobs" SET DEFAULT 0,
ALTER COLUMN "total_blob_size" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "blob_overall_stats" ALTER COLUMN "total_blobs" SET DEFAULT 0,
ALTER COLUMN "total_unique_blobs" SET DEFAULT 0,
ALTER COLUMN "total_blob_size" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "block_daily_stats" ALTER COLUMN "total_blocks" SET DEFAULT 0,
ALTER COLUMN "avg_blob_as_calldata_fee" SET DEFAULT 0,
ALTER COLUMN "avg_blob_fee" SET DEFAULT 0,
ALTER COLUMN "avg_blob_gas_price" SET DEFAULT 0,
ALTER COLUMN "total_blob_as_calldata_fee" SET DEFAULT 0,
ALTER COLUMN "total_blob_as_calldata_gas_used" SET DEFAULT 0,
ALTER COLUMN "total_blob_fee" SET DEFAULT 0,
ALTER COLUMN "total_blob_gas_used" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "block_overall_stats" ALTER COLUMN "total_blocks" SET DEFAULT 0,
ALTER COLUMN "avg_blob_as_calldata_fee" SET DEFAULT 0,
ALTER COLUMN "avg_blob_fee" SET DEFAULT 0,
ALTER COLUMN "avg_blob_gas_price" SET DEFAULT 0,
ALTER COLUMN "total_blob_as_calldata_fee" SET DEFAULT 0,
ALTER COLUMN "total_blob_as_calldata_gas_used" SET DEFAULT 0,
ALTER COLUMN "total_blob_fee" SET DEFAULT 0,
ALTER COLUMN "total_blob_gas_used" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "transaction_daily_stats" ADD COLUMN     "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avg_blob_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avg_blob_gas_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_as_calldata_gas_used" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_gas_used" DECIMAL(100,0) NOT NULL DEFAULT 0,
ALTER COLUMN "total_transactions" SET DEFAULT 0,
ALTER COLUMN "total_unique_senders" SET DEFAULT 0,
ALTER COLUMN "total_unique_receivers" SET DEFAULT 0,
ALTER COLUMN "avg_max_blob_gas_fee" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "transaction_overall_stats" ADD COLUMN     "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avg_blob_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avg_blob_gas_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_as_calldata_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_as_calldata_gas_used" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_fee" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_gas_used" DECIMAL(100,0) NOT NULL DEFAULT 0,
ALTER COLUMN "total_transactions" SET DEFAULT 0,
ALTER COLUMN "total_unique_receivers" SET DEFAULT 0,
ALTER COLUMN "total_unique_senders" SET DEFAULT 0,
ALTER COLUMN "avg_max_blob_gas_fee" SET DEFAULT 0;
