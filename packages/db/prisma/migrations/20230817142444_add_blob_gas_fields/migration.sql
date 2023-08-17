/*
  Warnings:

  - Added the required column `blobAsCalldataGasUsed` to the `Block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blobGasUsed` to the `Block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `excessBlobGas` to the `Block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blobAsCalldataGasUsed` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blobGasPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gasPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxFeePerBlobGas` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `toId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_toId_fkey";

-- AlterTable
ALTER TABLE "Block" ADD COLUMN     "blobAsCalldataGasUsed" BIGINT NOT NULL,
ADD COLUMN     "blobGasUsed" BIGINT NOT NULL,
ADD COLUMN     "excessBlobGas" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "blobAsCalldataGasUsed" BIGINT NOT NULL,
ADD COLUMN     "blobGasPrice" BIGINT NOT NULL,
ADD COLUMN     "gasPrice" BIGINT NOT NULL,
ADD COLUMN     "maxFeePerBlobGas" BIGINT NOT NULL,
ALTER COLUMN "toId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Address"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
