-- CreateEnum
CREATE TYPE "category" AS ENUM ('other', 'rollup');

-- AlterTable
ALTER TABLE "blobs_on_transactions" ADD COLUMN     "category" "category" NOT NULL DEFAULT 'other';

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "category" "category" NOT NULL DEFAULT 'other';
