-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "rollup" ADD VALUE 'abstract';
ALTER TYPE "rollup" ADD VALUE 'arenaz';
ALTER TYPE "rollup" ADD VALUE 'bob';
ALTER TYPE "rollup" ADD VALUE 'debankchain';
ALTER TYPE "rollup" ADD VALUE 'ethernity';
ALTER TYPE "rollup" ADD VALUE 'fuel';
ALTER TYPE "rollup" ADD VALUE 'hashkey';
ALTER TYPE "rollup" ADD VALUE 'ink';
ALTER TYPE "rollup" ADD VALUE 'kinto';
ALTER TYPE "rollup" ADD VALUE 'lambda';
ALTER TYPE "rollup" ADD VALUE 'lisk';
ALTER TYPE "rollup" ADD VALUE 'mint';
ALTER TYPE "rollup" ADD VALUE 'morph';
ALTER TYPE "rollup" ADD VALUE 'nal';
ALTER TYPE "rollup" ADD VALUE 'polynomial';
ALTER TYPE "rollup" ADD VALUE 'race';
ALTER TYPE "rollup" ADD VALUE 'river';
ALTER TYPE "rollup" ADD VALUE 'shape';
ALTER TYPE "rollup" ADD VALUE 'snaxchain';
ALTER TYPE "rollup" ADD VALUE 'soneium';
ALTER TYPE "rollup" ADD VALUE 'superlumio';
ALTER TYPE "rollup" ADD VALUE 'superseed';
ALTER TYPE "rollup" ADD VALUE 'swanchain';
ALTER TYPE "rollup" ADD VALUE 'swellchain';
ALTER TYPE "rollup" ADD VALUE 'thebinaryholdings';
ALTER TYPE "rollup" ADD VALUE 'unichain';
ALTER TYPE "rollup" ADD VALUE 'world';
ALTER TYPE "rollup" ADD VALUE 'zeronetwork';
ALTER TYPE "rollup" ADD VALUE 'zircuit';
