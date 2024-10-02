/*
  Warnings:

  - The primary key for the `address_category_info` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[address,category]` on the table `address_category_info` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "address_category_info" DROP CONSTRAINT "address_category_info_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "category" DROP DEFAULT,
ADD CONSTRAINT "address_category_info_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "address_category_info_address_category_key" ON "address_category_info"("address", "category") NULLS NOT DISTINCT;
