/*
  Warnings:

  - You are about to drop the column `category` on the `transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_from_id_category_fkey";

-- DropForeignKey
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_to_id_category_fkey";

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "category";
