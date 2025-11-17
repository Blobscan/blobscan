-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "rollup" ADD VALUE 'codex';
ALTER TYPE "rollup" ADD VALUE 'flynet';
ALTER TYPE "rollup" ADD VALUE 'gravity';
ALTER TYPE "rollup" ADD VALUE 'hpp';
ALTER TYPE "rollup" ADD VALUE 'katana';
ALTER TYPE "rollup" ADD VALUE 'lachain';
ALTER TYPE "rollup" ADD VALUE 'lighter';
ALTER TYPE "rollup" ADD VALUE 'pegglecoin';
ALTER TYPE "rollup" ADD VALUE 'plume';
ALTER TYPE "rollup" ADD VALUE 'powerloom';
ALTER TYPE "rollup" ADD VALUE 'settlus';
ALTER TYPE "rollup" ADD VALUE 'spire';
ALTER TYPE "rollup" ADD VALUE 'symbiosis';
