-- CreateEnum
CREATE TYPE "BlobStorage" AS ENUM ('google', 'postgres', 'swarm');

-- CreateTable
CREATE TABLE "BlobData" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "BlobData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlobDataStorageReference" (
    "blobHash" TEXT NOT NULL,
    "blobStorage" "BlobStorage" NOT NULL,
    "dataReference" TEXT NOT NULL,

    CONSTRAINT "BlobDataStorageReference_pkey" PRIMARY KEY ("blobHash","blobStorage")
);

-- AddForeignKey
ALTER TABLE "BlobDataStorageReference" ADD CONSTRAINT "BlobDataStorageReference_blobHash_fkey" FOREIGN KEY ("blobHash") REFERENCES "Blob"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;
