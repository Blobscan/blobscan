/*
  Warnings:

  - Added the required column `avg_blob_as_calldata_fee` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avg_blob_fee` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avg_blob_gas_price` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_as_calldata_fee` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_as_calldata_gas_used` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_fee` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_gas_used` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avg_blob_as_calldata_fee` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avg_blob_fee` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avg_blob_gas_price` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_as_calldata_fee` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_as_calldata_gas_used` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_fee` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_gas_used` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avg_max_blob_gas_fee` to the `transaction_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `avg_max_blob_gas_fee` to the `transaction_overall_stats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "block_daily_stats" ADD COLUMN     "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "avg_blob_fee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "avg_blob_gas_price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_blob_as_calldata_fee" BIGINT NOT NULL,
ADD COLUMN     "total_blob_as_calldata_gas_used" BIGINT NOT NULL,
ADD COLUMN     "total_blob_fee" BIGINT NOT NULL,
ADD COLUMN     "total_blob_gas_used" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "block_overall_stats" ADD COLUMN     "avg_blob_as_calldata_fee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "avg_blob_fee" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "avg_blob_gas_price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_blob_as_calldata_fee" BIGINT NOT NULL,
ADD COLUMN     "total_blob_as_calldata_gas_used" BIGINT NOT NULL,
ADD COLUMN     "total_blob_fee" BIGINT NOT NULL,
ADD COLUMN     "total_blob_gas_used" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "transaction_daily_stats" ADD COLUMN     "avg_max_blob_gas_fee" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "transaction_overall_stats" ADD COLUMN     "avg_max_blob_gas_fee" DOUBLE PRECISION NOT NULL;
