-- CreateTable
CREATE TABLE "validator_withdrawal" (
    "id" BIGSERIAL NOT NULL,
    "validator_idx" BIGINT,
    "epoch_idx_gathered" BIGINT,
    "withdrawal_amount" BIGINT NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validator_withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uni_validator_withdrawal_validator_idx_key" ON "validator_withdrawal"("validator_idx");