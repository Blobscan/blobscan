-- AlterTable
ALTER TABLE "transaction_daily_stats" ADD COLUMN     "avg_blob_as_calldata_max_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avg_blob_max_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_as_calldata_max_fees" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_max_fees" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_max_gas_fees" DECIMAL(100,0) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "transaction_overall_stats" ADD COLUMN     "avg_blob_as_calldata_max_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "avg_blob_max_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_as_calldata_max_fees" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_max_fees" DECIMAL(100,0) NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_max_gas_fees" DECIMAL(100,0) NOT NULL DEFAULT 0;
