/*
  Warnings:

  - You are about to drop the `address_category_info` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "address_category_info" DROP CONSTRAINT "address_category_info_address_fkey";

-- DropTable
DROP TABLE "address_category_info";

-- CreateIndex
CREATE INDEX "address_first_block_number_as_receiver_idx" ON "address"("first_block_number_as_receiver");

-- CreateIndex
CREATE INDEX "address_first_block_number_as_sender_idx" ON "address"("first_block_number_as_sender");
