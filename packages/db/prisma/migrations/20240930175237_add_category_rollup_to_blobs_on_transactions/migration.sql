-- AlterTable
ALTER TABLE "blobs_on_transactions" ADD COLUMN     "category" "category" NOT NULL DEFAULT 'other',
ADD COLUMN     "rollup" "rollup";
