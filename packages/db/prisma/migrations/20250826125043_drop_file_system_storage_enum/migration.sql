/*
  Warnings:

  - The values [file_system] on the enum `blob_storage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "blob_storage_new" AS ENUM ('google', 'postgres', 'swarm', 'weavevm', 's3');
ALTER TABLE "blob_data_storage_reference" ALTER COLUMN "storage" TYPE "blob_storage_new" USING ("storage"::text::"blob_storage_new");
ALTER TYPE "blob_storage" RENAME TO "blob_storage_old";
ALTER TYPE "blob_storage_new" RENAME TO "blob_storage";
DROP TYPE "blob_storage_old";
COMMIT;
