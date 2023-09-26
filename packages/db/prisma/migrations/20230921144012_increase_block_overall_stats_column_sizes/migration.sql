-- AlterTable
ALTER TABLE "block_overall_stats" ALTER COLUMN "total_blob_as_calldata_fee" SET DATA TYPE DECIMAL(50,0),
ALTER COLUMN "total_blob_as_calldata_gas_used" SET DATA TYPE DECIMAL(50,0),
ALTER COLUMN "total_blob_fee" SET DATA TYPE DECIMAL(50,0),
ALTER COLUMN "total_blob_gas_used" SET DATA TYPE DECIMAL(50,0);
