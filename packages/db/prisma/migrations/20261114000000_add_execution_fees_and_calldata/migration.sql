ALTER TABLE "transaction"
  ADD COLUMN "gas_used" DECIMAL(100, 0),
  ADD COLUMN "effective_gas_price" DECIMAL(100, 0),
  ADD COLUMN "input" TEXT;

ALTER TABLE "block" ADD COLUMN "base_fee_per_gas" DECIMAL(100, 0);
