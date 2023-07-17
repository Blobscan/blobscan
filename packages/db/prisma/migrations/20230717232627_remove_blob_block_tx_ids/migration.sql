/*
  Warnings:

  - The primary key for the `Blob` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Blob` table. All the data in the column will be lost.
  - The primary key for the `Block` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Block` table. All the data in the column will be lost.
  - The primary key for the `Transaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Blob_versionedHash_key" CASCADE;

-- DropIndex
DROP INDEX "Block_hash_key";

-- DropIndex
DROP INDEX "Transaction_hash_key" CASCADE;

-- AlterTable
ALTER TABLE "Blob" DROP CONSTRAINT "Blob_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Blob_pkey" PRIMARY KEY ("versionedHash");

-- AlterTable
ALTER TABLE "Block" DROP CONSTRAINT "Block_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("hash");

-- AlterTable
CREATE SEQUENCE indexermetadata_id_seq;
ALTER TABLE "IndexerMetadata" ALTER COLUMN "id" SET DEFAULT nextval('indexermetadata_id_seq');
ALTER SEQUENCE indexermetadata_id_seq OWNED BY "IndexerMetadata"."id";

-- AlterTable
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash");
