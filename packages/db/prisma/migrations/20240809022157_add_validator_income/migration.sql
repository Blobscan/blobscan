-- CreateTable
CREATE TABLE "validator_income" (
    "id" SERIAL NOT NULL,
    "epoch_idx" BIGINT NOT NULL,
    "income_wei" BIGINT NOT NULL,
    "validator_public_key" CHAR(100) NOT NULL,
    "validator_idx" INTEGER NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validator_income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_validator_epoch_income" ON "validator_income"("validator_public_key", "epoch_idx" ASC);
