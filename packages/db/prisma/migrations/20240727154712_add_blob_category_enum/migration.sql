-- CreateEnum
CREATE TYPE "category" AS ENUM ('arbitrum', 'base', 'blast', 'boba', 'camp', 'kroma', 'linea', 'metal', 'optimism', 'optopia', 'paradex', 'pgn', 'scroll', 'starknet', 'taiko', 'zksync', 'mode', 'zora');

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "category" "category";
