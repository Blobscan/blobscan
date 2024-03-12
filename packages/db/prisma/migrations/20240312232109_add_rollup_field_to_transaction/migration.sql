-- CreateEnum
CREATE TYPE "rollup" AS ENUM ('arbitrum', 'base', 'optimism', 'scroll', 'starknet', 'zksync');

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "rollup" "rollup";
