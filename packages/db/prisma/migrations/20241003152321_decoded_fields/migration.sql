-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "decoded_fields" JSONB NOT NULL DEFAULT '{}';
