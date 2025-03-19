-- CreateTable
CREATE TABLE "validator_income" (
    "id" BIGSERIAL NOT NULL,
    "epoch_idx" BIGINT NOT NULL,
    "income_gwei" BIGINT NOT NULL,
    "validator_public_key" CHAR(100) NOT NULL,
    "validator_idx" BIGINT NOT NULL,
    "attestation_source_reward" BIGINT NOT NULL,
    "attestation_source_penalty" BIGINT NOT NULL,
    "attestation_target_reward" BIGINT NOT NULL,
    "attestation_target_penalty" BIGINT NOT NULL,
    "attestation_head_reward" BIGINT NOT NULL,
    "proposer_attestation_inclusion_reward" BIGINT NOT NULL,
    "proposer_slashing_inclusion_reward" BIGINT NOT NULL,
    "proposer_sync_inclusion_reward" BIGINT NOT NULL,
    "slashing_reward" BIGINT NOT NULL,
    "slashing_penalty" BIGINT NOT NULL,
    "sync_committee_reward" BIGINT NOT NULL,
    "sync_committee_penalty" BIGINT NOT NULL,
    "finality_delay_penalty" BIGINT NOT NULL,
    "tx_fee_reward_wei" BIGINT NOT NULL,
    "withdrawal_amount" BIGINT NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validator_income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uni_validaotr_epoch_income" ON "validator_income"("validator_idx", "epoch_idx");
CREATE INDEX "idx_inserted_at" ON "validator_income"("inserted_at");