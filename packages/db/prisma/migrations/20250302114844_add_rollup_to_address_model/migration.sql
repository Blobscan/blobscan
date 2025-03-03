-- AlterTable
ALTER TABLE "address" ADD COLUMN     "rollup" "rollup";

-- CreateIndex
CREATE INDEX "address_address_rollup_idx" ON "address"("address", "rollup");

-- CreateIndex
CREATE INDEX "address_rollup_idx" ON "address"("rollup");
