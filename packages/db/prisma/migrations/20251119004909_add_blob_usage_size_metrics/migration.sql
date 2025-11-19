-- AlterTable
ALTER TABLE "daily_stats" ADD COLUMN     "avg_blob_usage_size" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_usage_size" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "overall_stats" ADD COLUMN     "avg_blob_usage_size" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_blob_usage_size" BIGINT NOT NULL DEFAULT 0;
