/*
  Warnings:

  - You are about to drop the column `rollup` on the `transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "rollup";

-- DropEnum
DROP TYPE "rollup";
