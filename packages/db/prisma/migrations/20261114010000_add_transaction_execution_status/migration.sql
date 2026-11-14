CREATE TYPE "execution_status" AS ENUM ('success', 'failed');

ALTER TABLE "transaction" ADD COLUMN "execution_status" "execution_status";
