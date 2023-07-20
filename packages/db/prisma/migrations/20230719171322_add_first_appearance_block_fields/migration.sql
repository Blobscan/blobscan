/*
  Warnings:

  - You are about to drop the column `isReceiver` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `isSender` on the `Address` table. All the data in the column will be lost.
  - Added the required column `firstBlockNumber` to the `Blob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "isReceiver",
DROP COLUMN "isSender",
ADD COLUMN     "firstBlockNumberAsReceiver" INTEGER,
ADD COLUMN     "firstBlockNumberAsSender" INTEGER;

-- AlterTable
ALTER TABLE "Blob" ADD COLUMN     "firstBlockNumber" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_firstBlockNumberAsSender_fkey" FOREIGN KEY ("firstBlockNumberAsSender") REFERENCES "Block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_firstBlockNumberAsReceiver_fkey" FOREIGN KEY ("firstBlockNumberAsReceiver") REFERENCES "Block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blob" ADD CONSTRAINT "Blob_firstBlockNumber_fkey" FOREIGN KEY ("firstBlockNumber") REFERENCES "Block"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
