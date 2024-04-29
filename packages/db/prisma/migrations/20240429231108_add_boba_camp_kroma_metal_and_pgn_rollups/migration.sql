-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "rollup" ADD VALUE 'boba';
ALTER TYPE "rollup" ADD VALUE 'camp';
ALTER TYPE "rollup" ADD VALUE 'kroma';
ALTER TYPE "rollup" ADD VALUE 'metal';
ALTER TYPE "rollup" ADD VALUE 'pgn';
