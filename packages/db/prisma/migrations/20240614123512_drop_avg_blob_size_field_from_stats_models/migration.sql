/*
  Warnings:

  - You are about to drop the column `avg_blob_size` on the `blob_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `avg_blob_size` on the `blob_overall_stats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blob_daily_stats" DROP COLUMN "avg_blob_size";

-- AlterTable
ALTER TABLE "blob_overall_stats" DROP COLUMN "avg_blob_size";
