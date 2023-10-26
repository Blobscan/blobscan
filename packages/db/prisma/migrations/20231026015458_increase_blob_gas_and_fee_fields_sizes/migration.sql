-- AlterTable
ALTER TABLE "block" ALTER COLUMN "blob_gas_used" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "excess_blob_gas" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "blob_as_calldata_gas_used" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "blob_gas_price" SET DATA TYPE DECIMAL(100,0);

-- AlterTable
ALTER TABLE "block_daily_stats" ALTER COLUMN "total_blob_as_calldata_fee" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "total_blob_as_calldata_gas_used" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "total_blob_fee" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "total_blob_gas_used" SET DATA TYPE DECIMAL(100,0);

-- AlterTable
ALTER TABLE "block_overall_stats" ALTER COLUMN "total_blob_as_calldata_fee" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "total_blob_as_calldata_gas_used" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "total_blob_fee" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "total_blob_gas_used" SET DATA TYPE DECIMAL(100,0);

-- AlterTable
ALTER TABLE "transaction" ALTER COLUMN "max_fee_per_blob_gas" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "gas_price" SET DATA TYPE DECIMAL(100,0),
ALTER COLUMN "blob_as_calldata_gas_used" SET DATA TYPE DECIMAL(100,0);
