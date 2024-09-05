/*
  Warnings:

  - The primary key for the `transaction_daily_stats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[day,category,rollup]` on the table `blob_daily_stats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[category,rollup]` on the table `blob_overall_stats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[day,category,rollup]` on the table `transaction_daily_stats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[category,rollup]` on the table `transaction_overall_stats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "blob_daily_stats" ADD COLUMN     "category" "category",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "rollup" "rollup";

-- AlterTable
ALTER TABLE "blob_overall_stats" ADD COLUMN     "category" "category",
ADD COLUMN     "rollup" "rollup";

-- AlterTable
ALTER TABLE "transaction_daily_stats" DROP CONSTRAINT "transaction_daily_stats_pkey",
ADD COLUMN     "category" "category",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "rollup" "rollup",
ADD CONSTRAINT "transaction_daily_stats_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "transaction_overall_stats" ADD COLUMN     "category" "category",
ADD COLUMN     "rollup" "rollup";

-- CreateIndex
CREATE UNIQUE INDEX "blob_daily_stats_day_category_rollup_key" ON "blob_daily_stats"("day", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "blob_overall_stats_category_rollup_key" ON "blob_overall_stats"("category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_daily_stats_day_category_rollup_key" ON "transaction_daily_stats"("day", "category", "rollup");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_overall_stats_category_rollup_key" ON "transaction_overall_stats"("category", "rollup");
