/*
  Warnings:

  - You are about to drop the column `from` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `to` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `fromId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "from",
DROP COLUMN "to",
ADD COLUMN     "fromId" TEXT NOT NULL,
ADD COLUMN     "toId" TEXT;

-- CreateTable
CREATE TABLE "Address" (
    "address" TEXT NOT NULL,
    "isSender" BOOLEAN NOT NULL,
    "isReceiver" BOOLEAN NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("address")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Address"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Address"("address") ON DELETE SET NULL ON UPDATE CASCADE;
