-- DropForeignKey
ALTER TABLE "address" DROP CONSTRAINT "address_first_block_number_as_receiver_fkey";

-- DropForeignKey
ALTER TABLE "address" DROP CONSTRAINT "address_first_block_number_as_sender_fkey";

-- DropForeignKey
ALTER TABLE "blob" DROP CONSTRAINT "blob_first_block_number_fkey";

-- DropIndex
DROP INDEX "block_number_key";
